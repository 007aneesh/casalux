'use client'
import useSWR, { useSWRConfig } from 'swr'
import { useAuth } from '@clerk/nextjs'
import { useAuthedRequest } from './useAuthedRequest'

export interface HostStats {
  activeListings:    number
  totalListings:     number
  pendingRequests:   number
  confirmedBookings: number
  upcomingCheckIns:  number
  thisMonthEarnings: number
  allTimeEarnings:   number
  totalBookings:     number
  totalEarnings:     number
  avgRating:         number
  reviewCount:       number
}

export interface HostListing {
  id: string
  title: string
  status: 'active' | 'inactive' | 'draft' | 'pending_review'
  pricePerNight: number
  location: { city: string; country: string }
  images: string[]
  avgRating: number | null
  reviewCount: number
  bookingCount: number
  instantBook: boolean
}

export interface HostBookingRequest {
  id: string
  listingId: string
  listingTitle: string
  listingImage: string | null
  guestName: string
  guestImage: string | null
  guestCount: number
  checkIn: string
  checkOut: string
  totalAmount: number
  status: string
  message: string | null
  requestedAt: string
}

export function useHostStats() {
  const { isSignedIn } = useAuth()
  const authedRequest = useAuthedRequest()
  const { data, isLoading, error } = useSWR(
    isSignedIn ? '/host/stats' : null,
    (path: string) => authedRequest<HostStats>(path)
  )
  return { stats: data?.data ?? null, isLoading, error }
}

export function useHostListings() {
  const { isSignedIn } = useAuth()
  const authedRequest = useAuthedRequest()
  const { data, isLoading, error, mutate } = useSWR(
    isSignedIn ? '/host/listings' : null,
    (path: string) => authedRequest<HostListing[]>(path)
  )
  return { listings: data?.data ?? [], isLoading, error, mutate }
}

export function useHostBookingRequests() {
  const { isSignedIn } = useAuth()
  const authedRequest = useAuthedRequest()
  const { data, isLoading, error, mutate } = useSWR(
    isSignedIn ? '/host/booking-requests' : null,
    (path: string) => authedRequest<HostBookingRequest[]>(path),
    { refreshInterval: 30000 }
  )
  return { requests: data?.data ?? [], isLoading, error, mutate }
}

export function useHostCalendar(listingId: string | null, year: number, month: number) {
  const { isSignedIn } = useAuth()
  const authedRequest = useAuthedRequest()
  const { data, isLoading, error, mutate } = useSWR(
    isSignedIn && listingId
      ? `/host/listings/${listingId}/calendar?year=${year}&month=${month}`
      : null,
    (path: string) => authedRequest<{ blockedDates: string[]; bookings: any[] }>(path)
  )
  return { calendar: data?.data ?? null, isLoading, error, mutate }
}

export function useHostActions() {
  const { mutate } = useSWRConfig()
  const authedRequest = useAuthedRequest()

  async function approveRequest(bookingId: string) {
    await authedRequest(`/host/booking-requests/${bookingId}/approve`, { method: 'POST' })
    mutate('/host/booking-requests')
    mutate('/host/stats')
  }

  async function declineRequest(bookingId: string, reason?: string) {
    await authedRequest(`/host/booking-requests/${bookingId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
    mutate('/host/booking-requests')
    mutate('/host/stats')
  }

  async function toggleListingStatus(listingId: string, active: boolean) {
    await authedRequest(`/host/listings/${listingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: active ? 'active' : 'paused' }),
    })
    mutate('/host/listings')
    mutate('/host/stats')
  }

  async function deleteListing(listingId: string) {
    await authedRequest(`/host/listings/${listingId}`, { method: 'DELETE' })
    mutate('/host/listings')
    mutate('/host/stats')
  }

  return { approveRequest, declineRequest, toggleListingStatus, deleteListing }
}
