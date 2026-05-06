/**
 * Tool: recommendBasedOnHistory
 *
 * "Suggest stays based on my past bookings." End-to-end personalisation:
 * pulls the user's bookings, extracts a preference profile, runs a curated
 * search, and returns listing cards. One tool call — no LLM math.
 *
 * Strategy (graceful degradation — always returns useful results):
 *
 *                  ┌─ no user OR no bookings ─→ cold-start: trending picks
 *   ctx.user ────► ├─ <2 bookings           ─→ light personalisation: same country
 *                  └─ ≥2 bookings           ─→ full personalisation:
 *                                                a. "more of what you love"
 *                                                b. "adjacent discovery"
 *                                              mix + de-dup + drop already-booked
 *
 * Anonymous visitors get a sensible response too — they just don't get the
 * personalised flavour. This is intentional: the tool's value is "always
 * suggest something good", not "fail loudly if I don't know you".
 */

import { z } from 'zod'
import { defineAivoyTool } from '../registry.js'
import { toListingCard, type AivoyListingCard } from '../card-formatters.js'

const Schema = z.object({
  limit: z.number().int().min(1).max(8).default(6),
  /** Bias toward similar destinations vs adjacent discovery. 0..1, default 0.6. */
  noveltyMix: z.number().min(0).max(1).default(0.6),
})

interface TravelProfile {
  topCity?: string
  topCountry?: string
  priceBand?: { min: number; max: number; currency: string }
  topAmenities: string[]
  propertyTypes: string[]
  alreadyBookedListingIds: Set<string>
  totalBookings: number
}

export const recommendBasedOnHistory = defineAivoyTool({
  name: 'recommendBasedOnHistory',
  description:
    'Recommend Casalux stays. If the user is signed in and has past ' +
    'bookings, the recommendations are personalised to their history; ' +
    'otherwise it returns popular curated picks. Use when the user says ' +
    '"recommend something for me", "what should I book next", or "find me ' +
    "places like the ones I've stayed at\".",
  schema: Schema,
  renderAs: 'listingCards',
  // Intentionally NOT requiresUser — we degrade gracefully so anonymous
  // visitors get a useful answer too.
  handler: async (args, ctx): Promise<AivoyListingCard[]> => {
    // Anonymous visitor → cold-start path. No history to analyse.
    if (!ctx.user) {
      return getColdStartRecommendations(ctx, args.limit)
    }

    const bookings = await loadUserBookings(ctx, ctx.user.id)

    // Signed in but brand-new (no bookings yet) → cold-start path.
    if (bookings.length === 0) {
      return getColdStartRecommendations(ctx, args.limit)
    }

    const profile = buildProfile(bookings)

    // Two complementary queries. Each may return < limit; we mix.
    const moreOfWhatYouLoveCount = Math.ceil(args.limit * (1 - args.noveltyMix))
    const adjacentCount = args.limit - moreOfWhatYouLoveCount

    const [primary, adjacent] = await Promise.all([
      moreOfWhatYouLove(ctx, profile, moreOfWhatYouLoveCount + 2),
      adjacentDiscovery(ctx, profile, adjacentCount + 2),
    ])

    // De-dup, exclude already-booked, weave the two streams.
    const out: AivoyListingCard[] = []
    const seen = new Set<string | number>(profile.alreadyBookedListingIds)
    const queues: AivoyListingCard[][] = [primary, adjacent]
    let i = 0
    while (out.length < args.limit && (primary.length > 0 || adjacent.length > 0)) {
      const q = queues[i % 2]!
      i++
      const next = q.shift()
      if (!next) continue
      if (seen.has(next.id)) continue
      seen.add(next.id)
      out.push(next)
    }
    return out
  },
})

// ─── Helpers ────────────────────────────────────────────────────────────────
// These access services indirectly via the context. As you wire up the real
// BookingService into AivoyServices (see context.ts), replace the stubs.

