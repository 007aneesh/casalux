'use client'
import useSWR, { useSWRConfig } from 'swr'
import { useAuth } from '@clerk/nextjs'
import { useAuthedRequest } from './useAuthedRequest'

export interface WishlistListingImage {
  url: string
  isPrimary: boolean
  sortOrder: number
}

export interface WishlistListingItem {
  wishlistId: string
  listingId: string
  addedAt: string
  listing?: {
    id: string
    title: string
    images: WishlistListingImage[]
    basePrice: number
    currency: string
    avgRating: string | number
    totalReviews: number
    address: { city: string; state: string; country: string }
  }
}

export interface Wishlist {
  id: string
  name: string
  items?: WishlistListingItem[]
  _count?: { items: number }
}

export function useWishlists() {
  const { isSignedIn } = useAuth()
  const authedRequest = useAuthedRequest()
  const { data, isLoading, error, mutate } = useSWR(
    isSignedIn ? '/users/me/wishlists' : null,
    async (path: string) => {
      const res = await authedRequest<Wishlist[]>(path)
      // Handle both standard envelope { success, data } and raw array
      return (res as any)?.data ?? (Array.isArray(res) ? res : [])
    }
  )
  return { wishlists: (data ?? []) as Wishlist[], isLoading, error, mutate }
}

export function useWishlistCheck(listingId: string | null) {
  const { isSignedIn } = useAuth()
  const authedRequest = useAuthedRequest()
  const { data, mutate } = useSWR(
    isSignedIn && listingId ? `/users/me/wishlists/check/${listingId}` : null,
    (path: string) => authedRequest<{ saved: boolean; wishlistId: string | null }>(path),
    { revalidateOnFocus: false }
  )
  return { isSaved: data?.data?.saved ?? false, wishlistId: data?.data?.wishlistId ?? null, mutate }
}

export function useWishlistActions() {
  const { mutate } = useSWRConfig()
  const authedRequest = useAuthedRequest()

  async function quickSave(listingId: string) {
    await authedRequest('/listings/' + listingId + '/save', { method: 'POST' })
    mutate(`/users/me/wishlists/check/${listingId}`)
    mutate('/users/me/wishlists')
  }

  async function removeFromWishlist(wishlistId: string, listingId: string) {
    await authedRequest(`/users/me/wishlists/${wishlistId}/listings/${listingId}`, { method: 'DELETE' })
    mutate(`/users/me/wishlists/check/${listingId}`)
    mutate('/users/me/wishlists')
  }

  async function createWishlist(name: string) {
    await authedRequest('/users/me/wishlists', { method: 'POST', body: JSON.stringify({ name }) })
    mutate('/users/me/wishlists')
  }

  async function deleteWishlist(wishlistId: string) {
    await authedRequest(`/users/me/wishlists/${wishlistId}`, { method: 'DELETE' })
    mutate('/users/me/wishlists')
  }

  return { quickSave, removeFromWishlist, createWishlist, deleteWishlist }
}
