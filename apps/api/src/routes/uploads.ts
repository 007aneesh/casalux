/**
 * Upload routes — PRD Section 3.1.3 (Client-Direct Upload Flow)
 *
 * POST /api/v1/uploads/sign    → generate Cloudinary signed params (no binary through server)
 * POST /api/v1/uploads/confirm → validate publicId + store in media_assets
 *
 * Binary data NEVER passes through the API server.
 * Client uploads directly to Cloudinary, then confirms with us.
 */
import { Hono } from 'hono'
import { z }    from 'zod'
import { requireAuth, requireRole } from '@casalux/auth'
import { db }         from '@casalux/db'
import type { Prisma } from '@casalux/db'
import { CacheKeys }  from '@casalux/services-cache'
import { QUEUES }     from '@casalux/services-queue'
import { storageService, cacheService, queueService } from '../container.js'

export const uploadsRouter = new Hono()

// ─── POST /api/v1/uploads/sign ────────────────────────────────────────────────
const signSchema = z.object({
  folder:       z.enum(['listings', 'hosts', 'avatars']),
  resourceType: z.enum(['image', 'video', 'raw']).default('image'),
})

// Sign is auth-only — guests need it during onboarding before they become a host
uploadsRouter.post('/sign', requireAuth(), async (c) => {
  const body   = await c.req.json()
  const parsed = signSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } }, 400)
  }

  // Cast to CloudinaryAdapter which has generateSignedUploadParams
  const adapter = storageService as unknown as {
    generateSignedUploadParams(opts: { folder: string; resourceType: string }): Promise<{
      signature: string
      timestamp: number
      cloudName: string
      apiKey: string
      folder: string
    }>
  }

  const params = await adapter.generateSignedUploadParams({
    folder:       parsed.data.folder,
    resourceType: parsed.data.resourceType,
  })

  // Store pending upload job in Redis (10 min TTL — PRD Section 5.1)
  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  await cacheService.set(
    CacheKeys.uploadJob(jobId),
    JSON.stringify({ folder: parsed.data.folder, resourceType: parsed.data.resourceType }),
    600
  )

  return c.json({
    success: true,
    data: { ...params, jobId },
  })
})

// ─── POST /api/v1/uploads/confirm ─────────────────────────────────────────────
const confirmSchema = z.object({
  publicId:     z.string().min(1),
  url:          z.string().url(),
  secureUrl:    z.string().url(),
  resourceType: z.enum(['image', 'video', 'raw']),
  format:       z.string(),
  bytes:        z.number().int().positive(),
  width:        z.number().int().positive().optional(),
  height:       z.number().int().positive().optional(),
  entityType:   z.enum(['listing', 'host', 'user']),
  entityId:     z.string().min(1),
  isPrimary:    z.boolean().optional(),
  order:        z.number().int().min(0).optional(),
})

// Confirm requires host role — stores to DB and is only called from host listing edit flows
uploadsRouter.post('/confirm', requireAuth(), requireRole('host'), async (c) => {
  const body   = await c.req.json()
  const parsed = confirmSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } }, 400)
  }

  const { publicId, url, secureUrl, resourceType, format, bytes, width, height, entityType, entityId, isPrimary, order } = parsed.data

  // Validate publicId format — must match expected folder prefix
  const validPrefixes = ['listings/', 'hosts/', 'avatars/']
  const hasValidPrefix = validPrefixes.some((p) => publicId.startsWith(p))
  if (!hasValidPrefix) {
    return c.json({ success: false, error: { code: 'INVALID_PUBLIC_ID', message: 'publicId does not match an expected folder' } }, 400)
  }

  // Store asset record
  const asset = await db.mediaAsset.create({
    data: {
      publicId,
      url,
      secureUrl,
      resourceType,
      format,
      bytes,
      width,
      height,
      entityType,
      entityId,
      listingId: entityType === 'listing' ? entityId : null,
      isPrimary: isPrimary ?? false,
      order:     order ?? 0,
    },
  })

  // Sync image into listing.images JSON column so shapeListing / the host
  // listings page sees it immediately without a separate mediaAssets join.
  if (entityType === 'listing' && resourceType === 'image') {
    const listing = await db.listing.findUnique({
      where:  { id: entityId },
      select: { images: true },
    })

    if (listing) {
      const existing = (listing.images ?? []) as Array<Record<string, unknown>>
      const newImage = {
        publicId,
        url:       secureUrl ?? url,
        width:     width  ?? 0,
        height:    height ?? 0,
        isPrimary: isPrimary ?? existing.length === 0, // first image is always cover
        order:     order ?? existing.length,
      }
      await db.listing.update({
        where: { id: entityId },
        data:  { images: [...existing, newImage] as unknown as Prisma.InputJsonValue[] },
      })
    }
  }

  // Enqueue thumbnail generation for images
  if (resourceType === 'image') {
    await queueService.enqueue(QUEUES.MEDIA_PROCESSING, {
      type: 'generate-thumbnails',
      data: { publicId, entityType, entityId, assetId: asset.id },
    })
  }

  return c.json({ success: true, data: asset }, 201)
})
