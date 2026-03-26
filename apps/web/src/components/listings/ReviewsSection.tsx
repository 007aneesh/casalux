'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { Button, Skeleton } from '@casalux/ui'
import { useListingReviews } from '@/lib/hooks/useListings'
import { formatDateShort } from '@/lib/utils'

interface ReviewsSectionProps {
  listingId: string
  avgRating: number
  totalReviews: number
}

export function ReviewsSection({ listingId, avgRating, totalReviews }: ReviewsSectionProps) {
  const [page, setPage] = useState(1)
  const { reviews, meta, isLoading } = useListingReviews(listingId, page)

  if (totalReviews === 0) return null

  return (
    <div>
      {/* Rating summary */}
      <div className="flex items-center gap-3 mb-6">
        <Star className="h-5 w-5 fill-foreground text-foreground" />
        <span className="text-lg font-semibold">{avgRating.toFixed(2)}</span>
        <span className="text-muted">·</span>
        <span className="text-foreground font-medium">{totalReviews} reviews</span>
      </div>

      {/* Review cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ReviewSkeleton key={i} />)
          : reviews.map((review) => (
              <div key={review.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-surface">
                    {review.guestAvatarUrl ? (
                      <Image
                        src={review.guestAvatarUrl}
                        alt={review.guestName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-navy text-white text-sm font-semibold">
                        {review.guestName?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{review.guestName}</p>
                    <p className="text-xs text-muted">{formatDateShort(review.createdAt)}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < review.rating ? 'fill-foreground text-foreground' : 'text-border'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted leading-relaxed line-clamp-4">{review.comment}</p>
              </div>
            ))}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted">
            Page {page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

function ReviewSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-5/6" />
      <Skeleton className="h-3.5 w-4/6" />
    </div>
  )
}
