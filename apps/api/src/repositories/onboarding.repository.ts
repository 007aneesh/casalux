/**
 * OnboardingRepository — all DB queries for HostApplication.
 * PRD Section 12 — Become a Host.
 *
 * sessionData is a JSON column that accumulates step data incrementally.
 * Each PATCH step merges into the existing JSON rather than replacing it.
 */
import { db as prisma } from '@casalux/db'
import type { HostApplicationStatus, Prisma } from '@casalux/db'

export interface OnboardingSessionData {
  // Step 2 — space
  propertyType?: string
  roomType?:     string
  maxGuests?:    number
  bedrooms?:     number
  beds?:         number
  baths?:        number
  address?:      Record<string, string>
  lat?:          number
  lng?:          number

  // Step 3 — amenities
  amenities?: string[]

  // Step 4 — photos
  photos?: Array<{ publicId: string; url: string; isPrimary: boolean }>

  // Step 5 — details
  title?:       string
  description?: string

  // Step 6 — pricing
  basePrice?:          number   // cents
  currency?:           string
  cleaningFee?:        number
  cancellationPolicy?: string

  // Step 7 — availability
  instantBook?:        boolean
  checkInTime?:        string
  checkOutTime?:       string
  minNights?:          number
  maxNights?:          number
  blockedDates?:       Array<{ start: string; end: string }>

  [key: string]: unknown
}

export class OnboardingRepository {
  async findById(sessionId: string) {
    return prisma.hostApplication.findUnique({
      where: { id: sessionId },
    })
  }

  /** Find a single application with its user — used by admin detail view */
  async findByIdWithUser(sessionId: string) {
    return prisma.hostApplication.findUnique({
      where:   { id: sessionId },
      include: {
        user: {
          select: {
            id: true, clerkId: true,
            firstName: true, lastName: true,
            email: true, profileImageUrl: true,
            createdAt: true,
          },
        },
      },
    })
  }

  async findActiveByUser(clerkId: string) {
    return prisma.hostApplication.findFirst({
      where: {
        user:   { clerkId },
        status: 'in_progress',
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /** Returns the most recent application regardless of status — used for status checks */
  async findLatestByUser(clerkId: string) {
    return prisma.hostApplication.findFirst({
      where:   { user: { clerkId } },
      orderBy: { createdAt: 'desc' },
      select:  { id: true, status: true, submittedAt: true, rejectionReason: true, createdAt: true },
    })
  }

  async findByIdForUser(sessionId: string, clerkId: string) {
    return prisma.hostApplication.findFirst({
      where: {
        id:   sessionId,
        user: { clerkId },
      },
    })
  }

  async create(clerkId: string) {
    return prisma.hostApplication.create({
      data: {
        user:        { connect: { clerkId } },
        status:      'in_progress',
        sessionData: {},
      },
    })
  }

  /** Merge partial step data into the existing JSON blob */
  async updateStep(
    sessionId: string,
    stepData:  Partial<OnboardingSessionData>,
  ) {
    // Fetch current data first to merge
    const current = await prisma.hostApplication.findUnique({
      where:  { id: sessionId },
      select: { sessionData: true },
    })

    const merged = {
      ...(current?.sessionData as Record<string, unknown> ?? {}),
      ...stepData,
    }

    return prisma.hostApplication.update({
      where: { id: sessionId },
      data:  { sessionData: merged as unknown as Prisma.InputJsonValue },
    })
  }

  async submit(sessionId: string) {
    return prisma.hostApplication.update({
      where: { id: sessionId },
      data:  {
        status:      'submitted',
        submittedAt: new Date(),
      },
    })
  }

  async approve(sessionId: string, reviewerClerkId: string) {
    return prisma.hostApplication.update({
      where: { id: sessionId },
      data:  {
        status:     'approved',
        reviewedBy: reviewerClerkId,
        reviewedAt: new Date(),
      },
    })
  }

  async autoApprove(sessionId: string) {
    return prisma.hostApplication.update({
      where: { id: sessionId },
      data:  { status: 'auto_approved', reviewedAt: new Date() },
    })
  }

  async reject(sessionId: string, reviewerClerkId: string, reason: string) {
    return prisma.hostApplication.update({
      where: { id: sessionId },
      data:  {
        status:          'rejected',
        rejectionReason: reason,
        reviewedBy:      reviewerClerkId,
        reviewedAt:      new Date(),
      },
    })
  }

  async findByIdWithUser(sessionId: string) {
    return prisma.hostApplication.findUnique({
      where: { id: sessionId },
      include: {
        user: { select: { id: true, clerkId: true, firstName: true, lastName: true, email: true, profileImageUrl: true } },
      },
    })
  }

  async findAllSubmitted(status?: string) {
    const where = status ? { status: status as never } : { status: { in: ['submitted', 'approved', 'rejected', 'in_progress', 'auto_approved'] as never[] } }
    return prisma.hostApplication.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { id: true, clerkId: true, firstName: true, lastName: true, email: true } },
      },
    })
  }
}
