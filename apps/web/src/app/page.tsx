/**
 * Homepage — Server Component.
 *
 * The hero, navigation and CTA render as plain SSR HTML so the browser
 * paints meaningful content immediately (fast FCP/LCP).
 *
 * The listing rails (SWR + geolocation) are isolated in <HomeListingRails>,
 * a client-only island that loads after hydration without blocking the paint.
 */

import Link from 'next/link'
import Image from 'next/image'
import { Search, Building2 } from 'lucide-react'
import { SearchBar } from '@/components/layout/SearchBar'
import { HomeListingRails } from '@/components/home/HomeListingRails'

const CITY_DESTINATIONS = [
  { name: 'Goa',       emoji: '🏖️', query: 'Goa'       },
  { name: 'Manali',    emoji: '🏔️', query: 'Manali'    },
  { name: 'Udaipur',   emoji: '🏰', query: 'Udaipur'   },
  { name: 'Coorg',     emoji: '🌿', query: 'Coorg'     },
  { name: 'Rishikesh', emoji: '🌊', query: 'Rishikesh' },
  { name: 'Jaipur',    emoji: '🕌', query: 'Jaipur'    },
]

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {/*
       * next/image with priority=true injects a <link rel="preload"> in <head>
       * so the browser fetches the hero image in parallel with CSS/JS — the
       * single biggest LCP win on this page.
       */}
      <section className="relative z-10 bg-navy overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80"
          alt=""
          fill
          priority
          className="object-cover opacity-30"
          sizes="100vw"
          quality={75}
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

      <div className="relative z-0 mx-auto max-w-screen-xl px-4 sm:px-6">

        {/* ── City destinations (SSR — no JS needed) ────────────────────── */}
        <section className="py-10">
          <h2 className="font-display text-xl font-semibold text-foreground mb-5">
            Explore by destination
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 scrollbar-hide">
            {CITY_DESTINATIONS.map((city) => (
              <Link
                key={city.name}
                href={`/search?location=${encodeURIComponent(city.query)}`}
                className="shrink-0 flex flex-col items-center gap-2 rounded-2xl border border-border bg-card hover:border-navy hover:shadow-md transition-all px-5 py-4 min-w-[90px]"
              >
                <span className="text-2xl">{city.emoji}</span>
                <span className="text-sm font-medium text-foreground">{city.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Listing rails — client island (SWR + geolocation) ──────────── */}
        <HomeListingRails />

        {/* ── Browse all CTA (SSR) ───────────────────────────────────────── */}
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
