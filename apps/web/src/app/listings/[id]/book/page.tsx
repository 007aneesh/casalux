'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, Shield, Zap } from 'lucide-react'
import { format, differenceInCalendarDays, parseISO } from 'date-fns'
import { Button, Separator } from '@casalux/ui'
import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { useListing, usePricingPreview } from '@/lib/hooks/useListings'
import { useAuthedRequest } from '@/lib/hooks/useAuthedRequest'
import { formatPrice, pluralize } from '@/lib/utils'
import Image from 'next/image'
import type { InitiateBookingResponse } from '@casalux/types'

interface PageProps {
  params: { id: string }
}

export default function BookingCheckoutPage({ params }: PageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSignedIn, isLoaded } = useAuth()
  const authedRequest = useAuthedRequest()

  const checkIn = searchParams.get('checkIn') ?? ''
  const checkOut = searchParams.get('checkOut') ?? ''
  const guests = parseInt(searchParams.get('guests') ?? '1', 10)

  const { listing, isLoading: listingLoading } = useListing(params.id)
  const { pricing, isLoading: pricingLoading } = usePricingPreview(
    params.id,
    { checkIn, checkOut, guests }
  )

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace(`/listings/${params.id}`)
    }
  }, [isLoaded, isSignedIn, router, params.id])

  const [agreedToRules, setAgreedToRules] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nights = checkIn && checkOut
    ? differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn))
    : 0

  const handleBook = async () => {
    if (!agreedToRules || !listing) return
    setIsSubmitting(true)
    setError(null)

    try {
      if (listing.instantBook) {
        const res = await authedRequest<InitiateBookingResponse>('/bookings/initiate', {
          method: 'POST',
          body: JSON.stringify({
            listingId: params.id,
            checkIn,
            checkOut,
            guests,
            promoCode: promoCode || undefined,
            agreedToHouseRules: true,
          }),
        })

        if (!res.success) {
          setError((res as unknown as { error: { message: string } }).error?.message ?? 'Booking failed. Please try again.')
          return
        }

        if ((res.data.providerPayload as Record<string, unknown>).checkoutUrl) {
          window.location.href = String((res.data.providerPayload as Record<string, unknown>).checkoutUrl)
        } else {
          router.push(`/bookings/${res.data.bookingId}/confirmation`)
        }
      } else {
        const res = await authedRequest<{ id: string }>('/booking-requests', {
          method: 'POST',
          body: JSON.stringify({
            listingId: params.id,
            checkIn,
            checkOut,
            guests,
          }),
        })

        if (!res.success) {
          setError((res as unknown as { error: { message: string } }).error?.message ?? 'Request failed. Please try again.')
          return
        }

        router.push(`/bookings?requested=true`)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoaded || listingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!listing) return null

  const primaryImage = listing.images.sort((a, b) => a.order - b.order)[0]

  return (
    <div className="mx-auto max-w-screen-md px-4 sm:px-6 py-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to listing
      </button>

      <h1 className="font-display text-2xl font-semibold text-foreground mb-8">
        {listing.instantBook ? '⚡ Confirm your booking' : 'Request to Book'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-8">
        {/* Left */}
        <div className="space-y-6">
          {/* Trip details */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-4">Your trip</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Dates</span>
                <span className="font-medium text-foreground">
                  {checkIn && checkOut
                    ? `${format(parseISO(checkIn), 'MMM d')} – ${format(parseISO(checkOut), 'MMM d, yyyy')}`
                    : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Duration</span>
                <span className="font-medium text-foreground">
                  {nights} {pluralize(nights, 'night')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Guests</span>
                <span className="font-medium text-foreground">
                  {guests} {pluralize(guests, 'guest')}
                </span>
              </div>
            </div>
          </section>

          <Separator />

          {/* Promo code */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">Promo code</h2>
            <div className="flex gap-2">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="flex-1 h-10 rounded-xl border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold"
              />
              <Button variant="outline" size="default">Apply</Button>
            </div>
          </section>

          <Separator />

          {/* House rules */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">House rules</h2>
            <div className="rounded-xl bg-surface border border-border p-4 space-y-2 text-sm text-muted mb-4">
              <p>Check-in: after {listing.checkInTime}</p>
              <p>Check-out: before {listing.checkOutTime}</p>
              <p>Max {listing.maxGuests} {pluralize(listing.maxGuests, 'guest')}</p>
              {!listing.amenities.includes('pets_allowed') && <p>No pets</p>}
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-navy accent-navy"
              />
              <span className="text-sm text-muted leading-relaxed">
                I agree to the house rules and CasaLux's{' '}
                <a href="#" className="underline text-foreground">terms of service</a> and{' '}
                <a href="#" className="underline text-foreground">cancellation policy</a>.
              </span>
            </label>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* CTA */}
          <Button
            variant="gold"
            size="xl"
            className="w-full"
            disabled={!agreedToRules || isSubmitting || !checkIn || !checkOut}
            onClick={handleBook}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-navy border-t-transparent animate-spin" />
                Processing…
              </span>
            ) : listing.instantBook ? (
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Confirm & Pay
              </span>
            ) : (
              'Send Request'
            )}
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted">
            <Shield className="h-4 w-4 shrink-0" />
            <span>
              {listing.instantBook
                ? "You won't be charged until you complete payment on the next screen."
                : 'No charge until the host approves your request.'}
            </span>
          </div>
        </div>

        {/* Right — listing summary */}
        <div className="order-first md:order-last">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4 sticky top-24">
            {/* Listing thumbnail */}
            {primaryImage && (
              <div className="relative h-40 rounded-xl overflow-hidden">
                <Image
                  src={primaryImage.url}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  sizes="340px"
                />
              </div>
            )}
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">{listing.propertyType}</p>
              <p className="font-semibold text-foreground mt-0.5 line-clamp-2">{listing.title}</p>
              <p className="text-xs text-muted mt-1">{listing.address.city}, {listing.address.country}</p>
            </div>

            <Separator />

            <div className="text-sm font-semibold text-foreground">Price details</div>
            <PriceBreakdown pricing={pricing} isLoading={pricingLoading} currency={listing.currency} />
          </div>
        </div>
      </div>
    </div>
  )
}
