export type Locale = 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'zh' | 'ar'

export interface LanguageConfig {
  code: Locale
  label: string
  flag: string
  rtl?: boolean
}

export const LANGUAGES: LanguageConfig[] = [
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',   flag: '🇩🇪' },
  { code: 'it', label: 'Italiano',  flag: '🇮🇹' },
  { code: 'ja', label: '日本語',     flag: '🇯🇵' },
  { code: 'zh', label: '中文',       flag: '🇨🇳' },
  { code: 'ar', label: 'العربية',   flag: '🇸🇦', rtl: true },
]

// ─── Namespace types ──────────────────────────────────────────────────────────

export interface NavTranslations {
  host: string
  become_a_host: string
  my_bookings: string
  wishlists: string
  messages: string
  host_dashboard: string
  sign_in: string
  sign_up: string
  search_placeholder: string
  language: string
}

export interface FooterTranslations {
  support: string
  help_centre: string
  safety_information: string
  cancellation_options: string
  hosting: string
  host_your_home: string
  resources_for_hosts: string
  community_forum: string
  casalux: string
  newsroom: string
  careers: string
  investors: string
  legal: string
  privacy: string
  terms: string
  sitemap: string
  copyright: string
  tagline: string
}

export interface HomeTranslations {
  hero_title: string
  hero_subtitle: string
  become_host_link: string
  explore_by_destination: string
  stays_near_you: string
  stays_near_you_description: string
  allow: string
  finding_near_you: string
  trending: string
  luxury_villas: string
  beachfront_escapes: string
  mountain_hideaways: string
  view_all: string
  ready_to_explore: string
  ready_description: string
  browse_all: string
}

export interface CommonTranslations {
  loading: string
  error: string
  retry: string
  save: string
  cancel: string
  confirm: string
  close: string
  back: string
  next: string
  done: string
  night: string
  nights: string
  guest: string
  guests: string
  per_night: string
  total: string
  book_now: string
  reserve: string
  check_in: string
  check_out: string
  reviews: string
  amenities: string
  location: string
  description: string
  view_all: string
  property: string
  add_date: string
  processing: string
  show_more: string
  show_less: string
  just_now: string
  minutes_ago: string   // "{n}m ago"
  hours_ago: string     // "{n}h ago"
  page_of: string       // "Page {page} of {total}"
}

export interface BookingsTranslations {
  your_trips: string
  upcoming: string
  past: string
  cancelled_tab: string
  status_confirmed: string
  status_pending_payment: string
  status_awaiting_host: string
  status_checked_in: string
  status_completed: string
  status_declined: string
  status_expired: string
  no_upcoming: string
  no_past: string
  no_cancelled: string
  no_upcoming_msg: string
  no_history_msg: string
  explore_properties: string
  failed_to_load: string
}

export interface BookingTranslations {
  // Widget
  you_wont_be_charged: string
  host_will_respond: string
  reserve_instant: string
  request_to_book: string
  min_stay: string       // "Minimum stay: {n} night(s)"
  max_guests: string     // "Max {n}"
  check_availability: string
  select_dates: string
  // Price breakdown
  price_x_nights: string // "{price} × {nights} night{s}"
  cleaning_fee: string
  service_fee: string
  taxes: string
  // Book page
  back_to_listing: string
  confirm_booking: string
  request_booking: string
  your_trip: string
  dates: string
  not_selected: string
  duration: string
  promo_code: string
  enter_promo: string
  apply: string
  house_rules: string
  checkin_after: string  // "Check-in: after {time}"
  checkout_before: string // "Check-out: before {time}"
  max_guests_rule: string // "Max {n} guest(s)"
  no_pets: string
  agreement: string
  terms_of_service: string
  cancellation_policy: string
  confirm_pay: string
  send_request: string
  no_charge_until: string
  no_charge_until_approved: string
  price_details: string
  // Availability calendar
  min_nights_select: string // "Minimum {n} night{s} — select your check-out date"
  // Confirmation page
  confirmed_title: string
  confirmed_msg: string
  pending_title: string
  pending_msg: string
  approved_title: string
  approved_msg: string
  payment_failed_title: string
  payment_failed_msg: string
  failed_title: string
  failed_msg: string
  booking_reference: string
  checking_payment: string
  view_booking: string
  message_host: string
  try_again: string
  return_home: string
  continue_browsing: string
}

