/**
 * Instant loading skeleton for /search.
 *
 * Next.js streams this as static HTML while the page.tsx JS bundle loads.
 * Users see a real-looking skeleton immediately instead of a blank screen,
 * which dramatically improves perceived FCP even though the data hasn't
 * arrived yet.
 */
import { ListingCardSkeleton } from '@/components/listings/ListingCard'

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-lg bg-surface shimmer" />
          <div className="h-4 w-24 rounded-lg bg-surface shimmer" />
        </div>
        <div className="h-9 w-24 rounded-xl bg-surface shimmer" />
      </div>

      {/* Quick filters skeleton */}
      <div className="py-3 mb-6 border-b border-border flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-surface shimmer shrink-0" />
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
