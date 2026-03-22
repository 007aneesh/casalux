/**
 * BookingController — HTTP request/response layer for booking + booking-request endpoints.
 * PRD Addendum Sections 6.1, 6.2, 6.3.
 * Controller never touches DB directly — delegates to BookingService.
 */
import type { Context } from 'hono'
import { z } from 'zod'
import type { BookingStatus, BookingRequestStatus, DeclineReason } from '@casalux/db'
import type { BookingService } from '../services/booking.service.js'

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const initiateBookingSchema = z.object({
  listingId:          z.string().uuid(),
  checkIn:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests:             z.number().int().min(1),
  promoCode:          z.string().optional(),
  agreedToHouseRules: z.boolean(),
})

const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
})

const createRequestSchema = z.object({
  listingId:    z.string().uuid(),
  checkIn:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests:       z.number().int().min(1),
  guestMessage: z.string().max(1000).optional(),
})

const approveRequestSchema = z.object({
  hostMessage: z.string().max(1000).optional(),
})

const declineRequestSchema = z.object({
  declineReason: z.enum(['dates_unavailable', 'guests_dont_fit', 'not_a_good_fit', 'other']),
  hostMessage:   z.string().max(1000).optional(),
})

const preApproveSchema = z.object({
  guestId:   z.string(),
  listingId: z.string().uuid(),
  checkIn:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  message:   z.string().max(1000).optional(),
})

const paginationSchema = z.object({
  page:   z.coerce.number().int().min(1).optional(),
  limit:  z.coerce.number().int().min(1).max(50).optional(),
  status: z.string().optional(),
})

// ─── Controller ───────────────────────────────────────────────────────────────
export class BookingController {
  constructor(private service: BookingService) {}

  // ─── Guest: Instant Book ─────────────────────────────────────────────────

