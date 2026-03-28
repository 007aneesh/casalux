'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SlidersHorizontal, X, Star } from 'lucide-react'
import { Button, Badge, Separator } from '@casalux/ui'
import { ListingCard, ListingCardSkeleton } from '@/components/listings/ListingCard'
import { QuickFilters } from '@/components/listings/QuickFilters'
import { useListings } from '@/lib/hooks/useListings'
import { useSearchStore } from '@/lib/store/search'
import { formatPrice } from '@/lib/utils'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const { params, setParams } = useSearchStore()
  const [filterOpen, setFilterOpen] = useState(false)

  // Sync URL params to store on initial load
  useEffect(() => {
    const location = searchParams.get('location') ?? undefined
    const checkIn = searchParams.get('checkIn') ?? undefined
    const checkOut = searchParams.get('checkOut') ?? undefined
    const guests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!, 10) : undefined
    setParams({ location, checkIn, checkOut, guests })
  }, []) // eslint-disable-line

  const { listings, isLoading, isValidating, hasMore, size, setSize } = useListings(params)

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">
            {params.location ? `Stays in ${params.location}` : 'All listings'}
          </h1>
          {!isLoading && (
            <p className="text-sm text-muted mt-0.5">
              {listings.length > 0 ? `${listings.length}+ stays` : 'No results'}
            </p>
          )}
        </div>

        {/* Filters button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Active filter chips */}
      <ActiveFilters />

      {/* Quick filters */}
      <div className="py-3 mb-6 border-b border-border">
        <QuickFilters />
      </div>

      {/* Results grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
          {Array.from({ length: 12 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
            {listings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} priority={i < 4} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-10">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setSize(size + 1)}
                disabled={isValidating}
              >
                {isValidating ? 'Loading…' : 'Show more listings'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Filter drawer */}
      {filterOpen && (
        <FilterDrawer onClose={() => setFilterOpen(false)} />
      )}
    </div>
  )
}

function ActiveFilters() {
  const { params, setParams } = useSearchStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const chips: Array<{ key: string; label: string }> = []

  if (params.location) chips.push({ key: 'location', label: params.location })
  if (params.checkIn && params.checkOut) chips.push({ key: 'dates', label: `${params.checkIn} – ${params.checkOut}` })
  if (params.guests && params.guests > 1) chips.push({ key: 'guests', label: `${params.guests} guests` })
  if (params.instantBook) chips.push({ key: 'instantBook', label: 'Instant Book' })
  if (params.minRating) chips.push({ key: 'minRating', label: `★ ${params.minRating}+` })

  if (chips.length === 0) return null

  const removeFromUrl = (key: string) => {
    const next = new URLSearchParams(searchParams.toString())
    if (key === 'dates') { next.delete('checkIn'); next.delete('checkOut') }
    else next.delete(key)
    const qs = next.toString()
    router.replace(qs ? `/search?${qs}` : '/search')
  }

  const clearAll = () => {
    setParams({})
    router.replace('/search')
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => { setParams({ [chip.key]: undefined }); removeFromUrl(chip.key) }}
          className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:border-foreground transition-colors"
        >
          {chip.label}
          <X className="h-3 w-3 text-muted" />
        </button>
      ))}
      <button
        onClick={clearAll}
        className="text-xs font-semibold text-foreground underline underline-offset-2 px-2"
      >
        Clear all
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <span className="text-5xl mb-4">🏡</span>
      <h3 className="font-display text-xl font-semibold text-foreground mb-2">No listings match your search</h3>
      <p className="text-sm text-muted max-w-xs">
        Try adjusting your dates, guests, or filters to find available properties.
      </p>
    </div>
  )
}

function FilterDrawer({ onClose }: { onClose: () => void }) {
  const { params, setParams } = useSearchStore()
  const [minPrice, setMinPrice] = useState(params.minPrice ?? 0)
  const [maxPrice, setMaxPrice] = useState(params.maxPrice ?? 50000000)
  const [minRating, setMinRating] = useState(params.minRating ?? 0)
  const [instantBook, setInstantBook] = useState(params.instantBook ?? false)
  const [propertyTypes, setPropertyTypes] = useState<string[]>(params.propertyType ?? [])

  const togglePropertyType = (type: string) =>
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )

  const applyFilters = () => {
    setParams({
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice < 50000000 ? maxPrice : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      instantBook: instantBook || undefined,
      propertyType: propertyTypes.length > 0 ? (propertyTypes as unknown as never) : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-sm bg-card h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Filters</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors">
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>

        {/* Filter content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Property type */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Property type</h3>
            <div className="flex flex-wrap gap-2">
              {['apartment', 'house', 'villa', 'cabin', 'unique', 'hotel'].map((type) => (
                <button
                  key={type}
                  onClick={() => togglePropertyType(type)}
                  className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all capitalize ${
                    propertyTypes.includes(type)
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-card text-muted hover:border-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Price range */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Price range (per night)</h3>
            <p className="text-xs text-muted mb-3">
              {formatPrice(minPrice, 'INR')} – {maxPrice >= 50000000 ? 'Any' : formatPrice(maxPrice, 'INR')}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted">Min price</label>
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  step={100000}
                  value={minPrice}
                  onChange={(e) => setMinPrice(Math.min(parseInt(e.target.value), maxPrice))}
                  className="w-full accent-navy mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted">Max price</label>
                <input
                  type="range"
                  min={minPrice}
                  max={50000000}
                  step={500000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Math.max(parseInt(e.target.value), minPrice))}
                  className="w-full accent-navy mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Min rating */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Minimum rating</h3>
            <div className="flex gap-2">
              {[0, 4.0, 4.5, 4.7, 4.9].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    minRating === r
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-card text-muted hover:border-foreground'
                  }`}
                >
                  {r === 0 ? 'Any' : <><Star className="h-3 w-3" />{r}+</>}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Instant Book */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Instant Book</p>
              <p className="text-xs text-muted">Book without waiting for approval</p>
            </div>
            <button
              onClick={() => setInstantBook(!instantBook)}
              className={`relative h-6 w-11 rounded-full transition-colors ${instantBook ? 'bg-navy' : 'bg-border'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  instantBook ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setMinPrice(0)
              setMaxPrice(50000000)
              setMinRating(0)
              setInstantBook(false)
              setPropertyTypes([])
            }}
          >
            Reset
          </Button>
          <Button variant="gold" className="flex-1" onClick={applyFilters}>
            Show results
          </Button>
        </div>
      </div>
    </div>
  )
}
