'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft, Heart, Trash2, MapPin, Star } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { useAuthedRequest } from '@/lib/hooks/useAuthedRequest'
import { useWishlistActions } from '@/lib/hooks/useWishlists'
import { formatPrice } from '@/lib/utils'
import { Skeleton } from '@casalux/ui'

function ListingCard({ item, onRemove }: { item: any; onRemove: () => void }) {
  const listing = item.listing
  if (!listing) return null

  const image = listing.images?.[0]?.url
  const city = listing.address?.city ?? ''
  const country = listing.address?.country ?? ''

  return (
    <div className="group relative">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
          {image ? (
            <Image
              src={image}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-navy/5 flex items-center justify-center">
              <Heart size={28} className="text-navy/20" />
            </div>
          )}
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground line-clamp-1">
              {city}{city && country ? ', ' : ''}{country}
            </p>
            {listing.totalReviews > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
                <span className="text-sm font-medium">{parseFloat(listing.avgRating).toFixed(2)}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted line-clamp-1">{listing.title}</p>
          <p className="text-sm font-semibold text-foreground">
            {formatPrice(listing.basePrice, listing.currency)}
            <span className="font-normal text-muted"> / night</span>
          </p>
        </div>
      </Link>

      {/* Remove button */}
      <button
        onClick={(e) => { e.preventDefault(); onRemove() }}
        className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
        aria-label="Remove from wishlist"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export default function WishlistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const authedRequest = useAuthedRequest()
  const { removeFromWishlist } = useWishlistActions()

  const { data, isLoading, mutate } = useSWR(
    isSignedIn && id ? `/wishlist-detail-${id}` : null,
    async () => {
      const res = await authedRequest<any>(`/users/me/wishlists/${id}`)
      return (res as any)?.data?.wishlist ?? (res as any)?.wishlist ?? null
    }
  )

  const wishlist = data

  async function handleRemove(listingId: string) {
    if (!id) return
    await removeFromWishlist(id, listingId)
    mutate()
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Please sign in to view your wishlists.</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="h-9 w-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:border-gray-400 transition"
          >
            <ArrowLeft size={16} />
          </button>
          {isLoading ? (
            <Skeleton className="h-7 w-40" />
          ) : (
            <h1 className="font-display text-2xl font-bold text-navy">{wishlist?.name ?? 'Wishlist'}</h1>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/3] rounded-2xl mb-3" />
                <Skeleton className="h-4 w-2/3 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : !wishlist?.items?.length ? (
          <div className="text-center py-20">
            <Heart size={40} className="mx-auto mb-3 text-gold/40" />
            <p className="font-semibold text-navy text-lg mb-1">Nothing saved yet</p>
            <p className="text-sm text-muted mb-6">Browse listings and tap the heart to save them here.</p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition"
            >
              Explore listings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {wishlist.items.map((item: any) => (
              <ListingCard
                key={item.listingId}
                item={item}
                onRemove={() => handleRemove(item.listingId)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