export interface MessagesTranslations {
  title: string
  you_prefix: string
  no_messages: string
  no_messages_description: string
}

export interface HostTranslations {
  nav_overview: string
  nav_listings: string
  nav_requests: string
  nav_calendar: string
  nav_messages: string
  host_centre: string
  add_listing: string
  // Dashboard
  overview_title: string
  welcome_back: string
  this_month: string
  earnings: string
  pending: string
  booking_requests: string
  active: string
  of_n_listings: string  // "of {n} listings"
  avg_rating: string
  n_reviews: string      // "{n} reviews"
  pending_requests: string
  all_caught_up: string
  no_pending_requests: string
  start_earning: string
  block_dates: string
  manage_calendar: string
  // Listings
  my_listings: string
  n_properties: string   // "{n} property" / "{n} properties"
  edit_listing: string
  pause_listing: string
  activate_listing: string
  preview: string
  delete: string
  delete_confirm: string
  no_listings: string
  no_listings_msg: string
  create_listing: string
  status_active: string
  status_paused: string
  status_draft: string
  status_in_review: string
  instant_badge: string
  // Calendar
  availability_calendar: string
  select_listing: string
  choose_listing: string
  month_jan: string
  month_feb: string
  month_mar: string
  month_apr: string
  month_may: string
  month_jun: string
  month_jul: string
  month_aug: string
  month_sep: string
  month_oct: string
  month_nov: string
  month_dec: string
  day_sun: string
  day_mon: string
  day_tue: string
  day_wed: string
  day_thu: string
  day_fri: string
  day_sat: string
  legend_blocked: string
  legend_booked: string
  legend_selected: string
  n_dates_selected: string // "{n} date(s) selected to block"
  click_to_block: string
  // Host bookings
  booking_requests_title: string
  tab_pending: string
  tab_approved: string
  tab_all: string
  decline: string
  approve: string
  no_pending: string
  no_bookings_found: string
  status_pending: string
  status_approved: string
  status_declined: string
  status_cancelled: string
  status_checked_in: string
  status_completed: string
  n_guests: string       // "{n} guest(s)"
  // Onboarding
  onboarding_loading: string
  onboarding_error: string
  onboarding_generic_error: string
}

export interface SearchTranslations {
  stays_in: string       // "Stays in {location}"
  all_listings: string
  n_stays: string        // "{n}+ stays"
  no_results: string
  filters: string
  clear_all: string
  show_more: string
  property_type: string
  type_apartment: string
  type_house: string
  type_villa: string
  type_cabin: string
  type_unique: string
  type_hotel: string
  price_range: string
  any: string
  min_price: string
  max_price: string
  min_rating: string
  instant_book: string
  instant_book_desc: string
  reset: string
  show_results: string
  no_match: string
  no_match_desc: string
}

export interface ListingTranslations {
  home_breadcrumb: string
  about_place: string
  what_offers: string
  reviews_section: string
  location_section: string
  location_note: string
  cancellation_section: string
  policy_flexible: string
  policy_moderate: string
  policy_strict: string
  policy_super_strict: string
  type_apartment: string
  type_house: string
  type_villa: string
  type_cabin: string
  type_unique: string
  type_hotel: string
  instant_book_title: string
  instant_book_desc: string
  checkin_time: string    // "Check-in: {time}"
  checkout_time: string   // "Check-out by {time}"
  min_nights: string      // "{n}-night minimum"
  max_nights: string      // "Up to {n} nights"
  no_max_nights: string
  protection_title: string
  protection_desc: string
  n_reviews: string       // "{review_count} review(s)"
  guest_favourite: string
  previous_image: string
  next_image: string
  save_wishlist: string
  remove_wishlist: string
  show_all_photos: string   // "Show all {n} photos"
  view_photo: string
  image_counter: string     // "{current} / {total}"
  show_more_text: string
  show_less_text: string
  show_all_amenities: string  // "Show all {n} amenities"
  show_fewer_amenities: string
  previous_page: string
  next_page: string
}

