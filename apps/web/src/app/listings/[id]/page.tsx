import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Star, Users, BedDouble, Bath, DoorOpen,
  Shield, Clock, CalendarX, CheckCircle,
} from 'lucide-react'
import { Badge, Separator } from '@casalux/ui'
import { ImageGallery } from '@/components/listings/ImageGallery'
import { AmenityGrid } from '@/components/listings/AmenityGrid'
import { ReviewsSection } from '@/components/listings/ReviewsSection'
import { BookingWidget } from '@/components/booking/BookingWidget'
import { ExpandableText } from '@/components/listings/ExpandableText'
import { apiRequest } from '@/lib/api-client'
import { formatPrice, pluralize } from '@/lib/utils'
import type { Listing } from '@casalux/types'

interface PageProps {
  params: { id: string }
}

async function getListing(id: string): Promise<Listing | null> {
  try {
    const res = await apiRequest<Listing>(`/listings/${id}`, {
      next: { revalidate: 600 },
    })
    return res.success ? res.data : null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps) {
  const listing = await getListing(params.id)
  if (!listing) return {}
  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 160),
      images: listing.images[0] ? [{ url: listing.images[0].url }] : [],
    },
  }
}

const POLICY_LABELS: Record<string, string> = {
  flexible: 'Flexible — Full refund if cancelled 24h before check-in',
  moderate: 'Moderate — Full refund up to 5 days before check-in',
  strict: 'Strict — 50% refund up to 1 week before check-in',
  super_strict: 'Super Strict — No refund after 48h of booking',
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartment',
  house: 'House',
  villa: 'Villa',
  cabin: 'Cabin',
  unique: 'Unique stay',
  hotel: 'Boutique hotel',
}

export default async function ListingDetailPage({ params }: PageProps) {
  const listing = await getListing(params.id)
  if (!listing) notFound()

  const addr = listing.address as { city?: string; state?: string; country?: string } | null
  const city    = addr?.city    ?? ''
  const state   = addr?.state   ?? ''
  const country = addr?.country ?? ''

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-4">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        {city && (
          <>
            <span>/</span>
            <Link
              href={`/search?location=${encodeURIComponent(city)}`}
              className="hover:text-foreground transition-colors"
            >
              {city}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground line-clamp-1">{listing.title}</span>
      </nav>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground leading-snug">
            {listing.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {listing.totalReviews > 0 && (
              <div className="flex items-center gap-1 text-sm font-medium">
                <Star className="h-4 w-4 fill-foreground text-foreground" />
                <span>{listing.avgRating.toFixed(2)}</span>
                <span className="text-muted font-normal">
                  ({listing.totalReviews} {pluralize(listing.totalReviews, 'review')})
                </span>
              </div>
            )}
            <span className="text-muted">·</span>
            <div className="flex items-center gap-1 text-sm text-muted">
              <MapPin className="h-3.5 w-3.5" />
              {[city, state, country].filter(Boolean).join(', ')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {listing.instantBook && <Badge variant="gold">⚡ Instant Book</Badge>}
          {listing.avgRating >= 4.9 && listing.totalReviews >= 10 && (
            <Badge variant="default">Guest favourite</Badge>
          )}
        </div>
      </div>

      {/* Image gallery */}
      <ImageGallery images={listing.images} title={listing.title} />

      {/* Content + sidebar */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 xl:gap-16">
        {/* Left */}
        <div className="space-y-8 min-w-0">
          {/* Property host header */}
          <div className="flex items-center justify-between pb-6 border-b border-border">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                {PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType}
              </h2>
              <p className="text-sm text-muted mt-0.5">{city}</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-navy flex items-center justify-center text-white font-display text-2xl font-semibold shrink-0">
              {((listing as any).host?.firstName?.[0] ?? 'H').toUpperCase()}
            </div>
          </div>

          {/* Quick specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SpecBadge icon={<Users className="h-4 w-4" />} label={`${listing.maxGuests} ${pluralize(listing.maxGuests, 'guest')}`} />
            <SpecBadge icon={<BedDouble className="h-4 w-4" />} label={`${listing.bedrooms} ${pluralize(listing.bedrooms, 'bedroom')}`} />
            <SpecBadge icon={<DoorOpen className="h-4 w-4" />} label={`${listing.beds} ${pluralize(listing.beds, 'bed')}`} />
            <SpecBadge icon={<Bath className="h-4 w-4" />} label={`${listing.baths} ${pluralize(listing.baths, 'bath')}`} />
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listing.instantBook && (
              <HighlightCard
                icon={<CheckCircle className="h-5 w-5 text-gold" />}
                title="Instant Book"
                description="Book without waiting for host approval"
              />
            )}
            <HighlightCard
              icon={<Clock className="h-5 w-5 text-gold" />}
              title={`Check-in: ${listing.checkInTime}`}
              description={`Check-out by ${listing.checkOutTime}`}
            />
            {listing.minNights > 1 && (
              <HighlightCard
                icon={<CalendarX className="h-5 w-5 text-gold" />}
                title={`${listing.minNights}-night minimum`}
                description={listing.maxNights ? `Up to ${listing.maxNights} nights` : 'No maximum stay'}
              />
            )}
            <HighlightCard
              icon={<Shield className="h-5 w-5 text-gold" />}
              title="CasaLux protection"
              description="Every booking includes host guarantee"
            />
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">About this place</h2>
            <ExpandableText text={listing.description} />
          </div>

          <Separator />

          {/* Amenities */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">What this place offers</h2>
            <AmenityGrid amenities={listing.amenities} />
          </div>

          <Separator />

          {/* Reviews */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-6">Reviews</h2>
            <ReviewsSection
              listingId={listing.id}
              avgRating={listing.avgRating}
              totalReviews={listing.totalReviews}
            />
          </div>

          <Separator />

          {/* Location placeholder */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">Location</h2>
            <p className="text-sm text-muted mb-4">
              {[city, state, country].filter(Boolean).join(', ')}
            </p>
            <div className="h-64 rounded-2xl bg-surface flex items-center justify-center border border-border">
              <div className="text-center text-muted text-sm">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>Exact location shown after booking</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cancellation policy */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">Cancellation policy</h2>
            <p className="text-sm text-muted">
              {POLICY_LABELS[listing.cancellationPolicy] ?? listing.cancellationPolicy}
            </p>
          </div>
        </div>

        {/* Right — Booking widget */}
        <div className="hidden lg:block">
          <BookingWidget listing={listing} />
        </div>
      </div>

      {/* Mobile sticky booking bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex items-center justify-between z-40 shadow-search">
        <div>
          <p className="font-semibold text-foreground">
            {formatPrice(listing.basePrice, listing.currency)}
            <span className="font-normal text-muted text-sm"> / night</span>
          </p>
          {listing.totalReviews > 0 && (
            <p className="text-xs text-muted">★ {listing.avgRating.toFixed(2)} · {listing.totalReviews} reviews</p>
          )}
        </div>
        <Link
          href={`/listings/${listing.id}/book`}
          className="bg-navy text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-navy-800 transition-colors"
        >
          {listing.instantBook ? '⚡ Reserve' : 'Request'}
        </Link>
      </div>
    </div>
  )
}

function SpecBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5">
      <span className="text-muted">{icon}</span>
      <span className="text-sm text-foreground font-medium">{label}</span>
    </div>
  )
}

function HighlightCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-surface">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
    </div>
  )
}
