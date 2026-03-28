'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { X, ChevronDown, Zap } from 'lucide-react'
import { format, differenceInCalendarDays, parseISO } from 'date-fns'
import { AvailabilityCalendar } from './AvailabilityCalendar'
import { PriceBreakdown } from './PriceBreakdown'
import { usePricingPreview } from '@/lib/hooks/useListings'
import { formatPrice, pluralize } from '@/lib/utils'
import type { Listing } from '@casalux/types'

interface MobileBookingBarProps {
  listing: Listing
}

export function MobileBookingBar({ listing }: MobileBookingBarProps) {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [guests, setGuests] = useState(1)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showGuests, setShowGuests] = useState(false)

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

  const canReserve = !!checkIn && !!checkOut && nights >= listing.minNights

  const displayCheckIn  = checkIn  ? format(parseISO(checkIn),  'MMM d') : null
  const displayCheckOut = checkOut ? format(parseISO(checkOut), 'MMM d') : null

  const handleReserve = () => {
    router.push(`/listings/${listing.id}/book?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)
  }

  return (
    <>
      {/* Sticky bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex items-center justify-between z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div>
          <p className="font-semibold text-foreground text-sm">
            {formatPrice(listing.basePrice, listing.currency)}
            <span className="font-normal text-muted"> / night</span>
          </p>
          {checkIn && checkOut && nights > 0 ? (
            <p className="text-xs text-muted">{displayCheckIn} – {displayCheckOut} · {guests} {pluralize(guests, 'guest')}</p>
          ) : listing.totalReviews > 0 ? (
            <p className="text-xs text-muted">★ {listing.avgRating.toFixed(2)} · {listing.totalReviews} {pluralize(listing.totalReviews, 'review')}</p>
          ) : null}
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="bg-navy text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-navy/90 active:scale-95 transition-all"
        >
          {listing.instantBook ? '⚡ Reserve' : 'Check availability'}
        </button>
      </div>

      {/* Bottom sheet */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSheetOpen(false)} />

          {/* Sheet */}
          <div className="relative bg-card rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Handle + header */}
            <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-border">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-foreground">
                    {formatPrice(listing.basePrice, listing.currency)}
                  </span>
                  <span className="text-muted text-sm"> / night</span>
                </div>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
                >
                  <X className="h-4 w-4 text-muted" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Date selector */}
              <div className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => { setShowCalendar(!showCalendar); setShowGuests(false) }}
                  className="w-full flex items-stretch"
                >
                  <div className="flex-1 flex flex-col items-start px-4 py-3 border-r border-border hover:bg-surface transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Check-in</span>
                    <span className={`text-sm mt-0.5 font-medium ${displayCheckIn ? 'text-foreground' : 'text-muted'}`}>
                      {displayCheckIn ?? 'Add date'}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-start px-4 py-3 hover:bg-surface transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Check-out</span>
                    <span className={`text-sm mt-0.5 font-medium ${displayCheckOut ? 'text-foreground' : 'text-muted'}`}>
                      {displayCheckOut ?? 'Add date'}
                    </span>
                  </div>
                </button>

                <div className="border-t border-border" />

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

              {/* Calendar */}
              {showCalendar && (
                <div className="overflow-x-auto -mx-1">
                  <AvailabilityCalendar
                    listingId={listing.id}
                    minNights={listing.minNights}
                    onRangeChange={handleRangeChange}
                    inline
                  />
                  {listing.minNights > 1 && (
                    <p className="text-xs text-muted text-center mt-2">
                      Minimum stay: {listing.minNights} nights
                    </p>
                  )}
                </div>
              )}

              {/* Guest counter */}
              {showGuests && (
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3 bg-surface">
                  <div>
                    <p className="text-sm font-medium text-foreground">Guests</p>
                    <p className="text-xs text-muted">Max {listing.maxGuests}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      disabled={guests <= 1}
                      className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-lg hover:border-foreground transition-colors disabled:opacity-30"
                    >−</button>
                    <span className="w-6 text-center font-semibold text-sm">{guests}</span>
                    <button
                      onClick={() => setGuests((g) => Math.min(listing.maxGuests, g + 1))}
                      disabled={guests >= listing.maxGuests}
                      className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-lg hover:border-foreground transition-colors disabled:opacity-30"
                    >+</button>
                  </div>
                </div>
              )}

              {/* Pricing breakdown */}
              {checkIn && checkOut && nights >= listing.minNights && (
                <PriceBreakdown pricing={pricing} isLoading={pricingLoading} currency={listing.currency} />
              )}

              {/* Min nights warning */}
              {checkIn && checkOut && nights > 0 && nights < listing.minNights && (
                <p className="text-xs text-red-500 text-center">
                  Minimum stay is {listing.minNights} {pluralize(listing.minNights, 'night')}
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-border">
              <button
                disabled={!canReserve}
                onClick={handleReserve}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gold text-white hover:bg-gold/90 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {listing.instantBook && <Zap className="h-4 w-4" />}
                {canReserve
                  ? listing.instantBook ? 'Reserve — Instant Book' : 'Request to Book'
                  : 'Select dates to continue'}
              </button>
              {canReserve && (
                <p className="text-xs text-muted text-center mt-2">
                  {listing.instantBook ? "You won't be charged yet" : 'Host will respond within 24 hours'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
