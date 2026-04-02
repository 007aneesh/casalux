/**
 * Payment event handlers — called inline from the Stripe webhook route.
 *
 * Previously these ran inside a BullMQ worker. They're now called directly
 * from the webhook handler so no separate worker process is needed.
 *
 * Stripe already retries webhooks if our endpoint returns non-2xx, so we get
 * the same reliability guarantee without needing a queue.
 */
import { db } from '@casalux/db'
import type { BookingStatus } from '@casalux/db'
import { CacheKeys } from '@casalux/services-cache'
import { QUEUES } from '@casalux/services-queue'
import { paymentService, cacheService, queueService } from '../container.js'

// ─── payment.captured ─────────────────────────────────────────────────────────
export async function handlePaymentCaptured(orderId: string, paymentId: string) {
  const sessionJson = await cacheService.get(CacheKeys.paySession(orderId))
  if (!sessionJson) {
    console.warn(`[payment] No session for orderId=${orderId} — may have expired`)
    return
  }

  const session    = JSON.parse(sessionJson) as { bookingId: string; guestId: string }
  const { bookingId } = session

  const booking = await db.booking.findUnique({
    where:  { id: bookingId },
    select: { id: true, status: true, listingId: true, checkIn: true, checkOut: true, hostId: true, guestId: true },
  })

  if (!booking) {
    console.error(`[payment] Booking ${bookingId} not found for orderId=${orderId}`)
    return
  }

  // Idempotency — already confirmed?
  if (booking.status === 'confirmed') {
    console.log(`[payment] Booking ${bookingId} already confirmed — skipping`)
    return
  }

  if (booking.status !== 'pending_payment') {
    console.warn(`[payment] Booking ${bookingId} unexpected status ${booking.status} — skipping`)
    return
  }

  // Transition → confirmed
  await db.booking.update({
    where: { id: bookingId },
    data:  { status: 'confirmed' as BookingStatus, paymentId, updatedAt: new Date() },
  })

  // Release Redis lock + delete payment session + bust availability cache
  const checkInStr    = booking.checkIn.toISOString().slice(0, 10)
  const checkOutStr   = booking.checkOut.toISOString().slice(0, 10)
  const checkInMonth  = checkInStr.slice(0, 7)
  const checkOutMonth = checkOutStr.slice(0, 7)
  const monthsToClear = checkInMonth === checkOutMonth ? [checkInMonth] : [checkInMonth, checkOutMonth]

  await Promise.all([
    cacheService.del(CacheKeys.bookingLock(booking.listingId, checkInStr, checkOutStr)),
    cacheService.del(CacheKeys.paySession(orderId)),
    ...monthsToClear.map(m => cacheService.del(CacheKeys.availability(booking.listingId, m))),
  ])

  // Enqueue confirmation emails
  await Promise.all([
    queueService.enqueue(QUEUES.EMAIL, { type: 'booking-confirmed-guest', data: { bookingId, guestId: booking.guestId } }),
    queueService.enqueue(QUEUES.EMAIL, { type: 'booking-confirmed-host',  data: { bookingId, hostId:  booking.hostId  } }),
  ])

  console.log(`[payment] ✓ Booking ${bookingId} confirmed (paymentId=${paymentId})`)
}

// ─── payment.failed ───────────────────────────────────────────────────────────
export async function handlePaymentFailed(orderId: string) {
  const sessionJson = await cacheService.get(CacheKeys.paySession(orderId))
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
    cacheService.del(CacheKeys.paySession(orderId)),
  ])

  await queueService.enqueue(QUEUES.EMAIL, { type: 'payment-failed', data: { bookingId, guestId: booking.guestId } })

  console.log(`[payment] ✗ Booking ${bookingId} payment failed (orderId=${orderId})`)
}

// ─── refund ───────────────────────────────────────────────────────────────────
export async function handleRefund(bookingId: string, amount: number, paymentId: string | null) {
  if (!paymentId) {
    console.warn(`[payment] Refund requested for booking ${bookingId} but no paymentId`)
    return
  }

  await paymentService.refund(paymentId, amount)

  await db.booking.update({
    where: { id: bookingId },
    data:  { refundStatus: 'processed', updatedAt: new Date() },
  })

  console.log(`[payment] ✓ Refund processed for booking ${bookingId} (amount=${amount})`)
}
