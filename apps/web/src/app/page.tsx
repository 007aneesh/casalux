'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Search, Waves, TreePine, Building2, Sparkles } from 'lucide-react'
import { ListingCard, ListingCardSkeleton } from '@/components/listings/ListingCard'
import { SearchBar } from '@/components/layout/SearchBar'
import { useRecommended, useGeolocation } from '@/lib/hooks/useListings'

const CITY_DESTINATIONS = [
  { name: 'Goa', emoji: '🏖️', query: 'Goa' },
  { name: 'Manali', emoji: '🏔️', query: 'Manali' },
  { name: 'Udaipur', emoji: '🏰', query: 'Udaipur' },
  { name: 'Coorg', emoji: '🌿', query: 'Coorg' },
  { name: 'Rishikesh', emoji: '🌊', query: 'Rishikesh' },
  { name: 'Jaipur', emoji: '🕌', query: 'Jaipur' },
]

interface RailProps {
  title: string
  icon: React.ReactNode
  type?: string
  lat?: number
  lng?: number
  limit?: number
  enabled?: boolean
  viewAllHref: string
}

function ListingRail({ title, icon, type, lat, lng, limit = 8, enabled = true, viewAllHref }: RailProps) {
  const { listings, isLoading } = useRecommended(
    { type, lat, lng, limit },
    enabled
  )

  // Don't render the rail at all if not loading and no results
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
                <ListingCard listing={listing} priority={idx < 2} />
              </div>
            ))}
      </div>
    </section>
  )
}

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

export default function HomePage() {
  const router = useRouter()
  const { status, coords, request } = useGeolocation()

  // Auto-request on mount only if permission was already granted (no prompt)
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') request()
    })
  }, [request])

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-navy overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80')" }}
        />
        <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-tight max-w-2xl">
            Find your perfect<br />luxury escape
          </h1>
          <p className="text-white/70 text-lg mt-4 mb-8 max-w-md">
            Handpicked villas, cabins, and boutique stays curated for discerning travellers.
          </p>
          <div className="w-full max-w-2xl">
            <SearchBar />
          </div>
          <div className="mt-6">
            <Link
              href="/become-a-host"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/25 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Become a host — start earning
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">

        {/* City destinations */}
        <section className="py-10">
          <h2 className="font-display text-xl font-semibold text-foreground mb-5">Explore by destination</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 scrollbar-hide">
            {CITY_DESTINATIONS.map((city) => (
              <button
                key={city.name}
                onClick={() => router.push(`/search?location=${encodeURIComponent(city.query)}`)}
                className="shrink-0 flex flex-col items-center gap-2 rounded-2xl border border-border bg-card hover:border-navy hover:shadow-md transition-all px-5 py-4 min-w-[90px]"
              >
                <span className="text-2xl">{city.emoji}</span>
                <span className="text-sm font-medium text-foreground">{city.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Near you — location-based rail */}
        {status === 'idle' && (
          <NearYouBanner onAllow={request} />
        )}
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

        {/* Trending (no type, no location — top-rated globally) */}
        <ListingRail
          title="Trending right now"
          icon={<Sparkles className="h-5 w-5 text-gold" />}
          limit={8}
          viewAllHref="/search"
        />

        {/* Villas */}
        <ListingRail
          title="Luxury villas"
          icon={<Building2 className="h-5 w-5 text-gold" />}
          type="villa"
          limit={8}
          viewAllHref="/search?type=villa"
        />

        {/* Beachfront */}
        <ListingRail
          title="Beachfront escapes"
          icon={<Waves className="h-5 w-5 text-gold" />}
          type="beachfront"
          limit={8}
          viewAllHref="/search?quickFilter=beachfront"
        />

        {/* Cabins */}
        <ListingRail
          title="Mountain & forest hideaways"
          icon={<TreePine className="h-5 w-5 text-gold" />}
          type="cabin"
          limit={8}
          viewAllHref="/search?type=cabin"
        />

        {/* Browse all CTA */}
        <section className="py-12 flex flex-col items-center text-center gap-4 border-t border-border">
          <h2 className="font-display text-2xl font-semibold text-foreground">Ready to explore?</h2>
          <p className="text-muted text-sm max-w-sm">
            Browse hundreds of curated luxury properties across India and beyond.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-navy text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-navy/90 transition-colors"
          >
            <Search className="h-4 w-4" />
            Browse all listings
          </Link>
        </section>

      </div>
    </div>
  )
}
