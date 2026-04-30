import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Booking,
  InitiateBookingRequest,
  InitiateBookingResponse,
} from '@casalux/types'
import { apiFetch } from '../client'
import { queryKeys } from '../keys'
import { useAuthToken } from '../../lib/auth'

export function useMyBookings() {
  const getToken = useAuthToken()
  return useQuery({
    queryKey: queryKeys.bookings.mine(),
    queryFn: () =>
      apiFetch<{ items: Booking[] }>('/api/v1/users/me/bookings', {
        getToken,
      }),
  })
}

export function useBooking(id: string | undefined) {
  const getToken = useAuthToken()
  return useQuery({
    queryKey: queryKeys.bookings.detail(id ?? ''),
    queryFn: () =>
      apiFetch<Booking>(`/api/v1/bookings/${id}`, { getToken }),
    enabled: !!id,
  })
}

export function useBookingStatus(id: string | undefined, enabled = true) {
  const getToken = useAuthToken()
  return useQuery({
    queryKey: queryKeys.bookings.status(id ?? ''),
    queryFn: () =>
      apiFetch<{ status: string; bookingId: string }>(
        `/api/v1/bookings/${id}/status`,
        { getToken },
      ),
    enabled: !!id && enabled,
    refetchInterval: 2000,
  })
}

export function useInitiateBooking() {
  const getToken = useAuthToken()
  return useMutation({
    mutationFn: (input: InitiateBookingRequest) =>
      apiFetch<InitiateBookingResponse>('/api/v1/bookings/initiate', {
        method: 'POST',
        body: input,
        getToken,
      }),
  })
}

export function useCancelBooking() {
  const getToken = useAuthToken()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Booking>(`/api/v1/bookings/${id}/cancel`, {
        method: 'POST',
        getToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.all })
    },
  })
}
