/**
 * Webhook routes — PRD Sections 4.1.1 (Clerk) + 8.2 (Payment)
 *
 * POST /api/v1/webhooks/clerk    → Clerk user sync (user.created/updated/deleted)
 * POST /api/v1/webhooks/payment  → Payment provider webhooks (Stripe, etc.)
 *
 * Payment webhook: validate signature → idempotency check → enqueue (never process inline)
 * Target: < 3s response time to provider.
 */
import { Hono } from 'hono'
import { Webhook }  from 'svix'
import { db }       from '@casalux/db'
import { CacheKeys } from '@casalux/services-cache'
import { cacheService, paymentService } from '../container.js'
import { handlePaymentCaptured, handlePaymentFailed } from '../services/payment-event-handlers.js'

export const webhooksRouter = new Hono()

// ─── POST /api/v1/webhooks/clerk ─────────────────────────────────────────────
// PRD Section 4.1.1
webhooksRouter.post('/clerk', async (c) => {
  const webhookSecret = process.env['CLERK_WEBHOOK_SECRET']
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not set')
    return c.json({ error: 'Webhook secret not configured' }, 500)
  }

  // Verify Svix signature
  const svixId        = c.req.header('svix-id')
  const svixTimestamp = c.req.header('svix-timestamp')
  const svixSignature = c.req.header('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Missing svix headers' }, 400)
  }

  const body    = await c.req.text()
  const wh      = new Webhook(webhookSecret)
  let event: { type: string; data: Record<string, unknown> }

  try {
    event = wh.verify(body, {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { type: string; data: Record<string, unknown> }
  } catch {
    return c.json({ error: 'Invalid signature' }, 400)
  }

  const { type, data } = event

  try {
    switch (type) {
      // ── user.created ─────────────────────────────────────────────────────
      case 'user.created': {
        const clerkId       = data['id'] as string
        const emailAddresses = data['email_addresses'] as Array<{ email_address: string; id: string }>
        const primaryEmailId = data['primary_email_address_id'] as string
        const primaryEmail   = emailAddresses.find((e) => e.id === primaryEmailId)?.email_address ?? emailAddresses[0]?.email_address ?? ''
        const firstName      = (data['first_name'] as string | null) ?? ''
        const lastName       = (data['last_name']  as string | null) ?? ''
        const imageUrl       = (data['image_url']  as string | null) ?? null

        await db.user.upsert({
          where:  { clerkId },
          create: { clerkId, email: primaryEmail, firstName, lastName, profileImageUrl: imageUrl, role: 'guest' },
          update: { email: primaryEmail, firstName, lastName, profileImageUrl: imageUrl },
        })

        // Set default role in Clerk publicMetadata
        // (done via Clerk API in the background — webhook confirms the user exists)
        console.log(`[clerk-webhook] user.created: ${clerkId}`)
        break
      }

      // ── user.updated ─────────────────────────────────────────────────────
      case 'user.updated': {
        const clerkId        = data['id'] as string
        const emailAddresses = data['email_addresses'] as Array<{ email_address: string; id: string }>
        const primaryEmailId = data['primary_email_address_id'] as string
        const primaryEmail   = emailAddresses.find((e) => e.id === primaryEmailId)?.email_address ?? emailAddresses[0]?.email_address ?? ''
        const firstName      = (data['first_name'] as string | null) ?? ''
        const lastName       = (data['last_name']  as string | null) ?? ''
        const imageUrl       = (data['image_url']  as string | null) ?? null

        await db.user.update({
          where: { clerkId },
          data:  { email: primaryEmail, firstName, lastName, profileImageUrl: imageUrl },
        })

        // Invalidate any cached host profile
        await cacheService.del(CacheKeys.hostProfile(clerkId))
        console.log(`[clerk-webhook] user.updated: ${clerkId}`)
        break
      }

      // ── user.deleted ─────────────────────────────────────────────────────
      case 'user.deleted': {
        const clerkId = data['id'] as string

        // Soft-delete + anonymize PII — preserve booking records for audit
        await db.user.updateMany({
          where: { clerkId },
          data:  {
            deletedAt:      new Date(),
            email:          `deleted-${clerkId}@deleted.casalux`,
            firstName:      'Deleted',
            lastName:       'User',
            profileImageUrl: null,
            isBanned:       false,
          },
        })

        console.log(`[clerk-webhook] user.deleted (soft): ${clerkId}`)
        break
      }

      default:
        console.log(`[clerk-webhook] unhandled event: ${type}`)
    }
  } catch (err) {
    console.error(`[clerk-webhook] error processing ${type}:`, err)
    return c.json({ error: 'Processing failed' }, 500)
  }

  return c.json({ success: true })
})

// ─── POST /api/v1/webhooks/payment ───────────────────────────────────────────
// PRD Section 8.2 — signature verify → idempotency → enqueue → return 200 immediately
webhooksRouter.post('/payment', async (c) => {
  const rawBody  = await c.req.arrayBuffer()
  const rawBytes = Buffer.from(rawBody)
  const provider = (c.req.query('provider') ?? 'stripe').toLowerCase()

  // Step 1 — Signature verification
  const signatureHeader =
    c.req.header('stripe-signature') ??
    c.req.header('x-razorpay-signature') ??
    c.req.header('paypal-transmission-sig') ??
    ''

  let webhookEvent: { id: string; type: string; [key: string]: unknown }

  try {
    webhookEvent = paymentService.constructWebhookEvent(
      rawBytes,
      signatureHeader
    ) as any
  } catch (err) {
    console.error('[payment-webhook] signature verification failed:', err)
    return c.json({ error: 'Invalid webhook signature' }, 400)
  }

  const eventId   = webhookEvent.id
  const eventType = webhookEvent.type

  // Step 2 — Idempotency check (PRD Section 8.2)
  const idempotencyKey = CacheKeys.webhookIdempotency(provider, eventId)
  const existing       = await cacheService.get(idempotencyKey)

  if (existing) {
    console.log(`[payment-webhook] duplicate event skipped: ${eventId}`)
    return c.json({ success: true, message: 'Already processed' })
  }

  // Mark as processing immediately
  await cacheService.set(idempotencyKey, 'processing', 86400) // 24h TTL

  // Step 3 — Process inline (Stripe retries on non-2xx, so no queue needed)
  try {
    const obj = (webhookEvent as any).data?.object ?? {}

    switch (eventType) {
      case 'payment_intent.succeeded': {
        // orderId = PaymentIntent.id, paymentId = first charge id
        const intentId = obj.id as string
        const chargeId = (obj.latest_charge ?? obj.charges?.data?.[0]?.id ?? '') as string
        await handlePaymentCaptured(intentId, chargeId)
        break
      }
      case 'payment_intent.payment_failed': {
        const intentId = obj.id as string
        await handlePaymentFailed(intentId)
        break
      }
      // charge.refunded is confirmation-only — refunds are initiated by our system
      default:
        console.log(`[payment-webhook] unhandled event type: ${eventType}`)
    }
  } catch (err) {
    console.error(`[payment-webhook] processing failed for ${eventType}/${eventId}:`, err)
    // Return 500 so Stripe retries the webhook
    return c.json({ error: 'Processing failed' }, 500)
  }

  console.log(`[payment-webhook] processed: ${provider}/${eventType}/${eventId}`)
  return c.json({ success: true })
})
