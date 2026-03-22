/**
 * ReviewRepository — all DB queries for Review.
 * Reviews are guest-written post-completion; hosts can respond.
 * PRD Section 15.1 — Review model.
 */
import { db as prisma } from '@casalux/db'

export class ReviewRepository {
  async findByBookingId(bookingId: string) {
    return prisma.review.findUnique({
      where: { bookingId },
      include: {
        guest: { select: { id: true, clerkId: true, firstName: true, lastName: true, profileImageUrl: true } },
      },
    })
  }

  async findById(reviewId: string) {
    return prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        guest: { select: { id: true, clerkId: true, firstName: true, lastName: true, profileImageUrl: true } },
      },
    })
  }

  async findByListingId(listingId: string, cursor?: string, limit = 20) {
    return prisma.review.findMany({
      where:   { listingId, isVisible: true },
      orderBy: { createdAt: 'desc' },
      take:    limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        guest: { select: { id: true, clerkId: true, firstName: true, lastName: true, profileImageUrl: true } },
      },
    })
  }

  async findByGuestId(guestClerkId: string, cursor?: string, limit = 20) {
    return prisma.review.findMany({
      where:   { guestId: guestClerkId, isVisible: true },
      orderBy: { createdAt: 'desc' },
      take:    limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        listing: { select: { id: true, title: true, images: true } },
      },
    })
  }

  async create(data: {
    listingId:          string
    bookingId:          string
    guestId:            string
    rating:             number
    comment:            string
    cleanlinessRating?: number
    accuracyRating?:    number
    locationRating?:    number
    checkInRating?:     number
    valueRating?:       number
  }) {
    return prisma.review.create({ data })
  }

  async addHostResponse(reviewId: string, hostResponse: string) {
    return prisma.review.update({
      where: { id: reviewId },
      data:  { hostResponse, hostRespondedAt: new Date() },
    })
  }

  /** Recompute avgRating + totalReviews on the parent listing. Called after create/soft-delete. */
  async refreshListingRating(listingId: string) {
    const agg = await prisma.review.aggregate({
      where:  { listingId, isVisible: true },
      _avg:   { rating: true },
      _count: { id: true },
    })

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        avgRating:    agg._avg.rating ?? 0,
        totalReviews: agg._count.id,
      },
    })
  }

  /** Verify a booking belongs to the guest and is completed */
  async getCompletedBookingForGuest(bookingId: string, guestClerkId: string) {
    return prisma.booking.findFirst({
      where: {
        id:      bookingId,
        guestId: guestClerkId,
        status:  'completed',
      },
      select: {
        id:        true,
        listingId: true,
        hostId:    true,
        review:    { select: { id: true } },
      },
    })
  }

  /** Verify a review belongs to a listing the host owns */
  async getReviewForHost(reviewId: string, hostClerkId: string) {
    return prisma.review.findFirst({
      where: {
        id:      reviewId,
        listing: { host: { userId: hostClerkId } },
      },
    })
  }
}
