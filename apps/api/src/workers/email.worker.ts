/**
 * Email Worker — BullMQ worker for the `email` queue.
 *
 * Every transactional email goes through this worker. Business logic enqueues
 * a typed job; this worker resolves the recipient's email address from the DB
 * and calls emailService.send() with the right template + data.
 *
 * Job types handled (host application flow):
 *   host.application_submitted  → applicant: "application under review"
 *   host.auto_approved          → applicant: "you're a host — go live"
 *   host.application_approved   → applicant: "approved by admin"
 *   host.application_rejected   → applicant: "not approved + reason"
 *
 * Concurrency: 10 (set in QueueService)
 * Retry: 5x exponential backoff
 */
import type { Job } from 'bullmq'
import { db } from '@casalux/db'
import { QUEUES } from '@casalux/services-queue'
import { emailService, queueService } from '../container.js'

// ─── Payload shapes ───────────────────────────────────────────────────────────

interface HostSubmittedPayload  { clerkId: string; sessionId: string }
interface HostApprovedPayload   { sessionId: string }
interface HostRejectedPayload   { sessionId: string; reason: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve first name + email for a user by their Clerk ID */
async function resolveUserByClerkId(clerkId: string) {
  return db.user.findUnique({
    where:  { clerkId },
    select: { email: true, firstName: true, lastName: true },
  })
}

/** Resolve user via the HostApplication record (for admin-triggered approve/reject) */
async function resolveUserBySession(sessionId: string) {
  const app = await db.hostApplication.findUnique({
    where:   { id: sessionId },
    include: { user: { select: { email: true, firstName: true, lastName: true } } },
  })
  return app?.user ?? null
}

// ─── Worker ───────────────────────────────────────────────────────────────────

export const emailWorker = queueService.process(
  QUEUES.EMAIL,
  async (job: Job) => {
    const type = job.name  // BullMQ stores job.type as job.name

    try {
      switch (type) {

        // ── Host submitted application ─────────────────────────────────────
        case 'host.application_submitted': {
          const { clerkId } = job.data as HostSubmittedPayload
          const user = await resolveUserByClerkId(clerkId)
          if (!user) { console.warn(`[email.worker] user not found for clerkId ${clerkId}`); return }

          await emailService.send({
            to:       user.email,
            template: 'host-application-submitted',
            data:     { firstName: user.firstName },
          })
          break
        }

        // ── Auto-approved (instant host) ───────────────────────────────────
        case 'host.auto_approved': {
          const { clerkId } = job.data as HostSubmittedPayload
          const user = await resolveUserByClerkId(clerkId)
          if (!user) { console.warn(`[email.worker] user not found for clerkId ${clerkId}`); return }

          await emailService.send({
            to:       user.email,
            template: 'host-application-approved',
            data:     { firstName: user.firstName, autoApproved: true },
          })
          break
        }

        // ── Admin approved ────────────────────────────────────────────────
        case 'host.application_approved': {
          const { sessionId } = job.data as HostApprovedPayload
          const user = await resolveUserBySession(sessionId)
          if (!user) { console.warn(`[email.worker] user not found for sessionId ${sessionId}`); return }

          await emailService.send({
            to:       user.email,
            template: 'host-application-approved',
            data:     { firstName: user.firstName, autoApproved: false },
          })
          break
        }

        // ── Admin rejected ────────────────────────────────────────────────
        case 'host.application_rejected': {
          const { sessionId, reason } = job.data as HostRejectedPayload
          const user = await resolveUserBySession(sessionId)
          if (!user) { console.warn(`[email.worker] user not found for sessionId ${sessionId}`); return }

          await emailService.send({
            to:       user.email,
            template: 'host-application-rejected',
            data:     { firstName: user.firstName, reason },
          })
          break
        }

        default:
          console.warn(`[email.worker] unhandled job type: ${type}`)
      }
    } catch (err) {
      console.error(`[email.worker] failed job ${job.id} (${type}):`, err)
      throw err  // rethrow so BullMQ retries
    }
  }
)

emailWorker.on('completed', (job) => {
  console.log(`[email.worker] ✓ ${job.name} (${job.id})`)
})

emailWorker.on('failed', (job, err) => {
  console.error(`[email.worker] ✗ ${job?.name} (${job?.id}):`, err?.message)
})
