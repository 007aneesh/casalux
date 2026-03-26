'use client'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { apiRequest } from '../api-client'
import { buildQueryString } from '../utils'
import type { Listing, ListingSearchParams, PricingBreakdown, AvailabilityCalendar } from '@casalux/types'
import type { ApiResponse } from '@casalux/types'

// ---------- Fetchers ----------

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json())

// ---------- Listing Feed (infinite) ----------

export function useListings(params: ListingSearchParams = {}, enabled = true) {
  const getKey = (pageIndex: number, previousPageData: ApiResponse<Listing[]> | null) => {
    if (!enabled) return null
    if (previousPageData && !previousPageData.data?.length) return null
    return `/api/v1/listings${buildQueryString({ ...params, page: pageIndex + 1, limit: 20 })}`
  }

  const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite(
    getKey,
    (url: string) => apiRequest<Listing[]>(url.replace('/api/v1', '')),
    { revalidateFirstPage: false }
  )

  const listings = data?.flatMap((page) => page.data ?? []) ?? []
  const totalFromMeta = data?.[data.length - 1]?.meta?.total ?? 0
  const hasMore = listings.length < totalFromMeta

  return { listings, isLoading, isValidating, error, hasMore, size, setSize, mutate }
}

// ---------- Single Listing ----------

export function useListing(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/listings/${id}` : null,
    (path: string) => apiRequest<Listing>(path)
  )
  return { listing: data?.data, isLoading, error, mutate }
}

// ---------- Quick Filters ----------

export interface QuickFilter {
  slug: string
  label: string
  icon?: string
  count: number
}

export function useQuickFilters() {
  const { data, error, isLoading } = useSWR(
    '/listings/quick-filters',
    (path: string) => apiRequest<QuickFilter[]>(path)
  )
  return { filters: data?.data ?? [], isLoading, error }
}

// ---------- Availability ----------

export function useAvailability(listingId: string | null) {
  const { data, isLoading, error } = useSWR(
    listingId ? `/listings/${listingId}/availability` : null,
    (path: string) => apiRequest<AvailabilityCalendar>(path)
  )
  return { availability: data?.data, isLoading, error }
}

// ---------- Pricing Preview ----------

export function usePricingPreview(
  listingId: string | null,
  params: { checkIn?: string; checkOut?: string; guests?: number; promoCode?: string }
) {
  const enabled = !!(listingId && params.checkIn && params.checkOut && params.guests)
  const { data, isLoading, error } = useSWR(
    enabled
      ? `/listings/${listingId}/pricing-preview${buildQueryString(params)}`
      : null,
    (path: string) => apiRequest<PricingBreakdown>(path),
    { dedupingInterval: 2000 }
  )
  return { pricing: data?.data, isLoading, error }
}

// ---------- Reviews ----------

export interface Review {
  id: string
  guestId: string
  guestName: string
  guestAvatarUrl: string | null
  rating: number
  comment: string
  createdAt: string
}

export function useListingReviews(listingId: string | null, page = 1) {
  const { data, isLoading, error } = useSWR(
    listingId ? `/listings/${listingId}/reviews?page=${page}&limit=10` : null,
    (path: string) => apiRequest<Review[]>(path)
  )
  return { reviews: data?.data ?? [], meta: data?.meta, isLoading, error }
}
