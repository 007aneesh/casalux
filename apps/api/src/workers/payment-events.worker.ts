/**
 * Payment Events Worker — processes payment webhook events from the `payment-events` queue.
 * PRD Addendum Section 3 (Steps 10–15), Instant Book webhook flow.
 *
 * IMPORTANT: This queue MUST run with concurrency: 1.
 * Reason: payment state transitions must be serialised per booking to avoid double-confirmation
 * or double-refund. BullMQ global concurrency = 1 guarantees at-most-one in-flight payment job.
 *
 * Job types handled:
 *   payment.captured  — confirm booking, release Redis lock, enqueue notifications + search sync
 *   payment.failed    — mark booking payment_failed, release lock
 *   payment.expired   — mark booking payment_expired (Redis TTL fired, no webhook received)
 *   refund            — initiate refund via payment provider, update refund status
 */
import { Worker, type Job } from 'bullmq'
import { db } from '@casalux/db'
import type { BookingStatus } from '@casalux/db'
import { CacheKeys } from '@casalux/services-cache'
import { QUEUES } from '@casalux/services-queue'
import { paymentService, cacheService, queueService } from '../container.js'

// ─── Job payload shapes ────────────────────────────────────────────────────────
interface PaymentCapturedPayload {
  type:      'payment.captured'
  orderId:   string
  paymentId: string
}

interface PaymentFailedPayload {
  type:    'payment.failed'
  orderId: string
}

interface PaymentExpiredPayload {
  type:      'payment.expired'
  bookingId: string
}

interface RefundPayload {
  type:      'refund'
  bookingId: string
  amount:    number
  paymentId: string | null
}

type PaymentEventPayload =
  | PaymentCapturedPayload
  | PaymentFailedPayload
  | PaymentExpiredPayload
  | RefundPayload

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handlePaymentCaptured(payload: PaymentCapturedPayload) {
  // Look up booking via payment session cache
  const sessionJson = await cacheService.get(CacheKeys.paySession(payload.orderId))
  if (!sessionJson) {
    console.warn(`[payment-events] No session for orderId=${payload.orderId} — may have expired`)
    return
  }

  const session = JSON.parse(sessionJson) as { bookingId: string; guestId: string }
  const { bookingId } = session

  const booking = await db.booking.findUnique({
    where:  { id: bookingId },
    select: { id: true, status: true, listingId: true, checkIn: true, checkOut: true, hostId: true, guestId: true },
  })

  if (!booking) {
    console.error(`[payment-events] Booking ${bookingId} not found for orderId=${payload.orderId}`)
    return
  }

  // Idempotency: already confirmed?
  if (booking.status === 'confirmed') {
    console.log(`[payment-events] Booking ${bookingId} already confirmed — skipping`)
    return
  }

  if (booking.status !== 'pending_payment') {
    console.warn(`[payment-events] Booking ${bookingId} unexpected status ${booking.status} — skipping`)
    return
  }

  // Transition → confirmed
  await db.booking.update({
    where: { id: bookingId },
    data:  {
      status:    'confirmed' as BookingStatus,
      paymentId: payload.paymentId,
      updatedAt: new Date(),
    },
  })

  // Release Redis lock + delete payment session
  const checkInStr  = booking.checkIn.toISOString().slice(0, 10)
  const checkOutStr = booking.checkOut.toISOString().slice(0, 10)
  await Promise.all([
    cacheService.del(CacheKeys.bookingLock(booking.listingId, checkInStr, checkOutStr)),
    cacheService.del(CacheKeys.paySession(payload.orderId)),
  ])

  // Enqueue notifications + search index sync
  await Promise.all([
    queueService.enqueue(QUEUES.EMAIL, { type: 'booking-confirmed-guest', data: { bookingId, guestId: booking.guestId } }),
    queueService.enqueue(QUEUES.EMAIL, { type: 'booking-confirmed-host',  data: { bookingId, hostId:  booking.hostId } }),
    queueService.enqueue(QUEUES.SEARCH_INDEXING, { type: 'sync-availability', data: { listingId: booking.listingId } }),
  ])

  console.log(`[payment-events] ✓ Booking ${bookingId} confirmed (paymentId=${payload.paymentId})`)
}

