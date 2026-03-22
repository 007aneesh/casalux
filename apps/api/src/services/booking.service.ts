/**
 * BookingService — all booking business logic.
 * PRD Addendum Sections 3 (Instant Book), 4 (Request-to-Book), 2 (State Machine).
 *
 * Rules:
 * - Distributed Redis lock (bklock:) guards date availability for Instant Book
 * - Soft Redis hold (sreq:) for Request-to-Book pending window
 * - All payment/email/push side-effects are BullMQ jobs — NEVER inline
 * - State transitions are validated before every update
 * - calculatePrice is the single source of truth for all money math
 */
import crypto from 'node:crypto'
import type { CacheService } from '@casalux/services-cache'
import { CacheKeys } from '@casalux/services-cache'
import type { IPaymentService } from '@casalux/services-payment'
import type { QueueService } from '@casalux/services-queue'
import { QUEUES } from '@casalux/services-queue'
import { calculatePrice, calculateHostPayout, daysUntilCheckIn } from '@casalux/utils'
import type { BookingStatus, BookingRequestStatus, DeclineReason } from '@casalux/db'
import type { PricingBreakdown } from '@casalux/types'
import { BookingRepository } from '../repositories/booking.repository.js'
import { ListingRepository } from '../repositories/listing.repository.js'

// ─── Redis TTL constants ───────────────────────────────────────────────────────
const HOST_RESPONSE_WINDOW_S  = 24 * 60 * 60
const HOST_RESPONSE_WINDOW_MS = HOST_RESPONSE_WINDOW_S * 1000
const GUEST_PAYMENT_WINDOW_S  = 24 * 60 * 60
const GUEST_PAYMENT_WINDOW_MS = GUEST_PAYMENT_WINDOW_S * 1000
const PRE_APPROVAL_WINDOW_S   = 48 * 60 * 60
const PRE_APPROVAL_WINDOW_MS  = PRE_APPROVAL_WINDOW_S * 1000
const INSTANT_BOOK_LOCK_MS    = 15 * 60 * 1000   // 15 min (setNx takes ms)
const PAYMENT_SESSION_TTL_S   = 30 * 60           // 30 min

// Platform fee + tax constants
const PLATFORM_FEE_PERCENT = 12
const TAX_RULES = [{ percent: 18, label: 'GST' }]

// ─── Service ──────────────────────────────────────────────────────────────────
export class BookingService {
  private repo:        BookingRepository
  private listingRepo: ListingRepository

  constructor(
    private cache:   CacheService,
    private payment: IPaymentService,
    private queue:   QueueService
  ) {
    this.repo        = new BookingRepository()
    this.listingRepo = new ListingRepository()
  }

  // ─── Instant Book: initiate ─────────────────────────────────────────────

