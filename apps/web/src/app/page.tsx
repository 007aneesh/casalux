import { Suspense } from 'react'
import { SearchBar } from '@/components/layout/SearchBar'
import { QuickFilters } from '@/components/listings/QuickFilters'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { ListingCardSkeleton } from '@/components/listings/ListingCard'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6">

      {/* Hero search — visible on mobile, replaces nav search */}
      <section className="pt-8 pb-6 md:hidden">
        <h1 className="font-display text-3xl font-semibold text-navy mb-4 leading-tight">
          Find your perfect<br />luxury escape
        </h1>
        <SearchBar />
      </section>

      {/* Quick filters */}
      <section className="py-4 border-b border-border">
        <QuickFilters />
      </section>

      {/* Listing grid */}
      <section className="py-8">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
              {Array.from({ length: 12 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          }
        >
          <ListingGrid />
        </Suspense>
      </section>

    </div>
  )
}
