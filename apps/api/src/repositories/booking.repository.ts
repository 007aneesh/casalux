/**
 * BookingRepository — all PostgreSQL queries for bookings + booking requests.
 * PRD Section 7 — Controller → Service → Repository; HTTP layer never touches DB.
 *
 * Uses runtime inference (Awaited<ReturnType<...>>) instead of Prisma.* generated types
 * so this compiles before `prisma generate` has been run.
 */
import { db } from '@casalux/db'
import type { BookingStatus, BookingRequestStatus, DeclineReason } from '@casalux/db'

// ─── Include shapes ───────────────────────────────────────────────────────────
const BOOKING_INCLUDE = {
  listing: {
    select: {
      id: true,
      title: true,
      address: true,
      cancellationPolicy: true,
      checkInTime: true,
      checkOutTime: true,
      images: true,
    },
  },
  guest: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImageUrl: true,
      verificationStatus: true,
    },
  },
} as const

const BOOKING_REQUEST_INCLUDE = {
  listing: {
    select: {
      id: true,
      title: true,
      address: true,
      checkInTime: true,
      checkOutTime: true,
      instantBook: true,
      images: true,
    },
  },
  guest: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImageUrl: true,
    },
  },
} as const

// ─── Inferred types ───────────────────────────────────────────────────────────
export type BookingWithRelations = Awaited<
  ReturnType<typeof db.booking.findFirst>
> & {
  listing: {
    id: string
    title: string
    address: Record<string, unknown>
    cancellationPolicy: string
    checkInTime: string | null
    checkOutTime: string | null
    images: Array<{ url: string; isPrimary: boolean }>
  }
  guest: {
    id: string
    firstName: string
    lastName: string
    profileImageUrl: string | null
    verificationStatus: string
  }
}

export type BookingRequestWithRelations = Awaited<
  ReturnType<typeof db.bookingRequest.findFirst>
> & {
  listing: {
    id: string
    title: string
    address: Record<string, unknown>
    checkInTime: string | null
    checkOutTime: string | null
    instantBook: boolean
    images: Array<{ url: string; isPrimary: boolean }>
  }
  guest: {
    id: string
    firstName: string
    lastName: string
    profileImageUrl: string | null
  }
}

// ─── Repository ───────────────────────────────────────────────────────────────
export class BookingRepository {

  // ─────────────────────── Bookings: Read ──────────────────────────────────

  async findBookingById(id: string) {
    return db.booking.findUnique({
      where:   { id },
      include: BOOKING_INCLUDE,
    })
  }

  async findBookingByRequestId(bookingRequestId: string) {
    return db.booking.findFirst({
      where:   { bookingRequestId },
      include: BOOKING_INCLUDE,
    })
  }

  async findBookingByIdForGuest(id: string, guestId: string) {
    return db.booking.findFirst({
      where:   { id, guestId },
      include: BOOKING_INCLUDE,
    })
  }

  async findBookingByIdForHost(id: string, hostId: string) {
    return db.booking.findFirst({
      where:   { id, hostId },
      include: BOOKING_INCLUDE,
    })
  }

  async findGuestBookings(
    guestId: string,
    opts: { status?: BookingStatus; page: number; limit: number }
  ) {
    const skip  = (opts.page - 1) * opts.limit
    const where: Record<string, unknown> = { guestId }
    if (opts.status) where['status'] = opts.status

    const [bookings, total] = await db.$transaction([
      db.booking.findMany({
        where,
        include:  BOOKING_INCLUDE,
        orderBy:  { createdAt: 'desc' },
        skip,
        take:     opts.limit,
      }),
      db.booking.count({ where }),
    ])

    return { bookings, total }
  }

  async findHostBookings(
    hostId: string,
    opts: { status?: BookingStatus; page: number; limit: number }
  ) {
    const skip  = (opts.page - 1) * opts.limit
    const where: Record<string, unknown> = { hostId }
    if (opts.status) where['status'] = opts.status

    const [bookings, total] = await db.$transaction([
      db.booking.findMany({
        where,
        include:  BOOKING_INCLUDE,
        orderBy:  { createdAt: 'desc' },
        skip,
        take:     opts.limit,
      }),
      db.booking.count({ where }),
    ])

    return { bookings, total }
  }

  // ─────────────────────── Bookings: Write ─────────────────────────────────

  async createBooking(data: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return db.booking.create({ data: data as any, include: BOOKING_INCLUDE })
  }

