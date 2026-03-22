/**
 * OnboardingService — 8-step host onboarding flow.
 * PRD Section 12.
 *
 * Steps 1-7 are PATCH calls that accumulate data into sessionData JSON.
 * Step 8 (submit) validates completeness, transitions to 'submitted',
 * or auto-approves when AUTO_APPROVE_HOSTS=true.
 *
 * On approval (admin or auto): Clerk role → 'host', draft listing created.
 */
import { createClerkClient } from '@clerk/backend'
import type { QueueService } from '@casalux/services-queue'
import { QUEUES } from '@casalux/services-queue'
import { OnboardingRepository } from '../repositories/onboarding.repository.js'
import type { OnboardingSessionData } from '../repositories/onboarding.repository.js'

const AUTO_APPROVE = process.env['AUTO_APPROVE_HOSTS'] === 'true'

const REQUIRED_FIELDS: (keyof OnboardingSessionData)[] = [
  'propertyType',
  'roomType',
  'maxGuests',
  'address',
  'amenities',
  'photos',
  'title',
  'description',
  'basePrice',
  'cancellationPolicy',
]

export class OnboardingService {
  private readonly repo  = new OnboardingRepository()
  private readonly clerk = createClerkClient({ secretKey: process.env['CLERK_SECRET_KEY']! })

  constructor(private readonly queue: QueueService) {}

  // ── Step helpers ────────────────────────────────────────────────────────────

  private async assertOwnership(sessionId: string, clerkId: string) {
    const session = await this.repo.findByIdForUser(sessionId, clerkId)
    if (!session) throw new Error('SESSION_NOT_FOUND')
    if (session.status !== 'in_progress') throw new Error('SESSION_ALREADY_SUBMITTED')
    return session
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Step 1 — POST /host/onboarding/start */
  async start(clerkId: string) {
    // Resume existing in-progress session rather than create duplicate
    const existing = await this.repo.findActiveByUser(clerkId)
    if (existing) return existing

    return this.repo.create(clerkId)
  }

  /** GET /host/onboarding/:sessionId — check current progress */
  async getSession(sessionId: string, clerkId: string) {
    const session = await this.repo.findByIdForUser(sessionId, clerkId)
    if (!session) throw new Error('SESSION_NOT_FOUND')
    return session
  }

  /** Step 2 — PATCH /host/onboarding/:sessionId/space */
  async saveSpace(sessionId: string, clerkId: string, data: Pick<OnboardingSessionData,
    'propertyType' | 'roomType' | 'maxGuests' | 'bedrooms' | 'beds' | 'baths' | 'address' | 'lat' | 'lng'
  >) {
    await this.assertOwnership(sessionId, clerkId)
    return this.repo.updateStep(sessionId, data)
  }

  /** Step 3 — PATCH /host/onboarding/:sessionId/amenities */
  async saveAmenities(sessionId: string, clerkId: string, amenities: string[]) {
    await this.assertOwnership(sessionId, clerkId)
    return this.repo.updateStep(sessionId, { amenities })
  }

  /** Step 4 — POST /host/onboarding/:sessionId/photos */
  async savePhotos(sessionId: string, clerkId: string, photos: OnboardingSessionData['photos']) {
    await this.assertOwnership(sessionId, clerkId)
    if (!photos || photos.length === 0) throw new Error('At least one photo is required')
    return this.repo.updateStep(sessionId, { photos })
  }

  /** Step 5 — PATCH /host/onboarding/:sessionId/details */
  async saveDetails(sessionId: string, clerkId: string, data: Pick<OnboardingSessionData, 'title' | 'description'>) {
    await this.assertOwnership(sessionId, clerkId)
    return this.repo.updateStep(sessionId, data)
  }

  /** Step 6 — PATCH /host/onboarding/:sessionId/pricing */
  async savePricing(sessionId: string, clerkId: string, data: Pick<OnboardingSessionData,
    'basePrice' | 'currency' | 'cleaningFee' | 'cancellationPolicy'
  >) {
    await this.assertOwnership(sessionId, clerkId)
    if (data.basePrice !== undefined && data.basePrice < 100) {
      throw new Error('Base price must be at least ₹1 (100 paise)')
    }
    return this.repo.updateStep(sessionId, data)
  }

  /** Step 7 — PATCH /host/onboarding/:sessionId/availability */
  async saveAvailability(sessionId: string, clerkId: string, data: Pick<OnboardingSessionData,
    'instantBook' | 'checkInTime' | 'checkOutTime' | 'minNights' | 'maxNights' | 'blockedDates'
  >) {
    await this.assertOwnership(sessionId, clerkId)
    return this.repo.updateStep(sessionId, data)
  }

  /** Step 8 — POST /host/onboarding/:sessionId/submit */
  async submit(sessionId: string, clerkId: string) {
    const session = await this.assertOwnership(sessionId, clerkId)
    const data    = session.sessionData as OnboardingSessionData

    // Validate all required fields are present
    const missing = REQUIRED_FIELDS.filter((f) => data[f] === undefined || data[f] === null)
    if (missing.length > 0) {
      throw new Error(`Incomplete application. Missing: ${missing.join(', ')}`)
    }

    if (AUTO_APPROVE) {
      await this.repo.autoApprove(sessionId)
      await this.grantHostRole(clerkId)
      await this.queue.enqueue(QUEUES.EMAIL, {
        type: 'host.auto_approved',
        data: { clerkId, sessionId },
      })
      return { status: 'auto_approved' }
    }

    await this.repo.submit(sessionId)
    await this.queue.enqueue(QUEUES.EMAIL, {
      type: 'host.application_submitted',
      data: { clerkId, sessionId },
    })
    return { status: 'submitted' }
  }

  // ── Admin operations ────────────────────────────────────────────────────────

  async approve(sessionId: string, reviewerClerkId: string) {
    const session = await this.repo.findById(sessionId)
    if (!session) throw new Error('SESSION_NOT_FOUND')
    if (session.status !== 'submitted') throw new Error('Application is not in submitted state')

    await this.repo.approve(sessionId, reviewerClerkId)

    // Upgrade Clerk role to host
    const application = await this.repo.findById(sessionId)
    if (application) {
      const userRecord = await this.clerk.users.getUser(
        (application as unknown as { userId: string }).userId
      ).catch(() => null)

      if (userRecord) {
        await this.grantHostRole(userRecord.id)
      }
    }

    await this.queue.enqueue(QUEUES.EMAIL, {
      type: 'host.application_approved',
      data: { sessionId },
    })

    return this.repo.findById(sessionId)
  }

  async reject(sessionId: string, reviewerClerkId: string, reason: string) {
    const session = await this.repo.findById(sessionId)
    if (!session) throw new Error('SESSION_NOT_FOUND')
    if (session.status !== 'submitted') throw new Error('Application is not in submitted state')

    await this.repo.reject(sessionId, reviewerClerkId, reason)

    await this.queue.enqueue(QUEUES.EMAIL, {
      type: 'host.application_rejected',
      data: { sessionId, reason },
    })

    return this.repo.findById(sessionId)
  }

  async listSubmitted() {
    return this.repo.findAllSubmitted()
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async grantHostRole(clerkId: string) {
    await this.clerk.users.updateUserMetadata(clerkId, {
      publicMetadata: { role: 'host' },
    })
  }
}