async function handlePaymentFailed(payload: PaymentFailedPayload) {
  const sessionJson = await cacheService.get(CacheKeys.paySession(payload.orderId))
  if (!sessionJson) return

  const { bookingId } = JSON.parse(sessionJson) as { bookingId: string }

  const booking = await db.booking.findUnique({
    where:  { id: bookingId },
    select: { id: true, status: true, listingId: true, checkIn: true, checkOut: true, guestId: true },
  })

  if (!booking || booking.status !== 'pending_payment') return

  await db.booking.update({
    where: { id: bookingId },
    data:  { status: 'payment_failed' as BookingStatus, updatedAt: new Date() },
  })

  const checkInStr  = booking.checkIn.toISOString().slice(0, 10)
  const checkOutStr = booking.checkOut.toISOString().slice(0, 10)
  await Promise.all([
    cacheService.del(CacheKeys.bookingLock(booking.listingId, checkInStr, checkOutStr)),
    cacheService.del(CacheKeys.paySession(payload.orderId)),
  ])

  await queueService.enqueue(QUEUES.EMAIL, { type: 'payment-failed', data: { bookingId, guestId: booking.guestId } })

  console.log(`[payment-events] ✗ Booking ${bookingId} payment failed (orderId=${payload.orderId})`)
}

async function handlePaymentExpired(payload: PaymentExpiredPayload) {
  const booking = await db.booking.findUnique({
    where:  { id: payload.bookingId },
    select: { id: true, status: true, listingId: true, checkIn: true, checkOut: true, guestId: true, paymentOrderId: true },
  })

  if (!booking || booking.status !== 'pending_payment') return

  await db.booking.update({
    where: { id: payload.bookingId },
    data:  { status: 'payment_expired' as BookingStatus, updatedAt: new Date() },
  })

  const checkInStr  = booking.checkIn.toISOString().slice(0, 10)
  const checkOutStr = booking.checkOut.toISOString().slice(0, 10)
  await Promise.all([
    cacheService.del(CacheKeys.bookingLock(booking.listingId, checkInStr, checkOutStr)),
    booking.paymentOrderId
      ? cacheService.del(CacheKeys.paySession(booking.paymentOrderId))
      : Promise.resolve(),
  ])

  await queueService.enqueue(QUEUES.EMAIL, { type: 'payment-expired', data: { bookingId: booking.id, guestId: booking.guestId } })

  console.log(`[payment-events] ⏱ Booking ${booking.id} payment expired`)
}

async function handleRefund(payload: RefundPayload) {
  const { bookingId, amount, paymentId } = payload

  if (!paymentId) {
    console.warn(`[payment-events] Refund requested for booking ${bookingId} but no paymentId`)
    return
  }

  try {
    // IPaymentService.refund(chargeId: string, amount?: number)
    await paymentService.refund(paymentId, amount)

    await db.booking.update({
      where: { id: bookingId },
      data:  { refundStatus: 'processed', updatedAt: new Date() },
    })

    console.log(`[payment-events] ✓ Refund processed for booking ${bookingId} (amount=${amount})`)
  } catch (err) {
    console.error(`[payment-events] Refund failed for booking ${bookingId}:`, err)
    throw err  // Re-throw so BullMQ retries
  }
}

// ─── Worker factory ────────────────────────────────────────────────────────────

export function startPaymentEventsWorker() {
  const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379'
  const url      = new URL(redisUrl)

  const worker = new Worker<PaymentEventPayload>(
    QUEUES.PAYMENT_EVENTS,
    async (job: Job<PaymentEventPayload>) => {
      const { data } = job

      switch (data.type) {
        case 'payment.captured':
          await handlePaymentCaptured(data)
          break
        case 'payment.failed':
          await handlePaymentFailed(data)
          break
        case 'payment.expired':
          await handlePaymentExpired(data)
          break
        case 'refund':
          await handleRefund(data)
          break
        default: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          console.warn(`[payment-events] Unknown job type: ${(data as any).type}`)
        }
      }
    },
    {
      // CRITICAL: concurrency = 1 — payment state transitions must be serialised
      concurrency: 1,
      connection:  {
        host:     url.hostname,
        port:     parseInt(url.port ?? '6379', 10),
        password: url.password || undefined,
      },
    }
  )

  worker.on('completed', (job) => {
    console.log(`[payment-events] Job ${job.id} (${job.data.type}) completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[payment-events] Job ${job?.id} (${job?.data?.type}) failed:`, err.message)
  })

  console.log('🔄 PaymentEvents worker started (concurrency=1)')
  return worker
}
