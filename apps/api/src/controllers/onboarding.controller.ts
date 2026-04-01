/**
 * OnboardingController — HTTP layer for the 8-step host onboarding flow.
 * PRD Section 12.
 *
 * Step routes (all PATCH except start/photos/submit):
 *   POST  /host/onboarding/start                       → Step 1
 *   GET   /host/onboarding/:sessionId                  → progress check
 *   PATCH /host/onboarding/:sessionId/space            → Step 2
 *   PATCH /host/onboarding/:sessionId/amenities        → Step 3
 *   POST  /host/onboarding/:sessionId/photos           → Step 4
 *   PATCH /host/onboarding/:sessionId/details          → Step 5
 *   PATCH /host/onboarding/:sessionId/pricing          → Step 6
 *   PATCH /host/onboarding/:sessionId/availability     → Step 7
 *   POST  /host/onboarding/:sessionId/submit           → Step 8
 *
 * Admin routes (mounted under /admin):
 *   GET   /admin/host-applications                     → listSubmitted
 *   POST  /admin/host-applications/:sessionId/approve  → approve
 *   POST  /admin/host-applications/:sessionId/reject   → reject
 */
import type { Context } from 'hono'
import { z } from 'zod'
import type { OnboardingService } from '../services/onboarding.service.js'

function handleOnboardingError(err: unknown, c: Context) {
  const msg = err instanceof Error ? err.message : ''
  if (msg === 'SESSION_NOT_FOUND')          return c.json({ error: 'Session not found' }, 404)
  if (msg === 'SESSION_ALREADY_SUBMITTED')  return c.json({ error: 'Session already submitted' }, 409)
  if (msg === 'APPLICATION_UNDER_REVIEW')   return c.json({ error: 'APPLICATION_UNDER_REVIEW', message: 'Your application is under review' }, 409)
  if (msg === 'APPLICATION_ALREADY_APPROVED') return c.json({ error: 'APPLICATION_ALREADY_APPROVED', message: 'Your application has been approved' }, 409)
  if (msg.startsWith('Incomplete'))         return c.json({ error: msg }, 422)
  if (msg.startsWith('Base price'))         return c.json({ error: msg }, 422)
  if (msg.startsWith('At least one'))       return c.json({ error: msg }, 422)
  if (msg.startsWith('Application is'))     return c.json({ error: msg }, 409)
  console.error('[OnboardingController]', err)
  return c.json({ error: 'Internal server error' }, 500)
}

const spaceSchema = z.object({
  propertyType: z.string().min(1),
  roomType:     z.string().min(1),
  maxGuests:    z.number().int().min(1).max(50),
  bedrooms:     z.number().int().min(0).optional(),
  beds:         z.number().int().min(1).optional(),
  baths:        z.number().min(0).optional(),
  // address stored as structured object: { street, city, state, country, postalCode, ... }
  address:      z.record(z.string()),
  lat:          z.number().optional(),
  lng:          z.number().optional(),
})

const amenitiesSchema = z.object({
  amenities: z.array(z.string().min(1)).min(1),
})

const photosSchema = z.object({
  photos: z.array(z.object({
    publicId:  z.string().min(1),
    url:       z.string().url(),
    isPrimary: z.boolean(),
  })).min(1),
})

const detailsSchema = z.object({
  title:       z.string().min(5).max(100),
  description: z.string().min(20).max(3000),
})

const pricingSchema = z.object({
  basePrice:           z.number().int().min(100),   // paise
  currency:            z.string().length(3).optional(),
  cleaningFee:         z.number().int().min(0).optional(),
  cancellationPolicy:  z.enum(['flexible', 'moderate', 'strict']),
})

const availabilitySchema = z.object({
  instantBook:   z.boolean().optional(),
  checkInTime:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
  checkOutTime:  z.string().regex(/^\d{2}:\d{2}$/).optional(),
  minNights:     z.number().int().min(1).optional(),
  maxNights:     z.number().int().min(1).optional(),
  blockedDates:  z.array(z.object({ start: z.string(), end: z.string() })).optional(),
})

const rejectSchema = z.object({
  reason: z.string().min(10).max(500),
})

