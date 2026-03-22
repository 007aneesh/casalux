/**
 * Reviews router — host response endpoint.
 * PRD Section 9.
 *
 * PATCH /api/v1/reviews/:id/response — host responds to a guest review
 *
 * Note: Guest writes a review via POST /api/v1/bookings/:id/review (see bookings.ts)
 *       Public listing reviews are at GET /api/v1/listings/:id/reviews (see listings.ts)
 *       Guest's own reviews are at GET /api/v1/users/me/reviews (see users.ts)
 */
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { ReviewService }    from '../services/review.service.js'
import { ReviewController } from '../controllers/review.controller.js'
import { cacheService, queueService } from '../container.js'

const service    = new ReviewService(cacheService, queueService)
const controller = new ReviewController(service)

export const reviewsRouter = new Hono()

// Host responds to a review they received
reviewsRouter.patch('/:id/response', requireAuth(), (c) => controller.respondToReview(c))
