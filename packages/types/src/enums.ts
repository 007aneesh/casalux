export type PropertyType = 'apartment' | 'house' | 'villa' | 'cabin' | 'unique' | 'hotel'
export type RoomType = 'entire_place' | 'private_room' | 'shared_room'
export type ListingStatus = 'draft' | 'active' | 'paused' | 'archived' | 'flagged'
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict' | 'super_strict'

export type UserRole = 'guest' | 'host' | 'admin' | 'super_admin'

export type BookingStatus =
  | 'pending_request'
  | 'host_approved'
  | 'pending_payment'
  | 'confirmed'
  | 'completed'
  | 'host_declined'
  | 'guest_cancelled'
  | 'cancelled_by_host'
  | 'cancelled_by_admin'
  | 'request_expired'
  | 'payment_window_expired'
  | 'payment_failed'
  | 'payment_expired'
  | 'disputed'

export type BookingRequestStatus =
  | 'pending'
  | 'approved'
  | 'declined'
  | 'guest_cancelled'
  | 'expired'
  | 'pre_approved'
  | 'payment_window_expired'

export type PayoutStatus = 'pending' | 'initiated' | 'settled'
export type RefundStatus = 'none' | 'requested' | 'partial' | 'full' | 'processed'

export type DiscountType =
  | 'weekly_discount'
  | 'monthly_discount'
  | 'early_bird'
  | 'last_minute'
  | 'promo_code'
  | 'new_listing_promo'
  | 'seasonal'
  | 'loyalty'

export type AvailabilityRuleType =
  | 'blocked'
  | 'available'
  | 'min_nights_override'
  | 'price_override'
  | 'advance_notice'
  | 'preparation_time'

export type HostApplicationStatus =
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'auto_approved'

export type DeclineReason =
  | 'dates_unavailable'
  | 'guests_dont_fit'
  | 'not_a_good_fit'
  | 'other'

export type SortBy = 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'distance'

export type PaymentProvider = 'stripe' | 'razorpay' | 'paypal'