  async initiateInstantBook(guestId: string, input: {
    listingId:          string
    checkIn:            string
    checkOut:           string
    guests:             number
    promoCode?:         string
    agreedToHouseRules: boolean
  }) {
    const listing = await this.listingRepo.findById(input.listingId)
    if (!listing)              throw new Error('LISTING_NOT_FOUND')
    if (!listing.instantBook)  throw new Error('NOT_INSTANT_BOOK')
    if (listing.status !== 'active') throw new Error('LISTING_UNAVAILABLE')

    const checkInDate  = new Date(input.checkIn)
    const checkOutDate = new Date(input.checkOut)
    if (checkOutDate <= checkInDate) throw new Error('INVALID_DATES')

    const nights = Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Guest requirements check (PRD Section 3.2)
    await this.verifyGuestRequirements(guestId, listing)

    // Availability check
    const conflict = await this.repo.hasDateConflict(input.listingId, checkInDate, checkOutDate)
    if (conflict) throw new Error('DATES_UNAVAILABLE')

    // Acquire distributed lock — setNx takes ms
    const lockKey      = CacheKeys.bookingLock(input.listingId, input.checkIn, input.checkOut)
    const lockAcquired = await this.cache.setNx(lockKey, guestId, INSTANT_BOOK_LOCK_MS)
    if (!lockAcquired) throw new Error('DATES_BEING_BOOKED')

    try {
      // Price calculation
      const discounts = await this.listingRepo.getActiveDiscounts(input.listingId)
      const activeDiscounts = discounts.map((d: any) => ({
        type: d.type, label: d.label ?? d.type, priority: d.priority ?? 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: (d as any).value, isPercent: (d as any).isFlat === false,
      }))

      const pricing = calculatePrice({
        basePrice:         Number(listing.basePrice),
        nights,
        cleaningFee:       Number(listing.cleaningFee ?? 0),
        serviceFeePercent: PLATFORM_FEE_PERCENT,
        taxRules:          TAX_RULES,
        discounts:         activeDiscounts,
      })
      pricing.currency = listing.currency ?? 'INR'

      const hostPayout = calculateHostPayout(pricing.total, pricing.serviceFee, pricing.taxes)

      // Create booking row: status = pending_payment
      const booking = await this.repo.createBooking({
        listingId:          input.listingId,
        guestId,
        hostId:             listing.hostId,
        checkIn:            checkInDate,
        checkOut:           checkOutDate,
        nights,
        guests:             input.guests,
        agreedToHouseRules: input.agreedToHouseRules,
        guestVerifiedAtBooking: true,
        status:             'pending_payment' as BookingStatus,
        baseSubtotal:       pricing.rawSubtotal,
        discountAmount:     pricing.rawSubtotal - pricing.discountedSubtotal,
        discountsApplied:   pricing.discounts,
        cleaningFee:        pricing.cleaningFee,
        platformServiceFee: pricing.serviceFee,
        taxes:              pricing.taxes,
        totalAmount:        pricing.total,
        hostPayout,
        paymentProvider:    'stripe',
        payoutStatus:       'pending',
        refundStatus:       'none',
      })

      // Create payment intent
      const intent = await this.payment.createPaymentIntent({
        amount:    pricing.total,
        currency:  pricing.currency ?? 'INR',
        bookingId: booking.id,
        metadata:  { guestId, listingId: input.listingId },
      })

      // Cache payment session (30-min TTL)
      await this.cache.set(
        CacheKeys.paySession(intent.intentId),
        JSON.stringify({ bookingId: booking.id, guestId, amount: pricing.total, status: 'pending' }),
        PAYMENT_SESSION_TTL_S
      )

      // Store intentId on booking
      await this.repo.updateBooking(booking.id, { paymentOrderId: intent.intentId })

      return {
        bookingId:        booking.id,
        orderId:          intent.intentId,
        providerPayload:  { clientSecret: intent.clientSecret, status: intent.status },
        pricingBreakdown: pricing,
      }
    } catch (err) {
      // Release lock on failure
      await this.cache.del(lockKey)
      throw err
    }
  }

  // ─── Booking: get ────────────────────────────────────────────────────────

  async getBookingById(id: string, requesterId: string, requesterRole: string) {
    const booking = await this.repo.findBookingById(id)
    if (!booking) return null

    if (
      requesterRole !== 'admin' &&
      requesterRole !== 'super_admin' &&
      booking.guestId !== requesterId &&
      booking.hostId  !== requesterId
    ) {
      return null
    }

    return this.shapeBooking(booking)
  }

  async getGuestBookings(guestId: string, opts: { status?: BookingStatus; page: number; limit: number }) {
    const { bookings, total } = await this.repo.findGuestBookings(guestId, opts)
    return { data: bookings.map((b: any) => this.shapeBooking(b)), total }
  }

  async getHostBookings(hostId: string, opts: { status?: BookingStatus; page: number; limit: number }) {
    const { bookings, total } = await this.repo.findHostBookings(hostId, opts)
    return { data: bookings.map((b: any) => this.shapeBooking(b)), total }
  }

  // ─── Booking: cancel ─────────────────────────────────────────────────────

