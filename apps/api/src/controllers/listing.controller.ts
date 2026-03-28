/**
 * ListingController — HTTP request/response layer for all listing endpoints.
 * PRD Section 2.2 — Zod validation on every request. Success/error envelopes.
 * Controller never touches DB directly — delegates to ListingService.
 */
import type { Context } from 'hono'
import { z } from 'zod'
import type { ListingStatus } from '@casalux/db'
import type { ListingSearchParams } from '@casalux/types'
import type { ListingService } from '../services/listing.service.js'
import { ListingRepository } from '../repositories/listing.repository.js'

// Shared repo instance for host read-only queries inside controller
const sharedRepo = new ListingRepository()

// ─── Zod schemas ──────────────────────────────────────────────────────────────
const addressSchema = z.object({
  street:  z.string().min(1),
  city:    z.string().min(1),
  state:   z.string().min(1),
  country: z.string().min(1),
  zip:     z.string().min(1),
})

const createListingSchema = z.object({
  title:              z.string().min(3).max(100),
  description:        z.string().min(20).max(5000),
  propertyType:       z.enum(['apartment', 'house', 'villa', 'cabin', 'unique', 'hotel']),
  roomType:           z.enum(['entire_place', 'private_room', 'shared_room']),
  address:            addressSchema,
  lat:                z.number().optional(),
  lng:                z.number().optional(),
  amenities:          z.array(z.string()).optional(),
  basePrice:          z.number().int().positive(),
  currency:           z.string().length(3).optional(),
  cleaningFee:        z.number().int().min(0).optional(),
  minNights:          z.number().int().min(1).optional(),
  maxNights:          z.number().int().min(1).nullable().optional(),
  maxGuests:          z.number().int().min(1),
  bedrooms:           z.number().int().min(0).optional(),
  beds:               z.number().int().min(0).optional(),
  baths:              z.number().int().min(0).optional(),
  instantBook:        z.boolean().optional(),
  checkInTime:        z.string().regex(/^\d{2}:\d{2}$/).optional(),
  checkOutTime:       z.string().regex(/^\d{2}:\d{2}$/).optional(),
  cancellationPolicy: z.enum(['flexible', 'moderate', 'strict', 'super_strict']).optional(),
  requireVerifiedId:       z.boolean().optional(),
  requireProfilePhoto:     z.boolean().optional(),
  requirePositiveReviews:  z.boolean().optional(),
})

const updateListingSchema = createListingSchema.partial()

const listingQuerySchema = z.object({
  location:           z.string().optional(),
  lat:                z.coerce.number().optional(),
  lng:                z.coerce.number().optional(),
  radius:             z.coerce.number().int().positive().optional(),
  checkIn:            z.string().optional(),
  checkOut:           z.string().optional(),
  guests:             z.coerce.number().int().positive().optional(),
  minPrice:           z.coerce.number().int().min(0).optional(),
  maxPrice:           z.coerce.number().int().min(0).optional(),
  propertyType:       z.string().transform((v) => v.split(',').filter(Boolean)).optional(),
  roomType:           z.string().transform((v) => v.split(',').filter(Boolean)).optional(),
  amenities:          z.string().transform((v) => v.split(',').filter(Boolean)).optional(),
  minBedrooms:        z.coerce.number().int().min(0).optional(),
  minBeds:            z.coerce.number().int().min(0).optional(),
  minBaths:           z.coerce.number().int().min(0).optional(),
  instantBook:        z.string().transform((v) => v === 'true').optional(),
  petFriendly:        z.string().transform((v) => v === 'true').optional(),
  selfCheckIn:        z.string().transform((v) => v === 'true').optional(),
  minRating:          z.coerce.number().min(0).max(5).optional(),
  cancellationPolicy: z.enum(['flexible', 'moderate', 'strict', 'super_strict']).optional(),
  quickFilter:        z.string().optional(),
  sortBy:             z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'distance']).optional(),
  page:               z.coerce.number().int().min(1).optional(),
  limit:              z.coerce.number().int().min(1).max(50).optional(),
})

