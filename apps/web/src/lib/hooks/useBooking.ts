'use client'
import useSWR from 'swr'
import { useAuthedRequest } from './useAuthedRequest'
import type { Booking, BookingRequest } from '@casalux/types'

export function useMyBookings(status?: string) {
  const authedRequest = useAuthedRequest()
  const qs = status ? `?status=${status}` : ''
  const { data, isLoading, error, mutate } = useSWR(
    `/users/me/bookings${qs}`,
    (path: string) => authedRequest<Booking[]>(path)
  )
  return { bookings: data?.data ?? [], meta: data?.meta, isLoading, error, mutate }
}

export function useBooking(id: string | null) {
  const authedRequest = useAuthedRequest()
  const { data, isLoading, error, mutate } = useSWR(
    id ? `/bookings/${id}` : null,
    (path: string) => authedRequest<Booking>(path)
  )
  return { booking: data?.data, isLoading, error, mutate }
}

/** Poll every 2s until booking leaves pending_payment state */
export function useBookingStatus(id: string | null) {
  const authedRequest = useAuthedRequest()
  const { data, isLoading } = useSWR(
    id ? `/bookings/${id}/status` : null,
    (path: string) => authedRequest<{ status: string }>(path),
    {
      refreshInterval: (data) => {
        const status = (data as { data?: { status?: string } } | undefined)?.data?.status
        return status === 'pending_payment' ? 2000 : 0
      },
    }
  )
  return { status: data?.data?.status, isLoading }
}

export function useBookingRequests() {
  const authedRequest = useAuthedRequest()
  const { data, isLoading, error, mutate } = useSWR(
    '/users/me/booking-requests',
    (path: string) => authedRequest<BookingRequest[]>(path)
  )
  return { requests: data?.data ?? [], isLoading, error, mutate }
}