  async getCancellationPreview(bookingId: string, guestId: string) {
    const booking = await this.repo.findBookingByIdForGuest(bookingId, guestId)
    if (!booking) throw new Error('NOT_FOUND')
    if (booking.status !== 'confirmed') throw new Error('NOT_CANCELLABLE')

    const policy = booking.listing.cancellationPolicy ?? 'flexible'
    const days   = daysUntilCheckIn(booking.checkIn.toISOString())
    const { refundAmount, penaltyDeducted, hostPenalty } = this.computeCancellationRefund(policy, days, booking)

    return {
      refundAmount,
      refundBreakdown: {
        baseSubtotal:      Number(booking.baseSubtotal),
        penaltyDeducted,
        serviceFeeRefund:  Number(booking.platformServiceFee),
        cleaningFeeRefund: days > 1 ? Number(booking.cleaningFee) : 0,
      },
      cancellationPolicy: policy,
      daysBeforeCheckIn:  days,
      message:            this.cancellationPolicyMessage(policy, days),
      hostPenalty,
    }
  }

  async cancelBookingAsGuest(bookingId: string, guestId: string, reason?: string) {
    const booking = await this.repo.findBookingByIdForGuest(bookingId, guestId)
    if (!booking) throw new Error('NOT_FOUND')
    if (booking.status !== 'confirmed') throw new Error('NOT_CANCELLABLE')

    const policy = booking.listing.cancellationPolicy ?? 'flexible'
    const days   = daysUntilCheckIn(booking.checkIn.toISOString())
    const { refundAmount } = this.computeCancellationRefund(policy, days, booking)

    await this.repo.updateBookingStatus(bookingId, 'guest_cancelled', {
      cancellationReason: reason ?? null,
      cancelledBy:        'guest',
      refundAmount,
      refundStatus:       refundAmount > 0 ? 'requested' : 'none',
    })

    const lockKey = CacheKeys.bookingLock(
      booking.listingId,
      booking.checkIn.toISOString().slice(0, 10),
      booking.checkOut.toISOString().slice(0, 10)
    )
    await this.cache.del(lockKey)

    // Enqueue refund + notifications
    const paymentId = booking.paymentId
    await Promise.all([
      paymentId
        ? this.queue.enqueue(QUEUES.PAYMENT_EVENTS, { type: 'refund', data: { bookingId, amount: refundAmount, paymentId } })
        : Promise.resolve(),
      this.queue.enqueue(QUEUES.EMAIL, { type: 'booking-cancelled-guest', data: { bookingId, guestId, refundAmount } }),
      this.queue.enqueue(QUEUES.EMAIL, { type: 'booking-cancelled-host',  data: { bookingId, hostId: booking.hostId } }),
    ])

    return { bookingId, refundAmount }
  }

  async cancelBookingAsHost(bookingId: string, hostId: string, reason?: string) {
    const booking = await this.repo.findBookingByIdForHost(bookingId, hostId)
    if (!booking) throw new Error('NOT_FOUND')
    if (booking.status !== 'confirmed') throw new Error('NOT_CANCELLABLE')

    const refundAmount             = Number(booking.totalAmount)
    const hostCancellationPenalty  = Math.round(Number(booking.platformServiceFee) * 0.5)

    await this.repo.updateBookingStatus(bookingId, 'cancelled_by_host', {
      cancellationReason:   reason ?? null,
      cancelledBy:          'host',
      refundAmount,
      refundStatus:         'requested',
      hostCancellationPenalty,
    })

    const lockKey = CacheKeys.bookingLock(
      booking.listingId,
      booking.checkIn.toISOString().slice(0, 10),
      booking.checkOut.toISOString().slice(0, 10)
    )
    await this.cache.del(lockKey)

    const paymentId = booking.paymentId
    await Promise.all([
      paymentId
        ? this.queue.enqueue(QUEUES.PAYMENT_EVENTS, { type: 'refund', data: { bookingId, amount: refundAmount, paymentId } })
        : Promise.resolve(),
      this.queue.enqueue(QUEUES.EMAIL, { type: 'booking-cancelled-by-host', data: { bookingId, guestId: booking.guestId } }),
      this.queue.enqueue(QUEUES.EMAIL, { type: 'host-cancellation-penalty',  data: { bookingId, hostId, penalty: hostCancellationPenalty } }),
    ])

    return { bookingId, refundAmount, hostCancellationPenalty }
  }