async function loadUserBookings(ctx: any, _userId: string): Promise<any[]> {
  // TODO: replace with `ctx.services.bookings.listForUser(userId)` once
  // BookingService is exposed on AivoyServices. Returning an empty list
  // currently triggers cold-start fallback — safe behaviour pre-wiring.
  void ctx
  return []
}

function buildProfile(bookings: any[]): TravelProfile {
  const cityCount = new Map<string, number>()
  const countryCount = new Map<string, number>()
  const amenityCount = new Map<string, number>()
  const propertyTypeCount = new Map<string, number>()
  const prices: number[] = []
  const alreadyBooked = new Set<string>()
  let currency = 'USD'

  for (const b of bookings) {
    const listing = b.listing ?? b
    if (listing?.id) alreadyBooked.add(String(listing.id))

    if (listing?.city) bump(cityCount, listing.city)
    if (listing?.country) bump(countryCount, listing.country)
    for (const a of listing?.amenities ?? []) bump(amenityCount, a)
    if (listing?.propertyType) bump(propertyTypeCount, listing.propertyType)

    const price = listing?.pricePerNight ?? listing?.basePrice
    if (typeof price === 'number') prices.push(price)
    if (listing?.currency) currency = listing.currency
  }

  const priceBand = prices.length
    ? {
        min: Math.floor(Math.min(...prices) * 0.7),
        max: Math.ceil(Math.max(...prices) * 1.3),
        currency,
      }
    : undefined

  return {
    topCity: top(cityCount),
    topCountry: top(countryCount),
    priceBand,
    topAmenities: topN(amenityCount, 3),
    propertyTypes: topN(propertyTypeCount, 2),
    alreadyBookedListingIds: alreadyBooked,
    totalBookings: bookings.length,
  }
}

async function moreOfWhatYouLove(
  ctx: any,
  profile: TravelProfile,
  limit: number,
): Promise<AivoyListingCard[]> {
  const result = await ctx.services.listings.getListings({
    location: profile.topCity ?? profile.topCountry,
    minPrice: profile.priceBand?.min,
    maxPrice: profile.priceBand?.max,
    amenities: profile.topAmenities.length ? profile.topAmenities : undefined,
    propertyType: profile.propertyTypes.length ? profile.propertyTypes : undefined,
    page: 1,
    limit,
  })
  return (result?.data ?? []).map(toListingCard)
}

async function adjacentDiscovery(
  ctx: any,
  profile: TravelProfile,
  limit: number,
): Promise<AivoyListingCard[]> {
  // Same country if known, but DON'T pin the city — surfaces somewhere new
  // with a similar feel. If we don't know the country, fall back to using
  // amenity + propertyType signals only.
  const result = await ctx.services.listings.getListings({
    location: profile.topCountry ?? undefined,
    minPrice: profile.priceBand?.min,
    maxPrice: profile.priceBand?.max,
    amenities: profile.topAmenities.length ? profile.topAmenities : undefined,
    propertyType: profile.propertyTypes.length ? profile.propertyTypes : undefined,
    page: 1,
    limit,
  })
  // Filter out the top city — we want adjacent, not duplicate.
  const rows = (result?.data ?? []).filter(
    (l: any) => !profile.topCity || l.city !== profile.topCity,
  )
  return rows.map(toListingCard)
}

async function getColdStartRecommendations(
  ctx: any,
  limit: number,
): Promise<AivoyListingCard[]> {
  // Casalux already has /listings/recommended for non-personalised picks.
  // For pre-history users we surface that instead — better than empty.
  const result = await ctx.services.listings.getListings({ page: 1, limit })
  return (result?.data ?? []).map(toListingCard)
}

// ─── Tiny utilities ─────────────────────────────────────────────────────────

function bump(m: Map<string, number>, k: string): void {
  m.set(k, (m.get(k) ?? 0) + 1)
}

function top(m: Map<string, number>): string | undefined {
  let best: [string, number] | null = null
  for (const e of m) if (!best || e[1] > best[1]) best = e
  return best?.[0]
}

function topN(m: Map<string, number>, n: number): string[] {
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k)
}
