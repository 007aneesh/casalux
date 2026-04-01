'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import {
  ArrowLeft, Calendar, Users, MapPin, Clock,
  CheckCircle2, XCircle, AlertCircle, CreditCard,
} from 'lucide-react'
import { Button } from '@casalux/ui'
import { useAuthedRequest } from '@/lib/hooks/useAuthedRequest'
import { formatPrice, formatDateShort } from '@/lib/utils'

interface PageProps {
  params: { id: string }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  // Booking request statuses
  pending:              { label: 'Awaiting Host Approval', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   icon: Clock },
  pre_approved:         { label: 'Pre-Approved',           color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   icon: CheckCircle2 },
  approved:             { label: 'Approved — Pay Now',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  declined:             { label: 'Declined by Host',       color: 'text-red-700',    bg: 'bg-red-50 border-red-200',     icon: XCircle },
  guest_cancelled:      { label: 'Cancelled',              color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',   icon: XCircle },
  expired:              { label: 'Expired',                color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',   icon: AlertCircle },
  payment_window_expired: { label: 'Payment Window Expired', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200',  icon: AlertCircle },
  // Booking statuses
  confirmed:            { label: 'Confirmed',              color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  pending_payment:      { label: 'Pending Payment',        color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200', icon: Clock },
  checked_in:           { label: 'Checked In',             color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  checked_out:          { label: 'Completed',              color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',   icon: CheckCircle2 },
  cancelled:            { label: 'Cancelled',              color: 'text-red-700',    bg: 'bg-red-50 border-red-200',     icon: XCircle },
}

export default function BookingDetailPage({ params }: PageProps) {
  const router = useRouter()
  const authedRequest = useAuthedRequest()
  const [data, setData] = useState<any>(null)
  const [isRequest, setIsRequest] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      // Try booking first, then booking request
      const bookingRes = await authedRequest<any>(`/bookings/${params.id}`)
      if (bookingRes.success) {
        setData(bookingRes.data)
        setIsRequest(false)
      } else {
        const reqRes = await authedRequest<any>(`/booking-requests/${params.id}`)
        if (reqRes.success) {
          setData(reqRes.data)
          setIsRequest(true)
        }
      }
      setIsLoading(false)
    }
    load()
  }, [params.id])

  const handlePay = async () => {
    if (!data) return
    setIsPaying(true)
    setError(null)
    try {
      const res = await authedRequest<any>(`/booking-requests/${data.id}/pay`, { method: 'POST' })
      if (!res.success) {
        setError((res as any).error?.message ?? 'Payment failed. Please try again.')
        return
      }
      const { bookingId, providerPayload, pricingBreakdown } = res.data
      const clientSecret = providerPayload?.clientSecret
      if (!clientSecret) {
        setError('Could not initialise payment. Please try again.')
        return
      }
      const qs = new URLSearchParams({
        clientSecret,
        bookingId,
        amount:   String(pricingBreakdown?.total ?? data.priceSnapshot?.total ?? 0),
        currency: pricingBreakdown?.currency ?? 'INR',
      })
      router.push(`/bookings/${params.id}/pay?${qs}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsPaying(false)
    }
  }

  const handleCancel = async () => {
    if (!data || !confirm('Are you sure you want to cancel this booking?')) return
    setIsCancelling(true)
    setError(null)
    try {
      const path = isRequest
        ? `/booking-requests/${data.id}/cancel`
        : `/bookings/${data.id}/cancel`
      const method = isRequest ? 'DELETE' : 'POST'
      const res = await authedRequest<any>(path, { method })
      if (res.success) {
        router.push('/bookings')
      } else {
        setError((res as any).error?.message ?? 'Could not cancel. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-muted" />
        <p className="text-muted">Booking not found.</p>
        <Link href="/bookings" className="text-sm underline text-navy">Back to trips</Link>
      </div>
    )
  }

  const status = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.expired
  const StatusIcon = status.icon
  const listing = data.listing
  const image = listing?.images?.[0]?.url ?? null
  const checkIn = data.checkIn ? parseISO(data.checkIn) : null
  const checkOut = data.checkOut ? parseISO(data.checkOut) : null
  const nights = checkIn && checkOut ? differenceInCalendarDays(checkOut, checkIn) : (data.nights ?? 0)
  const price = isRequest ? data.priceSnapshot : data.priceBreakdown
  const total = isRequest ? data.priceSnapshot?.total : data.totalAmount

  const canCancel = isRequest
    ? ['pending', 'pre_approved'].includes(data.status)
    : ['confirmed', 'pending_payment'].includes(data.status)

  const canPay = isRequest && data.status === 'approved'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => router.push('/bookings')}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Your trips
        </button>

        {/* Status banner */}
        <div className={`flex items-center gap-3 rounded-2xl border p-4 mb-6 ${status.bg}`}>
          <StatusIcon className={`h-5 w-5 flex-shrink-0 ${status.color}`} />
          <div>
            <p className={`font-semibold text-sm ${status.color}`}>{status.label}</p>
            {isRequest && data.status === 'pending' && (
              <p className="text-xs text-muted mt-0.5">
                The host has 24 hours to respond. You'll be notified by email.
              </p>
            )}
            {isRequest && data.status === 'approved' && (
              <p className="text-xs text-muted mt-0.5">
                Complete payment to confirm your booking.
              </p>
            )}
            {isRequest && data.status === 'declined' && data.hostMessage && (
              <p className="text-xs text-muted mt-0.5">"{data.hostMessage}"</p>
            )}
          </div>
        </div>

        {/* Listing card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden mb-4">
          {image && (
            <div className="relative h-48 w-full">
              <Image src={image} alt={listing?.title ?? 'Property'} fill className="object-cover" sizes="672px" />
            </div>
          )}
          <div className="p-5">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">{listing?.propertyType ?? 'Property'}</p>
            <h2 className="font-display text-lg font-semibold text-navy">{listing?.title}</h2>
            {listing?.address?.city && (
              <p className="flex items-center gap-1.5 text-xs text-muted mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {listing.address.city}{listing.address.country ? `, ${listing.address.country}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Trip details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-4 space-y-4">
          <h3 className="font-semibold text-sm text-navy">Trip details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted">Check-in</p>
                <p className="font-medium text-navy">{checkIn ? format(checkIn, 'EEE, MMM d, yyyy') : '—'}</p>
                {listing?.checkInTime && <p className="text-xs text-muted">After {listing.checkInTime}</p>}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted">Check-out</p>
                <p className="font-medium text-navy">{checkOut ? format(checkOut, 'EEE, MMM d, yyyy') : '—'}</p>
                {listing?.checkOutTime && <p className="text-xs text-muted">Before {listing.checkOutTime}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted flex-shrink-0" />
              <div>
                <p className="text-xs text-muted">Duration</p>
                <p className="font-medium text-navy">{nights} night{nights !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted flex-shrink-0" />
              <div>
                <p className="text-xs text-muted">Guests</p>
                <p className="font-medium text-navy">{data.guests ?? data.guestCount ?? 1}</p>
              </div>
            </div>
          </div>
          {data.guestMessage && (
            <div className="text-xs text-muted italic bg-gray-50 rounded-xl px-3 py-2 border-l-2 border-gold/30">
              "{data.guestMessage}"
            </div>
          )}
        </div>

        {/* Price */}
        {price && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-4">
            <h3 className="font-semibold text-sm text-navy mb-3">Price breakdown</h3>
            <div className="space-y-2 text-sm">
              {price.rawSubtotal != null && (
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(price.rawSubtotal, price.currency)}</span>
                </div>
              )}
              {price.cleaningFee != null && price.cleaningFee > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Cleaning fee</span>
                  <span>{formatPrice(price.cleaningFee, price.currency)}</span>
                </div>
              )}
              {price.serviceFee != null && (
                <div className="flex justify-between text-muted">
                  <span>Service fee</span>
                  <span>{formatPrice(price.serviceFee, price.currency)}</span>
                </div>
              )}
              {price.taxes != null && (
                <div className="flex justify-between text-muted">
                  <span>Taxes</span>
                  <span>{formatPrice(price.taxes, price.currency)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-navy">
                <span>Total</span>
                <span>{formatPrice(total, price.currency)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Ref */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card px-5 py-3 mb-6">
          <p className="text-xs text-muted">Reference</p>
          <p className="font-mono text-xs font-medium text-navy mt-0.5">{data.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {canPay && (
            <Button variant="gold" size="xl" className="w-full" onClick={handlePay} disabled={isPaying}>
              {isPaying ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-navy border-t-transparent animate-spin" />
                  Processing…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Complete payment — {formatPrice(total)}
                </span>
              )}
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" size="lg" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? 'Cancelling…' : 'Cancel booking'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