  // ─── Booking Request: create ─────────────────────────────────────────────

  async createBookingRequest(guestId: string, input: {
    listingId:    string
    checkIn:      string
    checkOut:     string
    guests:       number
    guestMessage?: string
  }) {
    const listing = await this.listingRepo.findById(input.listingId)
    if (!listing)             throw new Error('LISTING_NOT_FOUND')
    if (listing.instantBook)  throw new Error('USE_INSTANT_BOOK')
    if (listing.status !== 'active') throw new Error('LISTING_UNAVAILABLE')

    const checkInDate  = new Date(input.checkIn)
    const checkOutDate = new Date(input.checkOut)
    if (checkOutDate <= checkInDate) throw new Error('INVALID_DATES')

    const nights = Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const conflict = await this.repo.hasDateConflict(input.listingId, checkInDate, checkOutDate)
    if (conflict) throw new Error('DATES_UNAVAILABLE')

    const duplicate = await this.repo.hasDuplicatePendingRequest(guestId, input.listingId, checkInDate, checkOutDate)
    if (duplicate) throw new Error('DUPLICATE_REQUEST')

    // Price snapshot
    const discounts = await this.listingRepo.getActiveDiscounts(input.listingId)
    const activeDiscounts = discounts.map((d: any) => ({
      type: d.type, label: d.label ?? d.type, priority: d.priority ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: (d as any).value, isPercent: (d as any).isFlat === false,
    }))
    const pricing = calculatePrice({
      basePrice:         Number(listing.basePrice),
      nights,
      cleaningFee:       Number(listing.cleaningFee ?? 0),
      serviceFeePercent: PLATFORM_FEE_PERCENT,
      taxRules:          TAX_RULES,
      discounts:         activeDiscounts,
    })
    pricing.currency = listing.currency ?? 'INR'

    const now       = new Date()
    const expiresAt = new Date(now.getTime() + HOST_RESPONSE_WINDOW_MS)

    // Soft Redis hold (hset doesn't take TTL — set TTL via expire)
    const softKey  = CacheKeys.softHold(input.listingId, input.checkIn)
    const requestId = crypto.randomUUID()
    await this.cache.hset(softKey, requestId, guestId)
    await this.cache.expire(softKey, HOST_RESPONSE_WINDOW_S)

    // Create request row
    const request = await this.repo.createRequest({
      id:           requestId,
      listingId:    input.listingId,
      guestId,
      hostId:       listing.hostId,
      checkIn:      checkInDate,
      checkOut:     checkOutDate,
      nights,
      guests:       input.guests,
      status:       'pending' as BookingRequestStatus,
      guestMessage: input.guestMessage ?? null,
      priceSnapshot: pricing,
      requestedAt:  now,
      expiresAt,
    })

    // BullMQ: expire job (24h delay)
    const expireJobId = await this.queue.enqueueDelayed(
      QUEUES.BOOKING_REQUESTS,
      { type: 'booking-request-expire', data: { requestId: request.id } },
      HOST_RESPONSE_WINDOW_MS
    )
    await this.cache.set(CacheKeys.requestExpireJob(request.id), expireJobId, HOST_RESPONSE_WINDOW_S + 60)

    // Notifications + 18h reminder
    await Promise.all([
      this.queue.enqueue(QUEUES.EMAIL, { type: 'new-booking-request', data: { requestId: request.id, hostId: listing.hostId } }),
      this.queue.enqueueDelayed(
        QUEUES.BOOKING_REQUESTS,
        { type: 'host-response-reminder', data: { requestId: request.id, hostId: listing.hostId } },
        18 * 60 * 60 * 1000
      ),
    ])

    return {
      requestId:        request.id,
      expiresAt:        expiresAt.toISOString(),
      pricingBreakdown: pricing,
      status:           'pending_request',
    }
  }