export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  /** GET /host/onboarding/status — returns the user's latest application status */
  async getMyStatus(c: Context): Promise<Response> {
    try {
      const clerkId = (c.get('authUser') as { userId: string }).userId
      const result  = await this.service.getMyStatus(clerkId)
      return c.json({ success: true, data: result })
    } catch (err) {
      return handleOnboardingError(err, c)
    }
  }

  /** POST /host/onboarding/start */
  async start(c: Context): Promise<Response> {
    try {
      const clerkId = (c.get('authUser') as { userId: string }).userId
      const session = await this.service.start(clerkId)
      return c.json({ session }, 201)
    } catch (err) {
      return handleOnboardingError(err, c)
    }
  }

  /** GET /host/onboarding/:sessionId */
  async getSession(c: Context): Promise<Response> {
    try {
      const clerkId   = (c.get('authUser') as { userId: string }).userId
      const sessionId = c.req.param('sessionId') as string
      const session   = await this.service.getSession(sessionId, clerkId)
      return c.json({ session })
    } catch (err) {
      return handleOnboardingError(err, c)
    }
  }

  /** PATCH /host/onboarding/:sessionId/space */
  async saveSpace(c: Context): Promise<Response> {
    try {
      const body   = await c.req.json() as unknown
      const parsed = spaceSchema.safeParse(body)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId   = (c.get('authUser') as { userId: string }).userId
      const sessionId = c.req.param('sessionId') as string
      const session   = await this.service.saveSpace(sessionId, clerkId, parsed.data)
      return c.json({ session })
    } catch (err) {
      return handleOnboardingError(err, c)
    }
  }

  /** PATCH /host/onboarding/:sessionId/amenities */
  async saveAmenities(c: Context): Promise<Response> {
    try {
      const body   = await c.req.json() as unknown
      const parsed = amenitiesSchema.safeParse(body)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId   = (c.get('authUser') as { userId: string }).userId
      const sessionId = c.req.param('sessionId') as string
      const session   = await this.service.saveAmenities(sessionId, clerkId, parsed.data.amenities)
      return c.json({ session })
    } catch (err) {
      return handleOnboardingError(err, c)
    }
  }

  /** POST /host/onboarding/:sessionId/photos */
  async savePhotos(c: Context): Promise<Response> {
    try {
      const body   = await c.req.json() as unknown
      const parsed = photosSchema.safeParse(body)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId   = (c.get('authUser') as { userId: string }).userId
      const sessionId = c.req.param('sessionId') as string
      const session   = await this.service.savePhotos(sessionId, clerkId, parsed.data.photos)
      return c.json({ session })
    } catch (err) {
      return handleOnboardingError(err, c)
    }
  }

  /** PATCH /host/onboarding/:sessionId/details */
  async saveDetails(c: Context): Promise<Response> {
    try {
      const body   = await c.req.json() as unknown
      const parsed = detailsSchema.safeParse(body)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId   = (c.get('authUser') as { userId: string }).userId
      const sessionId = c.req.param('sessionId') as string
      const session   = await this.service.saveDetails(sessionId, clerkId, parsed.data)
      return c.json({ session })
    } catch (err) {
      return handleOnboardingError(err, c)
    }
  }

  /** PATCH /host/onboarding/:sessionId/pricing */
  async savePricing(c: Context): Promise<Response> {
    try {
      const body   = await c.req.json() as unknown
      const parsed = pricingSchema.safeParse(body)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId   = (c.get('authUser') as { userId: string }).userId
      const sessionId = c.req.param('sessionId') as string
      const session   = await this.service.savePricing(sessionId, clerkId, parsed.data)
      return c.json({ session })
    } catch (err) {
      return handleOnboardingError(err, c)
    }
  }

  /** PATCH /host/onboarding/:sessionId/availability */
  async saveAvailability(c: Context): Promise<Response> {
    try {
      const body   = await c.req.json() as unknown
      const parsed = availabilitySchema.safeParse(body)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId   = (c.get('authUser') as { userId: string }).userId
      const sessionId = c.req.param('sessionId') as string
      const session   = await this.service.saveAvailability(sessionId, clerkId, parsed.data)
      return c.json({ session })
    } catch (err) {
      return handleOnboardingError(err, c)
    }
  }

  /** POST /host/onboarding/:sessionId/submit */
  async submit(c: Context): Promise<Response> {
    try {
      const clerkId   = (c.get('authUser') as { userId: string }).userId
      const sessionId = c.req.param('sessionId') as string
      const result    = await this.service.submit(sessionId, clerkId)
      return c.json(result)
    } catch (err) {
      return handleOnboardingError(err, c)
    }
  }

  // ── Admin endpoints ──────────────────────────────────────────────────────────

  /** GET /admin/host-applications */
  async listApplications(c: Context): Promise<Response> {
    try {
      const status = c.req.query('status') as string | undefined
      const applications = await this.service.listSubmitted(status)
      return c.json({ applications })
    } catch (err) {
      return handleOnboardingError(err, c)
    }
  }

  /** POST /admin/host-applications/:sessionId/approve */
  async approve(c: Context): Promise<Response> {
    try {
      const clerkId   = (c.get('authUser') as { userId: string }).userId
      const sessionId = c.req.param('sessionId') as string
      const result    = await this.service.approve(sessionId, clerkId)
      return c.json({ application: result })
    } catch (err) {
      return handleOnboardingError(err, c)
    }
  }

  /** POST /admin/host-applications/:sessionId/reject */
  async reject(c: Context): Promise<Response> {
    try {
      const body   = await c.req.json() as unknown
      const parsed = rejectSchema.safeParse(body)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId   = (c.get('authUser') as { userId: string }).userId
      const sessionId = c.req.param('sessionId') as string
      const result    = await this.service.reject(sessionId, clerkId, parsed.data.reason)
      return c.json({ application: result })
    } catch (err) {
      return handleOnboardingError(err, c)
    }
  }
}
