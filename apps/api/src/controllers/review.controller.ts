/**
 * ReviewController — HTTP layer for reviews.
 */
import type { Context } from 'hono'
import { z } from 'zod'
import type { ReviewService } from '../services/review.service.js'

function handleReviewError(err: unknown, c: Context) {
  const msg = err instanceof Error ? err.message : ''
  if (msg === 'BOOKING_NOT_FOUND_OR_NOT_COMPLETED') return c.json({ error: 'Booking not found or not completed' }, 404)
  if (msg === 'REVIEW_ALREADY_EXISTS')              return c.json({ error: 'You already submitted a review for this booking' }, 409)
  if (msg === 'REVIEW_NOT_FOUND')                   return c.json({ error: 'Review not found' }, 404)
  if (msg === 'HOST_ALREADY_RESPONDED')             return c.json({ error: 'Host has already responded to this review' }, 409)
  if (msg.startsWith('Rating') || msg.startsWith('Response')) return c.json({ error: msg }, 422)
  console.error('[ReviewController]', err)
  return c.json({ error: 'Internal server error' }, 500)
}

const writeReviewSchema = z.object({
  rating:             z.number().min(1).max(5),
  comment:            z.string().min(10).max(3000),
  cleanlinessRating:  z.number().min(1).max(5).optional(),
  accuracyRating:     z.number().min(1).max(5).optional(),
  locationRating:     z.number().min(1).max(5).optional(),
  checkInRating:      z.number().min(1).max(5).optional(),
  valueRating:        z.number().min(1).max(5).optional(),
})

export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  /** POST /api/v1/bookings/:id/review */
  async writeReview(c: Context): Promise<Response> {
    try {
      const body   = await c.req.json() as unknown
      const parsed = writeReviewSchema.safeParse(body)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId   = c.get('clerkId') as string
      const bookingId = c.req.param('id') as string

      const review = await this.service.writeReview({
        bookingId,
        guestClerkId: clerkId,
        ...parsed.data,
      })
      return c.json({ review }, 201)
    } catch (err) {
      return handleReviewError(err, c)
    }
  }

  /** PATCH /api/v1/reviews/:id/response — host responds */
  async respondToReview(c: Context): Promise<Response> {
    const schema = z.object({
      response: z.string().min(1).max(1500),
    })
    try {
      const body   = await c.req.json() as unknown
      const parsed = schema.safeParse(body)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId  = c.get('clerkId') as string
      const reviewId = c.req.param('id') as string

      const review = await this.service.respondToReview({
        reviewId,
        hostClerkId:  clerkId,
        hostResponse: parsed.data.response,
      })
      return c.json({ review })
    } catch (err) {
      return handleReviewError(err, c)
    }
  }

  /** GET /api/v1/users/me/reviews — guest's own reviews */
  async getMyReviews(c: Context): Promise<Response> {
    try {
      const clerkId = c.get('clerkId') as string
      const cursor  = c.req.query('cursor')
      const limit   = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 50)
      const reviews = await this.service.getMyReviews(clerkId, cursor, limit)
      const nextCursor = reviews.length === limit ? reviews[reviews.length - 1]?.id : undefined
      return c.json({ reviews, nextCursor })
    } catch (err) {
      return handleReviewError(err, c)
    }
  }
}