  // ─── Booking Request: host approve ────────────────────────────────────────

  async approveBookingRequest(requestId: string, hostId: string, hostMessage?: string) {
    const request = await this.repo.findRequestByIdForHost(requestId, hostId)
    if (!request) throw new Error('NOT_FOUND')
    if (request.status !== 'pending') throw new Error('REQUEST_NOT_PENDING')
    if (new Date() > new Date(request.expiresAt)) throw new Error('REQUEST_EXPIRED')

    const now                    = new Date()
    const paymentWindowExpiresAt = new Date(now.getTime() + GUEST_PAYMENT_WINDOW_MS)

    await this.repo.updateRequestStatus(requestId, 'approved', {
      respondedAt:          now,
      hostMessage:          hostMessage ?? null,
      paymentWindowExpiresAt,
    })

    // DEL soft hold
    await this.cache.del(CacheKeys.softHold(request.listingId, request.checkIn.toISOString().slice(0, 10)))

    // Hard payment lock (24h)
    const lockKey = CacheKeys.bookingLock(
      request.listingId,
      request.checkIn.toISOString().slice(0, 10),
      request.checkOut.toISOString().slice(0, 10)
    )
    await this.cache.setNx(lockKey, requestId, GUEST_PAYMENT_WINDOW_S * 1000)

    // Cancel expire job
    await this.cancelScheduledJob(CacheKeys.requestExpireJob(requestId), QUEUES.BOOKING_REQUESTS)

    // Payment-window-expire job (24h)
    const pwJobId = await this.queue.enqueueDelayed(
      QUEUES.BOOKING_REQUESTS,
      { type: 'payment-window-expire', data: { requestId } },
      GUEST_PAYMENT_WINDOW_MS
    )
    await this.cache.set(CacheKeys.paymentWindowJob(requestId), pwJobId, GUEST_PAYMENT_WINDOW_S + 60)

    await this.queue.enqueue(QUEUES.EMAIL, { type: 'request-approved', data: { requestId, guestId: request.guestId } })

    return { requestId, status: 'approved', paymentWindowExpiresAt: paymentWindowExpiresAt.toISOString() }
  }

  // ─── Booking Request: host decline ────────────────────────────────────────

  async declineBookingRequest(requestId: string, hostId: string, opts: {
    declineReason: DeclineReason
    hostMessage?: string
  }) {
    const request = await this.repo.findRequestByIdForHost(requestId, hostId)
    if (!request) throw new Error('NOT_FOUND')
    if (request.status !== 'pending') throw new Error('REQUEST_NOT_PENDING')

    await this.repo.updateRequestStatus(requestId, 'declined', {
      respondedAt:   new Date(),
      declineReason: opts.declineReason,
      hostMessage:   opts.hostMessage ?? null,
    })

    await this.cache.del(CacheKeys.softHold(request.listingId, request.checkIn.toISOString().slice(0, 10)))
    await this.cancelScheduledJob(CacheKeys.requestExpireJob(requestId), QUEUES.BOOKING_REQUESTS)

    await this.queue.enqueue(QUEUES.EMAIL, {
      type: 'request-declined',
      data: { requestId, guestId: request.guestId, reason: opts.declineReason },
    })

    return { requestId, status: 'declined' }
  }

  // ─── Booking Request: guest cancel ────────────────────────────────────────

  async cancelBookingRequest(requestId: string, guestId: string) {
    const request = await this.repo.findRequestByIdForGuest(requestId, guestId)
    if (!request) throw new Error('NOT_FOUND')
    if (request.status !== 'pending') throw new Error('REQUEST_NOT_CANCELLABLE')

    await this.repo.updateRequestStatus(requestId, 'guest_cancelled')
    await this.cache.del(CacheKeys.softHold(request.listingId, request.checkIn.toISOString().slice(0, 10)))
    await this.cancelScheduledJob(CacheKeys.requestExpireJob(requestId), QUEUES.BOOKING_REQUESTS)

    await this.queue.enqueue(QUEUES.EMAIL, { type: 'request-cancelled-by-guest', data: { requestId, hostId: request.hostId } })

    return { requestId, status: 'guest_cancelled' }
  }

