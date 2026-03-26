'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { ListingCard, ListingCardSkeleton } from './ListingCard'
import { useListings } from '@/lib/hooks/useListings'
import { useSearchStore } from '@/lib/store/search'

export function ListingGrid() {
  const { params } = useSearchStore()
  const { listings, isLoading, isValidating, hasMore, size, setSize } = useListings(params)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Infinite scroll via IntersectionObserver
  const loadMore = useCallback(() => {
    if (!isValidating && hasMore) setSize(size + 1)
  }, [isValidating, hasMore, size, setSize])

  useEffect(() => {
    if (!sentinelRef.current) return
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [loadMore])

  // Initial loading — show skeletons
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!isLoading && listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 rounded-full bg-surface flex items-center justify-center mb-4">
          <span className="text-3xl">🏡</span>
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">No listings found</h3>
        <p className="text-sm text-muted max-w-xs">
          Try adjusting your search filters or exploring a different location.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
        {listings.map((listing, i) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            priority={i < 4}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Load more indicator */}
      {isValidating && !isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      )}

      {!hasMore && listings.length > 0 && (
        <p className="text-center text-sm text-muted py-8">
          You&apos;ve seen all available listings
        </p>
      )}
    </>
  )
}
