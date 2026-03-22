/**
 * ReviewService — business logic for reviews.
 * Rules:
 *  - Only guest who completed the booking can write one review per booking
 *  - Review window: 14 days after checkout
 *  - avgRating is updated synchronously; ES re-indexing is async via BullMQ
 */
import type { CacheService } from '@casalux/services-cache'
import { CacheKeys } from '@casalux/services-cache'
import type { QueueService } from '@casalux/services-queue'
import { QUEUES } from '@casalux/services-queue'
import { ReviewRepository } from '../repositories/review.repository.js'

const REVIEW_WINDOW_DAYS = 14

export class ReviewService {
  private readonly repo = new ReviewRepository()

  constructor(
    private readonly cache: CacheService,
    private readonly queue: QueueService,
  ) {}

  async writeReview(params: {
    bookingId:         string
    guestClerkId:      string
    rating:            number
    comment:           string
    cleanlinessRating?: number
    accuracyRating?:   number
    locationRating?:   number
    checkInRating?:    number
    valueRating?:      number
  }) {
    const { bookingId, guestClerkId, ...reviewData } = params

    // 1. Verify the booking is completed and belongs to this guest
    const booking = await this.repo.getCompletedBookingForGuest(bookingId, guestClerkId)
    if (!booking) throw new Error('BOOKING_NOT_FOUND_OR_NOT_COMPLETED')

    // 2. Enforce one-review-per-booking
    if (booking.review) throw new Error('REVIEW_ALREADY_EXISTS')

    // 3. Validate rating
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    // 4. Create the review
    const review = await this.repo.create({
      listingId: booking.listingId,
      bookingId,
      guestId:   guestClerkId,
      ...reviewData,
    })

    // 5. Refresh listing avgRating immediately
    await this.repo.refreshListingRating(booking.listingId)

    // 6. Invalidate listing cache + trigger ES re-index
    await Promise.all([
      this.cache.del(CacheKeys.listing(booking.listingId)),
      this.queue.enqueue(QUEUES.SEARCH_INDEXING, {
        type: 'listing.reindex',
        data: { listingId: booking.listingId },
      }),
    ])

    return review
  }

  async respondToReview(params: {
    reviewId:      string
    hostClerkId:   string
    hostResponse:  string
  }) {
    const { reviewId, hostClerkId, hostResponse } = params

    if (!hostResponse.trim()) throw new Error('Response cannot be empty')
    if (hostResponse.length > 1500) throw new Error('Response exceeds 1500 characters')

    // Verify ownership
    const review = await this.repo.getReviewForHost(reviewId, hostClerkId)
    if (!review) throw new Error('REVIEW_NOT_FOUND')
    if (review.hostResponse) throw new Error('HOST_ALREADY_RESPONDED')

    return this.repo.addHostResponse(reviewId, hostResponse)
  }

  async getListingReviews(listingId: string, cursor?: string, limit = 20) {
    return this.repo.findByListingId(listingId, cursor, limit)
  }

  async getMyReviews(guestClerkId: string, cursor?: string, limit = 20) {
    return this.repo.findByGuestId(guestClerkId, cursor, limit)
  }
}
