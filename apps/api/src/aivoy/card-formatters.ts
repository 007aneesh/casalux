/**
 * Domain model → aivoy card schema converters.
 *
 * Keep card formatters dumb: they should be pure functions that map fields,
 * never call services or DB. If you need to compute something extra (e.g.
 * "remaining nights"), do it in the tool handler and pass the result in.
 *
 * The card schemas are documented at:
 *   https://aivoy.dev/docs#cards
 */

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://casalux.com'

// ─── listingCards ───────────────────────────────────────────────────────────
// Renders a vertical stack of property tiles (image · title · meta · price · badges).

export interface AivoyListingCard {
  id: string | number
  title: string
  subtitle?: string
  imageUrl?: string
  price?: { amount: number; currency: string; per?: string }
  rating?: number
  href?: string
  badges?: string[]
}

/**
 * Coerces a Casalux listing (whatever shape — ES doc, DB row, or API
 * response) into a listingCard. Defensive about missing fields because the
 * input shape varies between the search index, repo, and shaped responses.
 */
export function toListingCard(listing: any): AivoyListingCard {
  const id = listing?.id ?? listing?._id ?? ''
  const title =
    listing?.title ?? listing?.name ?? listing?.headline ?? 'Untitled stay'
  const cityCountry =
    [listing?.city, listing?.country].filter(Boolean).join(', ') || undefined
  const guests = listing?.maxGuests ?? listing?.guests
  const subtitle = [
    cityCountry,
    guests ? `${guests} guests` : null,
    listing?.bedrooms ? `${listing.bedrooms} BR` : null,
  ]
    .filter(Boolean)
    .join(' • ') || undefined

  const priceAmount =
    listing?.pricePerNight ??
    listing?.price?.amount ??
    listing?.basePrice ??
    null
  const currency = listing?.currency ?? listing?.price?.currency ?? 'USD'

  const slug = listing?.slug ?? listing?.id
  return {
    id,
    title,
    subtitle,
    imageUrl: pickImageUrl(listing),
    price:
      priceAmount != null
        ? { amount: Number(priceAmount), currency, per: 'night' }
        : undefined,
    rating: listing?.avgRating ?? listing?.rating ?? undefined,
    badges: buildBadges(listing),
    href: slug ? `${APP_URL}/listings/${slug}` : undefined,
  }
}

function pickImageUrl(listing: any): string | undefined {
  const cover = listing?.coverPhotoUrl
  if (typeof cover === 'string' && cover.length > 0) return cover

  const first = listing?.images?.[0]
  if (typeof first === 'string' && first.length > 0) return first
  if (first && typeof first === 'object' && typeof first.url === 'string') {
    return first.url
  }
  return undefined
}

function buildBadges(listing: any): string[] | undefined {
  const out: string[] = []
  if (listing?.isSuperhost || listing?.host?.isSuperhost) out.push('Superhost')
  if (listing?.instantBook) out.push('Instant book')
  if (listing?.cancellationPolicy === 'flexible') out.push('Free cancel')
  return out.length > 0 ? out : undefined
}
