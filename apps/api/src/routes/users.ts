/**
 * Users router — /api/v1/users/me/* endpoints.
 * PRD Addendum Sections 6.1, 6.2.
 *
 * GET  /api/v1/users/me/bookings          — guest's booking history
 * GET  /api/v1/users/me/booking-requests  — guest's booking request history
 */
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { bookingController } from './bookings.js'

export const usersRouter = new Hono()

usersRouter.get('/me/bookings',          requireAuth(), (c) => bookingController.getMyBookings(c))
usersRouter.get('/me/booking-requests',  requireAuth(), (c) => bookingController.getMyRequests(c))