  // ─── Booking Request: guest pay after approval ────────────────────────────

  async payApprovedRequest(requestId: string, guestId: string) {
    const request = await this.repo.findRequestByIdForGuest(requestId, guestId)
    if (!request) throw new Error('NOT_FOUND')
    if (request.status !== 'approved') throw new Error('REQUEST_NOT_APPROVED')
    if (request.paymentWindowExpiresAt && new Date() > new Date(request.paymentWindowExpiresAt)) {
      throw new Error('PAYMENT_WINDOW_EXPIRED')
    }

    const listing = await this.listingRepo.findById(request.listingId)
    if (!listing) throw new Error('LISTING_NOT_FOUND')

    const pricing   = request.priceSnapshot as unknown as PricingBreakdown
    const hostPayout = calculateHostPayout(pricing.total, pricing.serviceFee, pricing.taxes)

    const booking = await this.repo.createBooking({
      listingId:          request.listingId,
      guestId,
      hostId:             request.hostId,
      bookingRequestId:   requestId,
      checkIn:            request.checkIn,
      checkOut:           request.checkOut,
      nights:             request.nights,
      guests:             request.guests,
      agreedToHouseRules: true,
      guestVerifiedAtBooking: true,
      status:             'pending_payment' as BookingStatus,
      baseSubtotal:       pricing.rawSubtotal,
      discountAmount:     pricing.rawSubtotal - pricing.discountedSubtotal,
      discountsApplied:   pricing.discounts,
      cleaningFee:        pricing.cleaningFee,
      platformServiceFee: pricing.serviceFee,
      taxes:              pricing.taxes,
      totalAmount:        pricing.total,
      hostPayout,
      paymentProvider:    'stripe',
      payoutStatus:       'pending',
      refundStatus:       'none',
    })

    await this.repo.linkRequestToBooking(requestId, booking.id)

    const intent = await this.payment.createPaymentIntent({
      amount:    pricing.total,
      currency:  pricing.currency ?? 'INR',
      bookingId: booking.id,
      metadata:  { guestId, requestId },
    })

    await this.cache.set(
      CacheKeys.paySession(intent.intentId),
      JSON.stringify({ bookingId: booking.id, guestId, amount: pricing.total, status: 'pending' }),
      PAYMENT_SESSION_TTL_S
    )

    await this.repo.updateBooking(booking.id, { paymentOrderId: intent.intentId })

    // Cancel payment-window expire job
    await this.cancelScheduledJob(CacheKeys.paymentWindowJob(requestId), QUEUES.BOOKING_REQUESTS)

    return {
      bookingId:        booking.id,
      orderId:          intent.intentId,
      providerPayload:  { clientSecret: intent.clientSecret, status: intent.status },
      pricingBreakdown: pricing,
    }
  }

  // ─── Pre-approval (host-initiated) ────────────────────────────────────────

