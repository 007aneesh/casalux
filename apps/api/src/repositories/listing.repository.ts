/**
 * ListingRepository — all PostgreSQL queries for listings.
 * PRD Section 7 — Controller → Service → Repository; HTTP layer never touches DB.
 *
 * Uses runtime inference instead of Prisma.* generated types so this compiles
 * before `prisma generate` has been run on the developer machine.
 * Run `pnpm db:generate` once to unlock full Prisma type-safety.
 */
import { db } from '@casalux/db'
import type { AvailabilityRuleType, ListingStatus } from '@casalux/db'

// ─── Include shape ────────────────────────────────────────────────────────────
const LISTING_INCLUDE = {
  amenities: {
    include: { amenity: true },
  },
  host: {
    include: {
      user: {
        select: {
          id: true,
          clerkId: true,
          firstName: true,
          lastName: true,
          profileImageUrl: true,
          email: true,
        },
      },
    },
  },
} as const

// Inferred type — no Prisma.ListingGetPayload needed
export type ListingWithRelations = Awaited<
  ReturnType<typeof db.listing.findFirst>
> & {
  amenities: Array<{ amenity: { slug: string; name: string; category: string } }>
  host: {
    isSuperhost: boolean
    responseRate: number
    avgResponseTimeHours: number
    user: {
      id: string
      clerkId: string
      firstName: string
      lastName: string
      profileImageUrl: string | null
    }
  }
}

// ─── Filters ──────────────────────────────────────────────────────────────────
export interface ListingFilters {
  hostId?: string
  status?: ListingStatus | ListingStatus[]
  page?: number
  limit?: number
}

// ─── Repository ───────────────────────────────────────────────────────────────
export class ListingRepository {
  // ─── Read ─────────────────────────────────────────────────────────────────
  async findById(id: string) {
    return db.listing.findUnique({
      where: { id },
      include: LISTING_INCLUDE,
    })
  }

  async findByIdForHost(id: any, hostId: string) {
    return db.listing.findFirst({
      where: { id, hostId },
      include: LISTING_INCLUDE,
    })
  }

  async findMany(filters: ListingFilters) {
    const page  = filters.page  ?? 1
    const limit = Math.min(filters.limit ?? 20, 50)
    const skip  = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (filters.hostId) where['hostId'] = filters.hostId
    if (filters.status) {
      where['status'] = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status
    }

    const [listings, total] = await db.$transaction([
      db.listing.findMany({
        where,
        include: LISTING_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.listing.count({ where }),
    ])

    return { listings, total }
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) return []
    return db.listing.findMany({
      where: { id: { in: ids } },
      include: LISTING_INCLUDE,
    })
  }

  // ─── Write ────────────────────────────────────────────────────────────────
  async create(data: Record<string, unknown>) {
    return db.listing.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
      include: LISTING_INCLUDE,
    })
  }

  async update(id: string, data: Record<string, unknown>) {
    return db.listing.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
      include: LISTING_INCLUDE,
    })
  }

  async updateStatus(id: string, status: ListingStatus): Promise<void> {
    await db.listing.update({
      where: { id },
      data:  { status, updatedAt: new Date() },
    })
  }

  async updateRatingMaterialized(
    id: string,
    avgRating: number,
    totalReviews: number
  ): Promise<void> {
    await db.listing.update({
      where: { id },
      data:  { avgRating, totalReviews },
    })
  }

  // ─── Amenities ────────────────────────────────────────────────────────────
  async setAmenities(listingId: string, amenitySlugs: string[]): Promise<void> {
    const amenities = await db.amenity.findMany({
      where:  { slug: { in: amenitySlugs } },
      select: { id: true },
    })

    await db.$transaction([
      db.listingAmenity.deleteMany({ where: { listingId } }),
      db.listingAmenity.createMany({
        data: amenities.map((a: any) => ({ listingId, amenityId: a.id })),
      }),
    ])
  }

  // ─── Availability ─────────────────────────────────────────────────────────
  async getAvailabilityRules(listingId: string, from: Date, to: Date) {
    return db.availabilityRule.findMany({
      where: {
        listingId,
        startDate: { lte: to },
        endDate:   { gte: from },
      },
    })
  }

  async upsertAvailabilityRules(
    listingId: string,
    rules: Array<{
      type: AvailabilityRuleType
      startDate: Date
      endDate: Date
      value?: number
      notes?: string
    }>
  ): Promise<void> {
    await db.$transaction([
      db.availabilityRule.deleteMany({ where: { listingId } }),
      db.availabilityRule.createMany({
        data: rules.map((r) => ({
          listingId,
          type:      r.type,
          startDate: r.startDate,
          endDate:   r.endDate,
          value:     r.value,
          notes:     r.notes,
        })),
      }),
    ])
  }

  async getConfirmedBookingDates(
    listingId: string,
    from: Date,
    to: Date
  ): Promise<Array<{ checkIn: Date; checkOut: Date }>> {
    return db.booking.findMany({
      where: {
        listingId,
        status:   { in: ['confirmed', 'host_approved', 'pending_payment'] },
        checkIn:  { lte: to },
        checkOut: { gte: from },
      },
      select: { checkIn: true, checkOut: true },
    })
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────
  async getReviews(listingId: string, page: number, limit: number) {
    const skip = (page - 1) * limit
    const [reviews, total] = await db.$transaction([
      db.review.findMany({
        where:   { listingId, isVisible: true },
        include: {
          guest: {
            select: { firstName: true, lastName: true, profileImageUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.review.count({ where: { listingId, isVisible: true } }),
    ])
    return { reviews, total }
  }

  // ─── Discounts ────────────────────────────────────────────────────────────
  async getActiveDiscounts(listingId: string) {
    const now = new Date()
    return db.discount.findMany({
      where: {
        isActive: true,
        OR: [
          { listingId },
          { listingId: null },
        ],
        startDate: { lte: now },
        endDate:   { gte: now },
      },
      orderBy: { priority: 'asc' },
    })
  }

  // ─── Bulk — for ES re-index ───────────────────────────────────────────────
  async findAllActive() {
    return db.listing.findMany({
      where:   { status: 'active' },
      include: LISTING_INCLUDE,
    })
  }
}
