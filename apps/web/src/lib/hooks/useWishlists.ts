'use client'
import useSWR, { useSWRConfig } from 'swr'
import { useAuth } from '@clerk/nextjs'
import { useAuthedRequest } from './useAuthedRequest'

export interface WishlistItem {
  id: string
  listingId: string
  addedAt: string
}

export interface Wishlist {
  id: string
  name: string
  itemCount: number
  coverImageUrl: string | null
  items?: WishlistItem[]
}

export function useWishlists() {
  const { isSignedIn } = useAuth()
  const authedRequest = useAuthedRequest()
  const { data, isLoading, error, mutate } = useSWR(
    isSignedIn ? '/users/me/wishlists' : null,
    (path: string) => authedRequest<Wishlist[]>(path)
  )
  return { wishlists: data?.data ?? [], isLoading, error, mutate }
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