  async createPreApproval(hostId: string, input: {
    guestId:   string
    listingId: string
    checkIn:   string
    checkOut:  string
    message?:  string
  }) {
    const listing = await this.listingRepo.findById(input.listingId)
    if (!listing)                    throw new Error('LISTING_NOT_FOUND')
    if (listing.hostId !== hostId)   throw new Error('FORBIDDEN')
    if (listing.status !== 'active') throw new Error('LISTING_UNAVAILABLE')

    const checkInDate  = new Date(input.checkIn)
    const checkOutDate = new Date(input.checkOut)
    const nights = Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const conflict = await this.repo.hasDateConflict(input.listingId, checkInDate, checkOutDate)
    if (conflict) throw new Error('DATES_UNAVAILABLE')

    const discounts = await this.listingRepo.getActiveDiscounts(input.listingId)
    const activeDiscounts = discounts.map((d: any) => ({
      type: d.type, label: d.label ?? d.type, priority: d.priority ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: (d as any).value, isPercent: (d as any).isFlat === false,
    }))
    const pricing = calculatePrice({
      basePrice:         Number(listing.basePrice),
      nights,
      cleaningFee:       Number(listing.cleaningFee ?? 0),
      serviceFeePercent: PLATFORM_FEE_PERCENT,
      taxRules:          TAX_RULES,
      discounts:         activeDiscounts,
    })
    pricing.currency = listing.currency ?? 'INR'

    const now       = new Date()
    const expiresAt = new Date(now.getTime() + PRE_APPROVAL_WINDOW_MS)
    const reqId     = crypto.randomUUID()

    const softKey = CacheKeys.softHold(input.listingId, input.checkIn)
    await this.cache.hset(softKey, reqId, input.guestId)
    await this.cache.expire(softKey, PRE_APPROVAL_WINDOW_S)

    const request = await this.repo.createRequest({
      id:           reqId,
      listingId:    input.listingId,
      guestId:      input.guestId,
      hostId,
      checkIn:      checkInDate,
      checkOut:     checkOutDate,
      nights,
      guests:       1,
      status:       'pre_approved' as BookingRequestStatus,
      guestMessage: null,
      hostMessage:  input.message ?? null,
      priceSnapshot: pricing,
      requestedAt:  now,
      expiresAt,
    })

    const expireJobId = await this.queue.enqueueDelayed(
      QUEUES.BOOKING_REQUESTS,
      { type: 'booking-request-expire', data: { requestId: request.id } },
      PRE_APPROVAL_WINDOW_MS
    )
    await this.cache.set(CacheKeys.requestExpireJob(request.id), expireJobId, PRE_APPROVAL_WINDOW_S + 60)

    await this.queue.enqueue(QUEUES.EMAIL, { type: 'pre-approval', data: { requestId: request.id, guestId: input.guestId } })

    return {
      requestId:        request.id,
      expiresAt:        expiresAt.toISOString(),
      pricingBreakdown: pricing,
      status:           'pre_approved',
    }
  }

  // ─── Host / guest request lists ───────────────────────────────────────────

  async getHostRequests(hostId: string, opts: {
    status?: BookingRequestStatus | BookingRequestStatus[]
    page:    number
    limit:   number
    pendingOnly?: boolean
  }) {
    const status = opts.pendingOnly ? ['pending'] as BookingRequestStatus[] : opts.status
    const { requests, total } = await this.repo.findHostRequests(hostId, {
      status,
      page:   opts.page,
      limit:  opts.limit,
      sortBy: opts.pendingOnly ? 'expiresAt' : 'requestedAt',
    })
    return { data: requests, total }
  }

