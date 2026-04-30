import { useQuery } from '@tanstack/react-query'
import type {
  Listing,
  ListingSearchParams,
  AvailabilityCalendar,
  PricingBreakdown,
} from '@casalux/types'
import { apiFetch } from '../client'
import { queryKeys } from '../keys'
import { useAuthToken } from '../../lib/auth'

export interface ListingSearchResult {
  items: Listing[]
  page: number
  limit: number
  total: number
  totalPages: number
}

function flattenQuery(
  obj: Record<string, unknown>,
): Record<string, string | number | boolean | undefined | null> {
  const out: Record<string, string | number | boolean | undefined | null> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue
    if (Array.isArray(v)) out[k] = v.join(',')
    else if (typeof v === 'object') out[k] = JSON.stringify(v)
    else out[k] = v as string | number | boolean
  }
  return out
}

export function useListings(params: ListingSearchParams) {
  const getToken = useAuthToken()
  return useQuery({
    queryKey: queryKeys.listings.list(params),
    queryFn: () =>
      apiFetch<ListingSearchResult>('/api/v1/listings', {
        query: flattenQuery(params as Record<string, unknown>),
        getToken,
      }),
  })
}

export interface QuickFilter {
  key: string
  label: string
  icon?: string
}

export function useQuickFilters() {
  return useQuery({
    queryKey: queryKeys.listings.quickFilters(),
    queryFn: () =>
      apiFetch<QuickFilter[]>('/api/v1/listings/quick-filters'),
    staleTime: 1000 * 60 * 30,
  })
}

export function useListing(id: string | undefined) {
  const getToken = useAuthToken()
  return useQuery({
    queryKey: queryKeys.listings.detail(id ?? ''),
    queryFn: () =>
      apiFetch<Listing>(`/api/v1/listings/${id}`, { getToken }),
    enabled: !!id,
  })
}

export function useAvailability(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.listings.availability(id ?? ''),
    queryFn: () =>
      apiFetch<AvailabilityCalendar>(`/api/v1/listings/${id}/availability`),
    enabled: !!id,
  })
}

export interface PricingPreviewParams {
  checkIn: string
  checkOut: string
  guests: number
  promoCode?: string
}

export function usePricingPreview(
  id: string | undefined,
  params: PricingPreviewParams | null,
) {
  return useQuery({
    queryKey: queryKeys.listings.pricing(id ?? '', (params ?? {}) as Record<string, unknown>),
    queryFn: () =>
      apiFetch<PricingBreakdown>(`/api/v1/listings/${id}/pricing-preview`, {
        query: flattenQuery(params as unknown as Record<string, unknown>),
      }),
    enabled: !!id && !!params,
  })
}

export interface ListingReview {
  id: string
  rating: number
  comment: string
  createdAt: string
  guest: { firstName: string; profileImageUrl: string | null }
}

export function useListingReviews(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.listings.reviews(id ?? ''),
    queryFn: () =>
      apiFetch<{ items: ListingReview[]; avgRating: number; total: number }>(
        `/api/v1/listings/${id}/reviews`,
      ),
    enabled: !!id,
  })
}
