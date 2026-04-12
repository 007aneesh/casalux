'use client'

/**
 * HomeListingRails — client island for the homepage.
 *
 * Isolated here so the parent page.tsx can be a pure Server Component,
 * giving the hero + city destinations instant SSR HTML and fast FCP.
 * All SWR fetches and geolocation live here.
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Waves, TreePine, Building2, Sparkles } from 'lucide-react'
import { ListingCard, ListingCardSkeleton } from '@/components/listings/ListingCard'
import { useRecommended, useGeolocation } from '@/lib/hooks/useListings'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RailProps {
  title:      string
  icon:       React.ReactNode
  type?:      string
  lat?:       number
  lng?:       number
  limit?:     number
  enabled?:   boolean
  viewAllHref: string
  /** Pass true only on the first visible rail so card images get preloaded */
  firstRail?: boolean
}

// ── ListingRail ───────────────────────────────────────────────────────────────

function ListingRail({ title, icon, type, lat, lng, limit = 8, enabled = true, viewAllHref, firstRail = false }: RailProps) {
  const { listings, isLoading } = useRecommended({ type, lat, lng, limit }, enabled)

  if (!isLoading && listings.length === 0) return null

  return (
    <section className="py-8 border-t border-border first:border-t-0">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <Link href={viewAllHref} className="text-sm font-medium text-navy hover:underline shrink-0">
          View all
        </Link>
      </div>
      <div className="flex gap-5 overflow-x-auto pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 scrollbar-hide snap-x snap-mandatory">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[280px] sm:w-[300px] snap-start">
                <ListingCardSkeleton />
              </div>
            ))
          : listings.map((listing, idx) => (
              <div key={listing.id} className="shrink-0 w-[280px] sm:w-[300px] snap-start">
                <ListingCard
                  listing={listing}
                  priority={firstRail && idx < 2}
                  sizes="300px"
                />
              </div>
            ))}
      </div>
    </section>
  )
}

// ── NearYouBanner ─────────────────────────────────────────────────────────────

function NearYouBanner({ onAllow }: { onAllow: () => void }) {
  return (
    <section className="py-8 border-t border-border">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4">
        <div className="h-10 w-10 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
          <MapPin className="h-5 w-5 text-navy" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Stays near you</p>
          <p className="text-xs text-muted mt-0.5">Allow location to discover luxury properties within 50 km</p>
        </div>
        <button
          onClick={onAllow}
          className="shrink-0 bg-navy text-white text-xs font-semibold rounded-xl px-4 py-2 hover:bg-navy/90 transition-colors"
        >
          Allow
        </button>
      </div>
    </section>
  )
}

// ── HomeListingRails (exported) ───────────────────────────────────────────────

export function HomeListingRails() {
  const { status, coords, request } = useGeolocation()

  // Auto-request only if permission was already granted (no browser prompt)
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') request()
    })
  }, [request])

  return (
    <>
      {/* Near you */}
      {status === 'idle' && <NearYouBanner onAllow={request} />}
      {status === 'loading' && (
        <section className="py-8 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted">
            <div className="h-4 w-4 rounded-full border-2 border-navy border-t-transparent animate-spin" />
            Finding stays near you…
          </div>
        </section>
      )}
      {status === 'granted' && coords && (
        <ListingRail
          title="Stays near you"
          icon={<MapPin className="h-5 w-5 text-gold" />}
          lat={coords.lat}
          lng={coords.lng}
          limit={8}
          viewAllHref={`/search?lat=${coords.lat}&lng=${coords.lng}`}
        />
      )}

      <ListingRail
        title="Trending right now"
        icon={<Sparkles className="h-5 w-5 text-gold" />}
        limit={8}
        viewAllHref="/search"
        firstRail
      />

      <ListingRail
        title="Luxury villas"
        icon={<Building2 className="h-5 w-5 text-gold" />}
        type="villa"
        limit={8}
        viewAllHref="/search?type=villa"
      />

      <ListingRail
        title="Beachfront escapes"
        icon={<Waves className="h-5 w-5 text-gold" />}
        type="beachfront"
        limit={8}
        viewAllHref="/search?quickFilter=beachfront"
      />

      <ListingRail
        title="Mountain & forest hideaways"
        icon={<TreePine className="h-5 w-5 text-gold" />}
        type="cabin"
        limit={8}
        viewAllHref="/search?type=cabin"
      />
    </>
  )
}
