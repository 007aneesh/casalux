'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { CalendarDays, Users, Zap, ChevronDown } from 'lucide-react'
import { format, differenceInCalendarDays, parseISO } from 'date-fns'
import { Button, Separator } from '@casalux/ui'
import { AvailabilityCalendar } from './AvailabilityCalendar'
import { PriceBreakdown } from './PriceBreakdown'
import { usePricingPreview } from '@/lib/hooks/useListings'
import { formatPrice, pluralize } from '@/lib/utils'
import type { Listing } from '@casalux/types'

interface BookingWidgetProps {
  listing: Listing
}

export function BookingWidget({ listing }: BookingWidgetProps) {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [guests, setGuests] = useState(1)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showGuests, setShowGuests] = useState(false)
  const [promoCode, setPromoCode] = useState('')

  const nights =
    checkIn && checkOut
      ? differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn))
      : 0

  const { pricing, isLoading: pricingLoading } = usePricingPreview(
    listing.id,
    { checkIn: checkIn ?? undefined, checkOut: checkOut ?? undefined, guests }
  )

  const handleRangeChange = useCallback((ci: string | null, co: string | null) => {
    setCheckIn(ci)
    setCheckOut(co)
    if (ci && co) setShowCalendar(false)
  }, [])

  const handleReserve = () => {
    if (!isSignedIn) {
      // Clerk modal will handle sign-in redirect
      router.push(`/listings/${listing.id}/book?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)
      return
    }
    router.push(`/listings/${listing.id}/book?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)
  }

  const canReserve = !!checkIn && !!checkOut && nights >= listing.minNights

  const displayCheckIn = checkIn ? format(parseISO(checkIn), 'MMM d') : null
  const displayCheckOut = checkOut ? format(parseISO(checkOut), 'MMM d') : null

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card-hover p-6 space-y-5 sticky top-24">
      {/* Price header */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-bold text-foreground">
            {formatPrice(listing.basePrice, listing.currency)}
          </span>
          <span className="text-muted text-sm"> / night</span>
        </div>
        {listing.totalReviews > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <span>★</span>
            <span className="font-medium">{listing.avgRating.toFixed(2)}</span>
            <span className="text-muted">({listing.totalReviews})</span>
          </div>
        )}
      </div>

      {/* Date + Guest selectors */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Dates */}
        <button
          onClick={() => { setShowCalendar(!showCalendar); setShowGuests(false) }}
          className="w-full flex items-stretch"
        >
          <div className="flex-1 flex flex-col items-start px-4 py-3 border-r border-border hover:bg-surface transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Check-in</span>
            <span className={`text-sm mt-0.5 ${displayCheckIn ? 'text-foreground font-medium' : 'text-muted'}`}>
              {displayCheckIn ?? 'Add date'}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-start px-4 py-3 hover:bg-surface transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Check-out</span>
            <span className={`text-sm mt-0.5 ${displayCheckOut ? 'text-foreground font-medium' : 'text-muted'}`}>
              {displayCheckOut ?? 'Add date'}
            </span>
          </div>
        </button>

        <Separator />

        {/* Guests */}
        <button
          onClick={() => { setShowGuests(!showGuests); setShowCalendar(false) }}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors"
        >
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Guests</span>
            <span className="text-sm font-medium text-foreground mt-0.5">
              {guests} {pluralize(guests, 'guest')}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted transition-transform ${showGuests ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Calendar dropdown */}
      {showCalendar && (
        <div className="overflow-x-auto">
          <AvailabilityCalendar
            listingId={listing.id}
            minNights={listing.minNights}
            onRangeChange={handleRangeChange}
            inline
          />
          {listing.minNights > 1 && (
            <p className="text-xs text-muted mt-2 text-center">
              Minimum stay: {listing.minNights} nights
            </p>
          )}
        </div>
      )}

      {/* Guest counter dropdown */}
      {showGuests && (
        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3 bg-surface">
          <div>
            <p className="text-sm font-medium text-foreground">Guests</p>
            <p className="text-xs text-muted">Max {listing.maxGuests}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGuests(g => Math.max(1, g - 1))}
              disabled={guests <= 1}
              className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-lg hover:border-foreground transition-colors disabled:opacity-30"
            >−</button>
            <span className="w-6 text-center font-semibold text-sm">{guests}</span>
            <button
              onClick={() => setGuests(g => Math.min(listing.maxGuests, g + 1))}
              disabled={guests >= listing.maxGuests}
              className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-lg hover:border-foreground transition-colors disabled:opacity-30"
            >+</button>
          </div>
        </div>
      )}

      {/* Pricing breakdown */}
      {(checkIn && checkOut && nights >= listing.minNights) && (
        <PriceBreakdown pricing={pricing} isLoading={pricingLoading} currency={listing.currency} />
      )}

      {/* Min nights warning */}
      {checkIn && checkOut && nights > 0 && nights < listing.minNights && (
        <p className="text-xs text-red-500 text-center">
          Minimum stay is {listing.minNights} {pluralize(listing.minNights, 'night')}
        </p>
      )}

      {/* CTA */}
      <Button
        variant="gold"
        size="lg"
        className="w-full font-semibold"
        disabled={!canReserve}
        onClick={handleReserve}
      >
        {listing.instantBook ? (
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Reserve — Instant Book
          </span>
        ) : (
          'Request to Book'
        )}
      </Button>

      <p className="text-xs text-muted text-center">
        {listing.instantBook ? "You won't be charged yet" : 'Host will respond within 24 hours'}
      </p>
    </div>
  )
}