  async updateBookingStatus(
    id: string,
    status: BookingStatus,
    extra: Record<string, unknown> = {}
  ): Promise<void> {
    await db.booking.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data:  { status, updatedAt: new Date(), ...extra } as any,
    })
  }

  async updateBooking(id: string, data: Record<string, unknown>): Promise<void> {
    await db.booking.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data:  { ...data, updatedAt: new Date() } as any,
    })
  }

  // Check for date overlap with any confirmed/pending booking for a listing
  async hasDateConflict(
    listingId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    const where: Record<string, unknown> = {
      listingId,
      status: { in: ['confirmed', 'host_approved', 'pending_payment', 'pending_request'] },
      checkIn:  { lt: checkOut },
      checkOut: { gt: checkIn },
    }
    if (excludeBookingId) where['id'] = { not: excludeBookingId }

    const count = await db.booking.count({ where })
    return count > 0
  }

  // ──────────────────── Booking Requests: Read ──────────────────────────────

  async findRequestById(id: string) {
    return db.bookingRequest.findUnique({
      where:   { id },
      include: BOOKING_REQUEST_INCLUDE,
    })
  }

  async findRequestByIdForGuest(id: string, guestId: string) {
    return db.bookingRequest.findFirst({
      where:   { id, guestId },
      include: BOOKING_REQUEST_INCLUDE,
    })
  }

  async findRequestByIdForHost(id: string, hostId: string) {
    return db.bookingRequest.findFirst({
      where:   { id, hostId },
      include: BOOKING_REQUEST_INCLUDE,
    })
  }

  async findGuestRequests(
    guestId: string,
    opts: { status?: BookingRequestStatus; page: number; limit: number }
  ) {
    const skip  = (opts.page - 1) * opts.limit
    const where: Record<string, unknown> = { guestId }
    if (opts.status) where['status'] = opts.status

    const [requests, total] = await db.$transaction([
      db.bookingRequest.findMany({
        where,
        include:  BOOKING_REQUEST_INCLUDE,
        orderBy:  { requestedAt: 'desc' },
        skip,
        take:     opts.limit,
      }),
      db.bookingRequest.count({ where }),
    ])

    return { requests, total }
  }

  async findHostRequests(
    hostId: string,
    opts: {
      status?: BookingRequestStatus | BookingRequestStatus[]
      page: number
      limit: number
      sortBy?: 'expiresAt' | 'requestedAt'
    }
  ) {
    const skip  = (opts.page - 1) * opts.limit
    const where: Record<string, unknown> = { hostId }

    if (opts.status) {
      where['status'] = Array.isArray(opts.status)
        ? { in: opts.status }
        : opts.status
    }

    const orderField = opts.sortBy ?? 'requestedAt'
    const [requests, total] = await db.$transaction([
      db.bookingRequest.findMany({
        where,
        include:  BOOKING_REQUEST_INCLUDE,
        orderBy:  { [orderField]: 'asc' },
        skip,
        take:     opts.limit,
      }),
      db.bookingRequest.count({ where }),
    ])

    return { requests, total }
  }

  // Duplicate-request guard: same guest + listing with overlapping pending request
  async hasDuplicatePendingRequest(
    guestId: string,
    listingId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<boolean> {
    const count = await db.bookingRequest.count({
      where: {
        guestId,
        listingId,
        status:   { in: ['pending', 'pre_approved'] },
        checkIn:  { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    })
    return count > 0
  }

  // ──────────────────── Booking Requests: Write ─────────────────────────────

  async createRequest(data: Record<string, unknown>) {
    return db.bookingRequest.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data:    data as any,
      include: BOOKING_REQUEST_INCLUDE,
    })
  }

  async updateRequestStatus(
    id: string,
    status: BookingRequestStatus,
    extra: Record<string, unknown> = {}
  ): Promise<void> {
    await db.bookingRequest.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data:  { status, ...extra } as any,
    })
  }

  async linkRequestToBooking(requestId: string, bookingId: string): Promise<void> {
    await db.bookingRequest.update({
      where: { id: requestId },
      data:  { bookingId, status: 'approved' },
    })
  }

  // ──────────────────── Cancellation helpers ────────────────────────────────

  async findListingCancellationPolicy(listingId: string): Promise<string | null> {
    const listing = await db.listing.findUnique({
      where:  { id: listingId },
      select: { cancellationPolicy: true },
    })
    return listing?.cancellationPolicy ?? null
  }

  // ──────────────────── Guest verification helpers ──────────────────────────

  async findGuestById(guestId: string) {
    return db.user.findUnique({
      where:  { id: guestId },
      select: {
        id: true,
        verificationStatus: true,
        profileImageUrl: true,
      },
    })
  }

  async guestHasPositiveReview(guestId: string): Promise<boolean> {
    const count = await db.review.count({
      where: {
        guestId,
        rating: { gte: 4 },
      },
    })
    return count > 0
  }
}
