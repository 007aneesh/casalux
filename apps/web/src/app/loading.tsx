import { ListingCardSkeleton } from '@/components/listings/ListingCard'

export default function Loading() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
        {Array.from({ length: 12 }).map((_, i) => <ListingCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