const pricingPreviewSchema = z.object({
  checkIn:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests:    z.coerce.number().int().min(1),
  promoCode: z.string().optional(),
})

const availabilityQuerySchema = z.object({
  year:  z.coerce.number().int().min(2024),
  month: z.coerce.number().int().min(1).max(12),
})

const availabilityRuleSchema = z.object({
  type:      z.enum(['blocked', 'available', 'min_nights_override', 'price_override', 'advance_notice', 'preparation_time']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value:     z.number().int().optional(),
  notes:     z.string().optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'archived']),
})

// ─── Controller ───────────────────────────────────────────────────────────────
export class ListingController {
  constructor(private service: ListingService) {}

  // GET /api/v1/listings
  async getListings(c: Context) {
    const parsed = listingQuerySchema.safeParse(Object.fromEntries(new URLSearchParams(c.req.url.split('?')[1] ?? '')))
    if (!parsed.success) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } }, 400)
    }

    // Geocode location string → lat/lng if needed
    let params = parsed.data
    if (params.location && !params.lat) {
      const geo = await this.geocodeLocation(params.location)
      if (geo) {
        params = { ...params, lat: geo.lat, lng: geo.lng }
      }
    }

    // Cast string[] arrays to their typed enum arrays — validated by Zod already
    const result = await this.service.getListings(params as unknown as ListingSearchParams)
    return c.json(result)
  }

  // GET /api/v1/listings/:id
  async getListingById(c: Context) {
    const id = c.req.param('id') as string
    const listing = await this.service.getListingById(id)

    if (!listing) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
    }

    return c.json({ success: true, data: listing })
  }

  // GET /api/v1/listings/:id/availability
  async getAvailability(c: Context) {
    const id = c.req.param('id')
    const parsed = availabilityQuerySchema.safeParse(Object.fromEntries(new URLSearchParams(c.req.url.split('?')[1] ?? '')))
    if (!parsed.success) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } }, 400)
    }

    const { year, month } = parsed.data
    const result = await this.service.getAvailability(id, year, month)

    if (!result) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
    }

    return c.json({ success: true, data: result })
  }

  // GET /api/v1/listings/:id/pricing-preview
  async getPricingPreview(c: Context) {
    const id = c.req.param('id')
    const parsed = pricingPreviewSchema.safeParse(Object.fromEntries(new URLSearchParams(c.req.url.split('?')[1] ?? '')))
    if (!parsed.success) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } }, 400)
    }

    try {
      const result = await this.service.getPricingPreview(
        id,
        parsed.data.checkIn,
        parsed.data.checkOut,
        parsed.data.guests,
        parsed.data.promoCode
      )

      if (!result) {
        return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
      }

      return c.json({ success: true, data: result })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'UNKNOWN'
      if (msg === 'INVALID_DATES')    return c.json({ success: false, error: { code: 'INVALID_DATES',    message: 'checkOut must be after checkIn' } }, 400)
      if (msg === 'TOO_MANY_GUESTS')  return c.json({ success: false, error: { code: 'TOO_MANY_GUESTS',  message: 'Guest count exceeds listing capacity' } }, 400)
      throw err
    }
  }

  // GET /api/v1/listings/:id/reviews
  async getReviews(c: Context) {
    const id  = c.req.param('id')
    const page    = parseInt(c.req.query('page')  ?? '1',  10)
    const limit   = parseInt(c.req.query('limit') ?? '10', 10)
    const result  = await this.service.getReviews(id, page, limit)
    return c.json({ success: true, ...result })
  }

  // GET /api/v1/listings/quick-filters
  async getQuickFilters(c: Context) {
    const result = await this.service.getQuickFilters()
    return c.json({ success: true, data: result })
  }

  // GET /api/v1/listings/recommended
  async getRecommended(c: Context) {
    const authUser = c.get('authUser')
    const lat      = c.req.query('lat')   ? parseFloat(c.req.query('lat')!)   : undefined
    const lng      = c.req.query('lng')   ? parseFloat(c.req.query('lng')!)   : undefined
    const limit    = parseInt(c.req.query('limit') ?? '20', 10)
    const type     = c.req.query('type') ?? undefined

    const result = await this.service.getRecommended(
      authUser?.userId ?? 'anonymous',
      lat,
      lng,
      limit,
      type
    )
    return c.json({ success: true, data: result })
  }

  // ─── Host routes ──────────────────────────────────────────────────────────

  // POST /api/v1/host/listings
  async createListing(c: Context) {
    const authUser = c.get('authUser')
    const body     = await c.req.json()
    const parsed   = createListingSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } }, 400)
    }

    const input = {
      ...parsed.data,
      maxNights: parsed.data.maxNights ?? undefined,
    }
    const listing = await this.service.createListing(authUser.userId, input)
    return c.json({ success: true, data: this.service.shapeListing(listing) }, 201)
  }

  // GET /api/v1/host/listings
  async getHostListings(c: Context) {
    const authUser = c.get('authUser')
    const page     = parseInt(c.req.query('page')   ?? '1',  10)
    const limit    = parseInt(c.req.query('limit')  ?? '20', 10)
    const status   = c.req.query('status') as ListingStatus | undefined

    const { listings, total } = await sharedRepo.findMany({
      hostId: authUser.userId,
      status,
      page,
      limit,
    })

    return c.json({
      success: true,
      data: listings.map((l: any) => this.service.shapeListing(l)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  }

  // GET /api/v1/host/listings/:id
  async getHostListingById(c: Context) {
    const authUser = c.get('authUser')
    const id   = c.req.param('id')

    const listing = await sharedRepo.findByIdForHost(id, authUser.userId)

    if (!listing) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
    }

    return c.json({ success: true, data: this.service.shapeListing(listing) })
  }

  // PUT /api/v1/host/listings/:id
  async updateListing(c: Context) {
    const authUser = c.get('authUser')
    const id   = c.req.param('id')
    const body     = await c.req.json()
    const parsed   = updateListingSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } }, 400)
    }

    try {
      const listing = await this.service.updateListing(id, authUser.userId, parsed.data)
      return c.json({ success: true, data: this.service.shapeListing(listing) })
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
      }
      throw err
    }
  }

  // PATCH /api/v1/host/listings/:id/status
  async updateStatus(c: Context) {
    const authUser = c.get('authUser')
    const id   = c.req.param('id')
    const body     = await c.req.json()
    const parsed   = updateStatusSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } }, 400)
    }

    try {
      await this.service.updateStatus(id, authUser.userId, parsed.data.status as ListingStatus)
      return c.json({ success: true, data: { message: 'Status updated' } })
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
      }
      throw err
    }
  }

  // PUT /api/v1/host/listings/:id/availability
  async updateAvailability(c: Context) {
    const authUser = c.get('authUser')
    const id   = c.req.param('id')
    const body     = await c.req.json()

    const schema = z.object({ rules: z.array(availabilityRuleSchema) })
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } }, 400)
    }

    try {
      await this.service.updateAvailability(id, authUser.userId, parsed.data.rules)
      return c.json({ success: true, data: { message: 'Availability updated' } })
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
      }
      throw err
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────
  private async geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
    const apiKey = process.env['GOOGLE_MAPS_API_KEY']
    if (!apiKey) return null

    try {
      const query  = encodeURIComponent(location)
      const resp   = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${apiKey}`)
      const data   = await resp.json() as { results: Array<{ geometry: { location: { lat: number; lng: number } } }>; status: string }
      if (data.status === 'OK' && data.results[0]) {
        return data.results[0].geometry.location
      }
    } catch { /* fall through */ }

    return null
  }
}
