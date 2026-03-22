/**
 * Booking-Requests router — Request-to-Book flow.
 * PRD Addendum Sections 4, 6.2, 6.3.
 *
 * Guest endpoints:
 *   POST   /api/v1/booking-requests              — Create a booking request
 *   GET    /api/v1/booking-requests/:id          — Get request detail
 *   POST   /api/v1/booking-requests/:id/pay      — Pay after host approval
 *   DELETE /api/v1/booking-requests/:id/cancel   — Cancel a pending request
 *
 * Host endpoints (mounted under /api/v1/host — see host.ts):
 *   GET    /api/v1/host/booking-requests
 *   GET    /api/v1/host/booking-requests/pending
 *   POST   /api/v1/host/booking-requests/:id/approve
 *   POST   /api/v1/host/booking-requests/:id/decline
 *   POST   /api/v1/host/booking-requests/pre-approve
 *
 * Users/me endpoint (mounted under /api/v1/users — see users.ts):
 *   GET    /api/v1/users/me/booking-requests
 */
import { Hono } from 'hono'
import { bookingController } from './bookings.js'
import { requireAuth } from '../middleware/auth.js'

export const bookingRequestsRouter = new Hono()

// POST /  — Create booking request (RTB flow)
bookingRequestsRouter.post('/', requireAuth(), (c) => bookingController.createRequest(c))

// Specific sub-paths BEFORE /:id to avoid param collision
bookingRequestsRouter.post('/:id/pay',    requireAuth(), (c) => bookingController.payApprovedRequest(c))
bookingRequestsRouter.delete('/:id/cancel', requireAuth(), (c) => bookingController.cancelRequest(c))

// GET /:id — request detail
bookingRequestsRouter.get('/:id', requireAuth(), (c) => bookingController.getRequest(c))