export interface ProfileTranslations {
  personal_info: string
  full_name: string
  email: string
  phone: string
  not_added: string
  account: string
  privacy_safety: string
  notifications: string
  payments_payouts: string
  language_currency: string
  language_currency_value: string
  hosting_section: string
  host_dashboard: string
  my_listings: string
  trips: string
  saved: string
  reviews: string
  member_badge: string
  guest_default: string
  manage_account_note: string
}

export interface WishlistsTranslations {
  title: string
  new_list: string
  create_title: string
  name_placeholder: string
  cancel: string
  create: string
  no_wishlists: string
  no_wishlists_msg: string
  create_first: string
  delete_confirm: string
  n_saved: string         // "{n} saved"
  sign_in_message: string
  nothing_saved: string
  nothing_saved_msg: string
  explore_listings: string
  remove_aria: string
}

export interface BecomeHostTranslations {
  label: string
  hero_title: string
  hero_description: string
  get_started: string
  already_have_account: string
  start_setup: string
  avg_earning_label: string
  avg_earning_value: string
  avg_earning_sub: string
  perk_no_fee: string
  perk_payout: string
  perk_support: string
  why_title: string
  benefit_earn_title: string
  benefit_earn_desc: string
  benefit_guarantee_title: string
  benefit_guarantee_desc: string
  benefit_reach_title: string
  benefit_reach_desc: string
  benefit_rules_title: string
  benefit_rules_desc: string
  how_title: string
  step_1: string
  step_2: string
  step_3: string
  step_4: string
  ready_title: string
  ready_desc: string
  create_account: string
  continue_setup: string
}

export interface FiltersTranslations {
  all: string
  trending: string
  beachfront: string
  amazing_pools: string
  luxe: string
  cabins: string
  instant_book: string
  pet_friendly: string
  new: string
}

export interface AmenitiesTranslations {
  wifi: string
  full_kitchen: string
  private_pool: string
  hot_tub: string
  gym: string
  indoor_fireplace: string
  central_heating: string
  air_conditioning: string
  smart_tv: string
  pets_allowed: string
  free_parking: string
  ev_charger: string
  mountain_view: string
  ocean_view: string
  private_garden: string
  crib: string
  wheelchair_accessible: string
  self_checkin: string
  smoke_alarm: string
  co_alarm: string
  washer: string
  dryer: string
  bbq_grill: string
  dedicated_workspace: string
  fast_wifi: string
  sauna: string
  beachfront: string
  beach_access: string
  ski_in_out: string
  lake_access: string
}

export interface WishlistPickerTranslations {
  title: string
  loading: string
  empty: string
  n_saved: string        // "{n} saved"
  saving: string
  name_placeholder: string
  new_list: string
}

// ─── Root type ────────────────────────────────────────────────────────────────

export interface TranslationKeys {
  nav: NavTranslations
  footer: FooterTranslations
  home: HomeTranslations
  common: CommonTranslations
  bookings: BookingsTranslations
  booking: BookingTranslations
  messages: MessagesTranslations
  host: HostTranslations
  search: SearchTranslations
  listing: ListingTranslations
  profile: ProfileTranslations
  wishlists: WishlistsTranslations
  become_host: BecomeHostTranslations
  filters: FiltersTranslations
  amenities: AmenitiesTranslations
  wishlist_picker: WishlistPickerTranslations
}
