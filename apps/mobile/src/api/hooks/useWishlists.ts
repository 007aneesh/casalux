import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Listing } from '@casalux/types'
import { apiFetch } from '../client'
import { queryKeys } from '../keys'
import { useAuthToken } from '../../lib/auth'

export interface Wishlist {
  id: string
  name: string
  listings: Listing[]
  createdAt: string
}

export function useWishlists() {
  const getToken = useAuthToken()
  return useQuery({
    queryKey: queryKeys.wishlists.list(),
    queryFn: () =>
      apiFetch<{ items: Wishlist[] }>('/api/v1/users/me/wishlists', {
        getToken,
      }),
  })
}

export function useCreateWishlist() {
  const getToken = useAuthToken()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<Wishlist>('/api/v1/users/me/wishlists', {
        method: 'POST',
        body: { name },
        getToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.wishlists.all })
    },
  })
}

export function useDeleteWishlist() {
  const getToken = useAuthToken()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/api/v1/users/me/wishlists/${id}`, {
        method: 'DELETE',
        getToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.wishlists.all })
    },
  })
}

export function useToggleSaveListing() {
  const getToken = useAuthToken()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      listingId,
      wishlistId,
    }: {
      listingId: string
      wishlistId?: string
    }) =>
      apiFetch<{ saved: boolean }>(`/api/v1/listings/${listingId}/save`, {
        method: 'POST',
        body: { wishlistId },
        getToken,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.wishlists.all })
    },
  })
}