  async getGuestRequests(guestId: string, opts: { status?: BookingRequestStatus; page: number; limit: number }) {
    const { requests, total } = await this.repo.findGuestRequests(guestId, opts)
    return { data: requests, total }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async verifyGuestRequirements(
    guestId:  string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listing:  any
  ) {
    const guest = await this.repo.findGuestById(guestId)
    if (!guest) throw new Error('GUEST_NOT_FOUND')

    if (listing.requireVerifiedId && guest.verificationStatus !== 'verified') {
      throw new Error('GUEST_UNVERIFIED')
    }
    if (listing.requireProfilePhoto && !guest.profileImageUrl) {
      throw new Error('GUEST_NO_PHOTO')
    }
    if (listing.requirePositiveReviews) {
      const hasReview = await this.repo.guestHasPositiveReview(guestId)
      if (!hasReview) throw new Error('GUEST_NO_REVIEWS')
    }
  }

  private async cancelScheduledJob(jobCacheKey: string, queue: string): Promise<void> {
    try {
      const jobId = await this.cache.get(jobCacheKey)
      if (jobId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.queue.removeJob(queue as any, jobId)
        await this.cache.del(jobCacheKey)
      }
    } catch {
      // Non-fatal — job may have already fired
    }
  }

  private computeCancellationRefund(
    policy: string,
    daysBeforeCheckIn: number,
    booking: { totalAmount: unknown; cleaningFee: unknown; platformServiceFee: unknown; baseSubtotal: unknown }
  ) {
    const total      = Number(booking.totalAmount)
    const cleaning   = Number(booking.cleaningFee)
    const serviceFee = Number(booking.platformServiceFee)
    const base       = Number(booking.baseSubtotal)

    let refundAmount    = 0
    let penaltyDeducted = 0
    const hostPenalty: number | null = null

    switch (policy) {
      case 'flexible':
        if (daysBeforeCheckIn >= 1) { refundAmount = total }
        else { refundAmount = cleaning + serviceFee; penaltyDeducted = base }
        break

      case 'moderate':
        if (daysBeforeCheckIn >= 5) { refundAmount = total }
        else if (daysBeforeCheckIn >= 1) { refundAmount = Math.round(base * 0.5) + cleaning + serviceFee; penaltyDeducted = Math.round(base * 0.5) }
        else { refundAmount = cleaning + serviceFee; penaltyDeducted = base }
        break

      case 'strict':
        if (daysBeforeCheckIn >= 14) { refundAmount = Math.round(base * 0.5) + serviceFee; penaltyDeducted = Math.round(base * 0.5) + cleaning }
        else { refundAmount = serviceFee; penaltyDeducted = base + cleaning }
        break

      case 'super_strict':
        if (daysBeforeCheckIn >= 30) { refundAmount = Math.round(base * 0.5) + serviceFee; penaltyDeducted = Math.round(base * 0.5) + cleaning }
        else { refundAmount = serviceFee; penaltyDeducted = base + cleaning }
        break

      default:
        refundAmount = total
    }

    return { refundAmount, penaltyDeducted, hostPenalty }
  }

  private cancellationPolicyMessage(policy: string, days: number): string {
    switch (policy) {
      case 'flexible':
        return days >= 1 ? 'Full refund — cancelled at least 24h before check-in.' : 'No refund — cancelled within 24h of check-in.'
      case 'moderate':
        return days >= 5 ? 'Full refund — cancelled at least 5 days before check-in.' : days >= 1 ? '50% refund on the base price.' : 'No base refund.'
      case 'strict':
        return days >= 14 ? '50% refund on the base price.' : 'No refund — cancelled less than 14 days before check-in.'
      default:
        return '50% refund if cancelled 30+ days before check-in.'
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shapeBooking(b: any) {
    return {
      id:              b.id,
      listingId:       b.listingId,
      guestId:         b.guestId,
      hostId:          b.hostId,
      checkIn:         b.checkIn instanceof Date ? b.checkIn.toISOString().slice(0, 10) : b.checkIn,
      checkOut:        b.checkOut instanceof Date ? b.checkOut.toISOString().slice(0, 10) : b.checkOut,
      nights:          b.nights,
      guests:          b.guests,
      status:          b.status,
      refundStatus:    b.refundStatus,
      baseSubtotal:    Number(b.baseSubtotal),
      discountAmount:  Number(b.discountAmount),
      discountsApplied: b.discountsApplied ?? [],
      cleaningFee:     Number(b.cleaningFee),
      platformServiceFee: Number(b.platformServiceFee),
      taxes:           Number(b.taxes),
      totalAmount:     Number(b.totalAmount),
      hostPayout:      Number(b.hostPayout),
      paymentProvider: b.paymentProvider,
      paymentOrderId:  b.paymentOrderId,
      paymentId:       b.paymentId,
      payoutStatus:    b.payoutStatus,
      cancellationReason: b.cancellationReason,
      cancelledBy:     b.cancelledBy,
      refundAmount:    b.refundAmount !== null ? Number(b.refundAmount) : null,
      listing:         b.listing,
      guest:           b.guest,
      createdAt:       b.createdAt,
      updatedAt:       b.updatedAt,
    }
  }
}
