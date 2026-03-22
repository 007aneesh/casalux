import type { PropertyType, RoomType, ListingStatus, CancellationPolicy, SortBy } from './enums.js'

export interface ListingImage {
  publicId: string
  url: string
  width: number
  height: number
  isPrimary: boolean
  order: number
}

export interface ListingAddress {
  street: string
  city: string
  state: string
  country: string
  zip: string
}

export interface Listing {
  id: string
  hostId: string
  title: string
  description: string
  propertyType: PropertyType
  roomType: RoomType
  status: ListingStatus
  address: ListingAddress
  lat: number
  lng: number
  amenities: string[]
  images: ListingImage[]
  basePrice: number        // cents
  currency: string         // ISO 4217
  cleaningFee: number      // cents
  minNights: number
  maxNights: number | null
  maxGuests: number
  bedrooms: number
  beds: number
  baths: number
  instantBook: boolean
  checkInTime: string      // HH:MM
  checkOutTime: string     // HH:MM
  cancellationPolicy: CancellationPolicy
  avgRating: number
  totalReviews: number
  requireVerifiedId: boolean
  requireProfilePhoto: boolean
  requirePositiveReviews: boolean
  createdAt: string
  updatedAt: string
}

export interface ListingSearchParams {
  location?: string
  lat?: number
  lng?: number
  radius?: number
  checkIn?: string
  checkOut?: string
  guests?: number
  minPrice?: number
  maxPrice?: number
  propertyType?: PropertyType[]
  roomType?: RoomType[]
  amenities?: string[]
  minBedrooms?: number
  minBeds?: number
  minBaths?: number
  instantBook?: boolean
  petFriendly?: boolean
  selfCheckIn?: boolean
  minRating?: number
  cancellationPolicy?: CancellationPolicy
  quickFilter?: string
  sortBy?: SortBy
  page?: number
  limit?: number
}

export interface PricingBreakdown {
  rawSubtotal: number
  discounts: Array<{ type: string; label: string; amount: number }>
  discountedSubtotal: number
  cleaningFee: number
  serviceFee: number
  taxes: number
  total: number
  currency: string
  nights: number
}

export interface AvailabilityCalendar {
  availableDates: string[]
  blockedDates: string[]
  minNights: number
  advanceNoticeDays: number
}