  // POST /api/v1/bookings/initiate
  async initiateBooking(c: Context) {
    const authUser = c.get('authUser')
    const body     = await c.req.json()
    const parsed   = initiateBookingSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } }, 400)
    }

    try {
      const result = await this.service.initiateInstantBook(authUser.userId, parsed.data)
      return c.json({ success: true, data: result }, 201)
    } catch (err) {
      return this.handleBookingError(c, err)
    }
  }

  // GET /api/v1/bookings/:id
  async getBooking(c: Context) {
    const authUser = c.get('authUser')
    const id       = c.req.param('id') as string

    const booking = await this.service.getBookingById(id, authUser.userId, authUser.role)
    if (!booking) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } }, 404)
    }

    return c.json({ success: true, data: booking })
  }

  // GET /api/v1/bookings/:id/status  (lightweight poll)
  async getBookingStatus(c: Context) {
    const authUser = c.get('authUser')
    const id       = c.req.param('id') as string

    const booking = await this.service.getBookingById(id, authUser.userId, authUser.role)
    if (!booking) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } }, 404)
    }

    return c.json({ success: true, data: { id: booking.id, status: booking.status } })
  }

  // GET /api/v1/users/me/bookings
  async getMyBookings(c: Context) {
    const authUser = c.get('authUser')
    const parsed   = paginationSchema.safeParse(Object.fromEntries(new URLSearchParams(c.req.url.split('?')[1] ?? '')))

    const page   = parsed.data?.page  ?? 1
    const limit  = parsed.data?.limit ?? 20
    const status = parsed.data?.status as BookingStatus | undefined

    const result = await this.service.getGuestBookings(authUser.userId, { status, page, limit })
    return c.json({
      success: true,
      data:    result.data,
      meta:    { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    })
  }

  // GET /api/v1/bookings/:id/cancellation-preview
  async getCancellationPreview(c: Context) {
    const authUser = c.get('authUser')
    const id       = c.req.param('id') as string

    try {
      const preview = await this.service.getCancellationPreview(id, authUser.userId)
      return c.json({ success: true, data: preview })
    } catch (err) {
      return this.handleBookingError(c, err)
    }
  }

  // POST /api/v1/bookings/:id/cancel
  async cancelBooking(c: Context) {
    const authUser = c.get('authUser')
    const id       = c.req.param('id') as string
    const body     = await c.req.json().catch(() => ({}))
    const parsed   = cancelBookingSchema.safeParse(body)

    try {
      const result = await this.service.cancelBookingAsGuest(id, authUser.userId, parsed.data?.reason)
      return c.json({ success: true, data: result })
    } catch (err) {
      return this.handleBookingError(c, err)
    }
  }

  // POST /api/v1/bookings/:id/message  (handled in messages controller — stub here)
  async sendMessage(c: Context) {
    return c.json({ success: false, error: { code: 'USE_MESSAGES_ENDPOINT', message: 'Use /api/v1/messages/threads/:threadId' } }, 400)
  }

  // ─── Guest: Booking Requests ─────────────────────────────────────────────

  // POST /api/v1/booking-requests
  async createRequest(c: Context) {
    const authUser = c.get('authUser')
    const body     = await c.req.json()
    const parsed   = createRequestSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } }, 400)
    }

    try {
      const result = await this.service.createBookingRequest(authUser.userId, parsed.data)
      return c.json({ success: true, data: result }, 201)
    } catch (err) {
      return this.handleBookingError(c, err)
    }
  }

  // GET /api/v1/booking-requests/:id
  async getRequest(c: Context) {
    const authUser = c.get('authUser')
    const id       = c.req.param('id') as string

    // Try guest first, then host (or admin)
    let request
    if (authUser.role === 'admin' || authUser.role === 'super_admin') {
      const repo = await import('../repositories/booking.repository.js')
      request    = await new repo.BookingRepository().findRequestById(id)
    } else {
      const repo = await import('../repositories/booking.repository.js')
      const r    = new repo.BookingRepository()
      request    = await r.findRequestByIdForGuest(id, authUser.userId)
        ?? await r.findRequestByIdForHost(id, authUser.userId)
    }

    if (!request) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking request not found' } }, 404)
    }

    return c.json({ success: true, data: request })
  }

  // GET /api/v1/users/me/booking-requests
  async getMyRequests(c: Context) {
    const authUser = c.get('authUser')
    const parsed   = paginationSchema.safeParse(Object.fromEntries(new URLSearchParams(c.req.url.split('?')[1] ?? '')))

    const page   = parsed.data?.page  ?? 1
    const limit  = parsed.data?.limit ?? 20
    const status = parsed.data?.status as BookingRequestStatus | undefined

    const result = await this.service.getGuestRequests(authUser.userId, { status, page, limit })
    return c.json({
      success: true,
      data:    result.data,
      meta:    { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    })
  }

  // POST /api/v1/booking-requests/:id/pay
  async payApprovedRequest(c: Context) {
    const authUser = c.get('authUser')
    const id       = c.req.param('id') as string

    try {
      const result = await this.service.payApprovedRequest(id, authUser.userId)
      return c.json({ success: true, data: result }, 201)
    } catch (err) {
      return this.handleBookingError(c, err)
    }
  }

  // DELETE /api/v1/booking-requests/:id/cancel
  async cancelRequest(c: Context) {
    const authUser = c.get('authUser')
    const id       = c.req.param('id') as string

    try {
      const result = await this.service.cancelBookingRequest(id, authUser.userId)
      return c.json({ success: true, data: result })
    } catch (err) {
      return this.handleBookingError(c, err)
    }
  }

  // ─── Host: Booking management ────────────────────────────────────────────

  // GET /api/v1/host/bookings
  async getHostBookings(c: Context) {
    const authUser = c.get('authUser')
    const parsed   = paginationSchema.safeParse(Object.fromEntries(new URLSearchParams(c.req.url.split('?')[1] ?? '')))

    const page   = parsed.data?.page  ?? 1
    const limit  = parsed.data?.limit ?? 20
    const status = parsed.data?.status as BookingStatus | undefined

    const result = await this.service.getHostBookings(authUser.userId, { status, page, limit })
    return c.json({
      success: true,
      data:    result.data,
      meta:    { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    })
  }

  // GET /api/v1/host/bookings/:id
  async getHostBookingById(c: Context) {
    const authUser = c.get('authUser')
    const id       = c.req.param('id') as string

    const booking = await this.service.getBookingById(id, authUser.userId, authUser.role)
    if (!booking) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } }, 404)
    }

    return c.json({ success: true, data: booking })
  }

  // POST /api/v1/host/bookings/:id/cancel
  async cancelBookingAsHost(c: Context) {
    const authUser = c.get('authUser')
    const id       = c.req.param('id') as string
    const body     = await c.req.json().catch(() => ({}))
    const parsed   = cancelBookingSchema.safeParse(body)

    try {
      const result = await this.service.cancelBookingAsHost(id, authUser.userId, parsed.data?.reason)
      return c.json({ success: true, data: result })
    } catch (err) {
      return this.handleBookingError(c, err)
    }
  }

  // ─── Host: Booking Request management ────────────────────────────────────

  // GET /api/v1/host/booking-requests
  async getHostRequests(c: Context) {
    const authUser = c.get('authUser')
    const parsed   = paginationSchema.safeParse(Object.fromEntries(new URLSearchParams(c.req.url.split('?')[1] ?? '')))

    const page   = parsed.data?.page  ?? 1
    const limit  = parsed.data?.limit ?? 20
    const status = parsed.data?.status as BookingRequestStatus | undefined

    const result = await this.service.getHostRequests(authUser.userId, { status, page, limit })
    return c.json({
      success: true,
      data:    result.data,
      meta:    { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    })
  }

  // GET /api/v1/host/booking-requests/pending
  async getPendingRequests(c: Context) {
    const authUser = c.get('authUser')
    const parsed   = paginationSchema.safeParse(Object.fromEntries(new URLSearchParams(c.req.url.split('?')[1] ?? '')))

    const page  = parsed.data?.page  ?? 1
    const limit = parsed.data?.limit ?? 20

    const result = await this.service.getHostRequests(authUser.userId, { page, limit, pendingOnly: true })
    return c.json({
      success: true,
      data:    result.data,
      meta:    { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    })
  }

  // POST /api/v1/host/booking-requests/:id/approve
  async approveRequest(c: Context) {
    const authUser = c.get('authUser')
    const id       = c.req.param('id') as string
    const body     = await c.req.json().catch(() => ({}))
    const parsed   = approveRequestSchema.safeParse(body)

    try {
      const result = await this.service.approveBookingRequest(id, authUser.userId, parsed.data?.hostMessage)
      return c.json({ success: true, data: result })
    } catch (err) {
      return this.handleBookingError(c, err)
    }
  }

  // POST /api/v1/host/booking-requests/:id/decline
  async declineRequest(c: Context) {
    const authUser = c.get('authUser')
    const id       = c.req.param('id') as string
    const body     = await c.req.json()
    const parsed   = declineRequestSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } }, 400)
    }

    try {
      const result = await this.service.declineBookingRequest(id, authUser.userId, {
        declineReason: parsed.data.declineReason as DeclineReason,
        hostMessage:   parsed.data.hostMessage,
      })
      return c.json({ success: true, data: result })
    } catch (err) {
      return this.handleBookingError(c, err)
    }
  }

  // POST /api/v1/host/booking-requests/pre-approve
  async preApproveRequest(c: Context) {
    const authUser = c.get('authUser')
    const body     = await c.req.json()
    const parsed   = preApproveSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } }, 400)
    }

    try {
      const result = await this.service.createPreApproval(authUser.userId, parsed.data)
      return c.json({ success: true, data: result }, 201)
    } catch (err) {
      return this.handleBookingError(c, err)
    }
  }

  // ─── Private: unified error handler ──────────────────────────────────────

  private handleBookingError(c: Context, err: unknown) {
    const msg = err instanceof Error ? err.message : 'UNKNOWN'

    const map: Record<string, [string, string, number]> = {
      LISTING_NOT_FOUND:      ['NOT_FOUND',            'Listing not found',                          404],
      NOT_FOUND:              ['NOT_FOUND',            'Resource not found',                         404],
      NOT_INSTANT_BOOK:       ['NOT_INSTANT_BOOK',     'This listing uses Request-to-Book',          400],
      USE_INSTANT_BOOK:       ['USE_INSTANT_BOOK',     'This listing supports Instant Book',         400],
      LISTING_UNAVAILABLE:    ['LISTING_UNAVAILABLE',  'Listing is not available for booking',       400],
      INVALID_DATES:          ['INVALID_DATES',        'Check-out must be after check-in',           400],
      DATES_UNAVAILABLE:      ['DATES_UNAVAILABLE',    'Selected dates are not available',           409],
      DATES_BEING_BOOKED:     ['DATES_BEING_BOOKED',   'These dates are being booked by another guest', 409],
      DUPLICATE_REQUEST:      ['DUPLICATE_REQUEST',    'You already have a pending request for these dates', 409],
      GUEST_UNVERIFIED:       ['GUEST_UNVERIFIED',     'Verified ID is required to book this listing', 403],
      GUEST_NO_PHOTO:         ['GUEST_NO_PHOTO',       'A profile photo is required to book this listing', 403],
      GUEST_NO_REVIEWS:       ['GUEST_NO_REVIEWS',     'Positive review history is required to book this listing', 403],
      NOT_CANCELLABLE:        ['NOT_CANCELLABLE',      'This booking cannot be cancelled in its current state', 400],
      REQUEST_NOT_PENDING:    ['REQUEST_NOT_PENDING',  'Request is no longer pending',               400],
      REQUEST_EXPIRED:        ['REQUEST_EXPIRED',      'This request has expired',                   400],
      REQUEST_NOT_APPROVED:   ['REQUEST_NOT_APPROVED', 'Request has not been approved',              400],
      REQUEST_NOT_CANCELLABLE: ['REQUEST_NOT_CANCELLABLE', 'Request cannot be cancelled',            400],
      PAYMENT_WINDOW_EXPIRED: ['PAYMENT_WINDOW_EXPIRED', 'Payment window has expired',               400],
      FORBIDDEN:              ['FORBIDDEN',            'Access denied',                              403],
    }

    const [code, message, status] = map[msg] ?? ['INTERNAL_ERROR', 'An unexpected error occurred', 500]
    return c.json({ success: false, error: { code, message } }, status as 400 | 403 | 404 | 409 | 500)
  }
}
