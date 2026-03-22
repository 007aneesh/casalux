import type {
  BookingStatus,
  BookingRequestStatus,
  PaymentProvider,
  PayoutStatus,
  RefundStatus,
  DeclineReason,
} from './enums.js'
import type { PricingBreakdown } from './listing.js'

export interface Booking {
  id: string
  bookingRequestId: string | null
  listingId: string
  guestId: string
  hostId: string
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  agreedToHouseRules: boolean
  guestVerifiedAtBooking: boolean
  status: BookingStatus
  refundStatus: RefundStatus | null
  baseSubtotal: number
  discountAmount: number
  discountsApplied: Array<{ type: string; label: string; amount: number }>
  cleaningFee: number
  platformServiceFee: number
  taxes: number
  totalAmount: number
  hostPayout: number
  paymentProvider: PaymentProvider
  paymentOrderId: string
  paymentId: string | null
  payoutId: string | null
  payoutStatus: PayoutStatus
  cancellationReason: string | null
  cancelledBy: 'guest' | 'host' | 'admin' | 'system' | null
  hostCancellationPenalty: number | null
  refundAmount: number | null
  createdAt: string
  updatedAt: string
}

export interface BookingRequest {
  id: string
  listingId: string
  guestId: string
  hostId: string
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  status: BookingRequestStatus
  guestMessage: string | null
  hostMessage: string | null
  declineReason: DeclineReason | null
  priceSnapshot: PricingBreakdown
  requestedAt: string
  respondedAt: string | null
  expiresAt: string
  paymentWindowExpiresAt: string | null
  bookingId: string | null
}

export interface InitiateBookingRequest {
  listingId: string
  checkIn: string
  checkOut: string
  guests: number
  promoCode?: string
  agreedToHouseRules: boolean
}

export interface InitiateBookingResponse {
  bookingId: string
  orderId: string
  providerPayload: Record<string, unknown>
  pricingBreakdown: PricingBreakdown
}

export interface CancellationPreview {
  refundAmount: number
  refundBreakdown: {
    baseSubtotal: number
    penaltyDeducted: number
    serviceFeeRefund: number
    cleaningFeeRefund: number
  }
  cancellationPolicy: string
  daysBeforeCheckIn: number
  message: string
  hostPenalty: number | null
}
