'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import { useWishlistCheck, useWishlistActions } from '@/lib/hooks/useWishlists'
import { useAuth } from '@clerk/nextjs'
import { Badge } from '@casalux/ui'
import type { Listing } from '@casalux/types'
import { WishlistPicker } from './WishlistPicker'

interface ListingCardProps {
  listing:   Listing
  className?: string
  priority?: boolean
  /** Passed through to next/image sizes — callers know the layout better */
  sizes?:    string
}

export function ListingCard({ listing, className, priority = false, sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw' }: ListingCardProps) {
  const { isSignedIn } = useAuth()
  const [currentImage, setCurrentImage] = useState(0)
  const [isWishlistLoading, setIsWishlistLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const { isSaved, wishlistId, mutate: mutateWishlist } = useWishlistCheck(listing.id)
  const { removeFromWishlist } = useWishlistActions()

  const images = (listing?.images?.length ?? 0) > 0
    ? [...listing.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [{ url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', publicId: 'placeholder', isPrimary: true, order: 0, width: 800, height: 600 }]

  // address comes from ES top-level city/country for search results,
  // and from the nested address object for detail-page listings
  const city    = listing?.address?.city    ?? (listing as any)?.city    ?? ''
  const country = listing?.address?.country ?? (listing as any)?.country ?? ''

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setCurrentImage((c) => (c + 1) % images.length)
  }, [images.length])

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setCurrentImage((c) => (c - 1 + images.length) % images.length)
  }, [images.length])

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isSignedIn || isWishlistLoading) return

    if (isSaved && wishlistId) {
      setIsWishlistLoading(true)
      try {
        await removeFromWishlist(wishlistId, listing.id)
        mutateWishlist()
      } finally {
        setIsWishlistLoading(false)
      }
    } else {
      setShowPicker(true)
    }
  }

  return (
    <>
    {showPicker && (
      <WishlistPicker
        listingId={listing.id}
        onClose={() => { setShowPicker(false); mutateWishlist() }}
      />
    )}
    <Link
      href={`/listings/${listing.id}`}
      className={cn('group block', className)}
    >
      {/* Image carousel */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
        {images?.map((img, idx) => {
          // Only mount the first image and the currently-visible image.
          // This prevents a card with 5 images × 12 results from firing
          // 60 simultaneous image requests on the search page.
          // When the user navigates the carousel, the new image renders on demand.
          if (idx !== 0 && idx !== currentImage) return null
          return (
            <div
              key={img.publicId}
              className={cn(
                'absolute inset-0 transition-opacity duration-300',
                idx === currentImage ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Image
                src={img.url}
                alt={listing.title}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                sizes={sizes}
                priority={priority && idx === 0}
              />
            </div>
          )
        })}

        {/* Image gradient overlay */}
        <div className="absolute inset-0 listing-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Carousel controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                'hover:bg-white hover:scale-105',
                currentImage === 0 && 'invisible'
              )}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={nextImage}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                'hover:bg-white hover:scale-105',
                currentImage === images?.length - 1 && 'invisible'
              )}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images?.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-all duration-200',
                    i === currentImage ? 'w-4 bg-white' : 'w-1 bg-white/60'
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {listing?.instantBook && (
            <Badge variant="gold" className="text-[10px] px-2 py-0.5 gap-1">
              <Zap className="h-2.5 w-2.5" />
              Instant
            </Badge>
          )}
          {listing?.avgRating >= 4.9 && listing?.totalReviews >= 10 && (
            <Badge variant="default" className="text-[10px] px-2 py-0.5">
              Guest favourite
            </Badge>
          )}
        </div>

        {/* Wishlist button */}
        {isSignedIn && (
          <button
            onClick={handleWishlist}
            disabled={isWishlistLoading}
            className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all disabled:opacity-60"
            aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                isSaved ? 'fill-red-500 text-red-500' : 'text-white'
              )}
            />
          </button>
        )}
      </div>

      {/* Card info */}
      <div className="mt-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
            {city}{city && country ? ', ' : ''}{country}
          </p>
          {listing.totalReviews > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
              <span className="text-sm font-medium">{listing?.avgRating?.toFixed(2)}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted line-clamp-1">{listing?.title}</p>

        <p className="text-sm font-semibold text-foreground">
          {formatPrice(listing?.basePrice, listing?.currency)}
          <span className="font-normal text-muted"> / night</span>
        </p>
      </div>
    </Link>
    </>
  )
}

// Skeleton version
export function ListingCardSkeleton() {
  return (
    <div className="block">
      <div className="aspect-[4/3] rounded-2xl bg-surface shimmer" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-3/4 rounded-lg bg-surface shimmer" />
        <div className="h-3.5 w-1/2 rounded-lg bg-surface shimmer" />
        <div className="h-4 w-1/3 rounded-lg bg-surface shimmer" />
      </div>
    </div>
  )
}
