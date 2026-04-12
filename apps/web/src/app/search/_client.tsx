'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SlidersHorizontal, X, Star } from 'lucide-react'
import { Button, Separator } from '@casalux/ui'
import { ListingCard, ListingCardSkeleton } from '@/components/listings/ListingCard'
import { QuickFilters } from '@/components/listings/QuickFilters'
import { apiRequest } from '@/lib/api-client'
import { buildQueryString, formatPrice } from '@/lib/utils'
import { useSearchStore } from '@/lib/store/search'
import type { Listing, ListingSearchParams } from '@casalux/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialListings: Listing[]
  initialTotal: number
  defaultParams: ListingSearchParams
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SearchInteractive({ initialListings, initialTotal, defaultParams }: Props) {
  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [activeParams, setActiveParams] = useState<ListingSearchParams>(defaultParams)
  const [filterOpen, setFilterOpen] = useState(false)

  const { setParams } = useSearchStore()

  // Sync URL-derived params into the store once on mount (for FilterDrawer defaults)
  useEffect(() => {
    setParams(defaultParams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasMore = listings.length < total

  // ─── Fetchers ──────────────────────────────────────────────────────────────

  const fetchFresh = useCallback(async (params: ListingSearchParams) => {
    setIsLoading(true)
    setPage(1)
    try {
      const qs = buildQueryString({ ...params, page: 1, limit: 20 })
      const res = await apiRequest<Listing[]>(`/listings${qs}`)
      setListings(res.success ? (res.data ?? []) : [])
      setTotal(res.meta?.total ?? 0)
    } catch {
      // Keep existing listings on network error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchMore = useCallback(async () => {
    if (isLoadingMore) return
    setIsLoadingMore(true)
    const nextPage = page + 1
    try {
      const qs = buildQueryString({ ...activeParams, page: nextPage, limit: 20 })
      const res = await apiRequest<Listing[]>(`/listings${qs}`)
      setListings((prev) => [...prev, ...(res.data ?? [])])
      setPage(nextPage)
    } finally {
      setIsLoadingMore(false)
    }
  }, [activeParams, isLoadingMore, page])

  // ─── Filter handlers ───────────────────────────────────────────────────────

  const applyFilters = useCallback((newFilters: Partial<ListingSearchParams>) => {
    const merged: ListingSearchParams = { ...activeParams, ...newFilters }
    setActiveParams(merged)
    setParams(newFilters)
    fetchFresh(merged)
  }, [activeParams, fetchFresh, setParams])

  const removeFilter = useCallback((key: keyof ListingSearchParams) => {
    const updated: ListingSearchParams = { ...activeParams, [key]: undefined }
    if (key === 'checkIn' || key === 'checkOut') {
      updated.checkIn = undefined
      updated.checkOut = undefined
    }
    setActiveParams(updated)
    setParams({ [key]: undefined })
    fetchFresh(updated)
  }, [activeParams, fetchFresh, setParams])

  const clearAll = useCallback(() => {
    const reset: ListingSearchParams = {}
    setActiveParams(reset)
    setParams(reset)
    fetchFresh(reset)
  }, [fetchFresh, setParams])

  const handleQuickFilter = useCallback((slug: string | null) => {
    const updated: ListingSearchParams = { ...activeParams, quickFilter: slug ?? undefined }
    setActiveParams(updated)
    fetchFresh(updated)
  }, [activeParams, fetchFresh])

  // ─── Active filter chips ───────────────────────────────────────────────────

  const chips: { key: keyof ListingSearchParams; label: string }[] = []
  if (activeParams.location) chips.push({ key: 'location', label: activeParams.location })
  if (activeParams.checkIn && activeParams.checkOut)
    chips.push({ key: 'checkIn', label: `${activeParams.checkIn} – ${activeParams.checkOut}` })
  if (activeParams.guests && activeParams.guests > 1)
    chips.push({ key: 'guests', label: `${activeParams.guests} guests` })
  if (activeParams.instantBook) chips.push({ key: 'instantBook', label: 'Instant Book' })
  if (activeParams.minRating) chips.push({ key: 'minRating', label: `★ ${activeParams.minRating}+` })

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">
            {activeParams.location ? `Stays in ${activeParams.location}` : 'All listings'}
          </h1>
          {!isLoading && (
            <p className="text-sm text-muted mt-0.5">
              {listings.length > 0 ? `${total}+ stays` : 'No results'}
            </p>
          )}
        </div>
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
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => removeFilter(chip.key)}
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
      )}

      {/* Quick filters */}
      <div className="py-3 mb-6 border-b border-border">
        <QuickFilters onFilterChange={handleQuickFilter} />
      </div>

      {/* Results grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
            {listings.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                priority={i < 4}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-10">
              <Button
                variant="outline"
                size="lg"
                onClick={fetchMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading…' : 'Show more listings'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Filter drawer */}
      {filterOpen && (
        <FilterDrawer
          defaultValues={activeParams}
          onClose={() => setFilterOpen(false)}
          onApply={(filters) => {
            setFilterOpen(false)
            applyFilters(filters)
          }}
        />
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <span className="text-5xl mb-4">🏡</span>
      <h3 className="font-display text-xl font-semibold text-foreground mb-2">
        No listings match your search
      </h3>
      <p className="text-sm text-muted max-w-xs">
        Try adjusting your dates, guests, or filters to find available properties.
      </p>
    </div>
  )
}

// ─── Filter drawer ────────────────────────────────────────────────────────────

interface FilterDrawerProps {
  defaultValues: ListingSearchParams
  onClose: () => void
  onApply: (filters: Partial<ListingSearchParams>) => void
}

function FilterDrawer({ defaultValues, onClose, onApply }: FilterDrawerProps) {
  const [minPrice, setMinPrice] = useState(defaultValues.minPrice ?? 0)
  const [maxPrice, setMaxPrice] = useState(defaultValues.maxPrice ?? 50_000_000)
  const [minRating, setMinRating] = useState(defaultValues.minRating ?? 0)
  const [instantBook, setInstantBook] = useState(defaultValues.instantBook ?? false)
  const [propertyTypes, setPropertyTypes] = useState<string[]>(
    defaultValues.propertyType ? (defaultValues.propertyType as string[]) : []
  )

  const toggleType = (type: string) =>
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )

  const handleApply = () => {
    onApply({
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice < 50_000_000 ? maxPrice : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      instantBook: instantBook || undefined,
      propertyType: propertyTypes.length > 0
        ? (propertyTypes as ListingSearchParams['propertyType'])
        : undefined,
    })
  }

  const handleReset = () => {
    setMinPrice(0)
    setMaxPrice(50_000_000)
    setMinRating(0)
    setInstantBook(false)
    setPropertyTypes([])
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
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Property type */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Property type</h3>
            <div className="flex flex-wrap gap-2">
              {['apartment', 'house', 'villa', 'cabin', 'unique', 'hotel'].map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
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
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Price range (per night)
            </h3>
            <p className="text-xs text-muted mb-3">
              {formatPrice(minPrice, 'INR')} –{' '}
              {maxPrice >= 50_000_000 ? 'Any' : formatPrice(maxPrice, 'INR')}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted">Min price</label>
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  step={100_000}
                  value={minPrice}
                  onChange={(e) =>
                    setMinPrice(Math.min(parseInt(e.target.value), maxPrice))
                  }
                  className="w-full accent-navy mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted">Max price</label>
                <input
                  type="range"
                  min={minPrice}
                  max={50_000_000}
                  step={500_000}
                  value={maxPrice}
                  onChange={(e) =>
                    setMaxPrice(Math.max(parseInt(e.target.value), minPrice))
                  }
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
                  {r === 0 ? (
                    'Any'
                  ) : (
                    <>
                      <Star className="h-3 w-3" />
                      {r}+
                    </>
                  )}
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
              className={`relative h-6 w-11 rounded-full transition-colors ${
                instantBook ? 'bg-navy' : 'bg-border'
              }`}
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
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="gold" className="flex-1" onClick={handleApply}>
            Show results
          </Button>
        </div>
      </div>
    </div>
  )
}
