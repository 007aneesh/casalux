/**
 * Bookings router — Instant Book flow + booking management.
 * PRD Addendum Sections 3, 6.1, 6.3.
 *
 * Guest endpoints:
 *   POST  /api/v1/bookings/initiate              — Instant Book: create booking + payment order
 *   GET   /api/v1/bookings/:id                   — Full booking detail
 *   GET   /api/v1/bookings/:id/status            — Lightweight status poll
 *   GET   /api/v1/bookings/:id/cancellation-preview
 *   POST  /api/v1/bookings/:id/cancel
 *
 * Host endpoints (mounted under /api/v1/host — see host.ts):
 *   GET   /api/v1/host/bookings
 *   GET   /api/v1/host/bookings/:id
 *   POST  /api/v1/host/bookings/:id/cancel
 *
 * Users/me endpoint (mounted under /api/v1/users — see users.ts):
 *   GET   /api/v1/users/me/bookings
 */
import { Hono } from 'hono'
import { BookingService } from '../services/booking.service.js'
import { BookingController } from '../controllers/booking.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { cacheService, paymentService, queueService } from '../container.js'

// ─── Shared service + controller instance ─────────────────────────────────────
const service    = new BookingService(cacheService, paymentService, queueService)
const controller = new BookingController(service)

export { service as bookingService, controller as bookingController }

export const bookingsRouter = new Hono()

// POST /initiate  — Instant Book
bookingsRouter.post('/initiate', requireAuth(), (c) => controller.initiateBooking(c))

// GET /:id/status  — before /:id to avoid param collision
bookingsRouter.get('/:id/status',               requireAuth(), (c) => controller.getBookingStatus(c))
bookingsRouter.get('/:id/cancellation-preview', requireAuth(), (c) => controller.getCancellationPreview(c))
bookingsRouter.post('/:id/cancel',              requireAuth(), (c) => controller.cancelBooking(c))
bookingsRouter.get('/:id',                      requireAuth(), (c) => controller.getBooking(c))
