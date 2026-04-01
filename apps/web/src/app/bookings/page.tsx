'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useMyBookings, useBookingRequests } from '@/lib/hooks/useBooking'
import { Skeleton } from '@casalux/ui'
import { formatDateShort, formatPrice } from '@/lib/utils'
import { Calendar, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight } from 'lucide-react'

type BookingTab = 'upcoming' | 'past' | 'cancelled'

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50' },
  pending_payment: { label: 'Pending Payment', icon: Clock, className: 'text-amber-600 bg-amber-50' },
  pending_host_approval: { label: 'Awaiting Host', icon: Clock, className: 'text-blue-600 bg-blue-50' },
  checked_in: { label: 'Checked In', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50' },
  checked_out: { label: 'Completed', icon: CheckCircle2, className: 'text-gray-600 bg-gray-50' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'text-red-600 bg-red-50' },
  declined: { label: 'Declined', icon: XCircle, className: 'text-red-600 bg-red-50' },
  expired: { label: 'Expired', icon: AlertCircle, className: 'text-gray-500 bg-gray-50' },
}

function BookingCard({ booking }: { booking: any }) {
  const status = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.expired
  const StatusIcon = status.icon
  const checkIn = new Date(booking.checkIn)
  const checkOut = new Date(booking.checkOut)
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)

  return (
    <Link href={`/bookings/${booking.id}`} className="block group">
      <div className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-card hover:shadow-card-hover transition-all duration-200">
        {/* Thumbnail */}
        <div className="relative w-28 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
          {booking.listing?.images?.[0]?.url ? (
            <Image
              src={booking.listing.images[0].url}
              alt={booking.listing.title ?? 'Property'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="112px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-navy/10 to-gold/10" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-navy truncate">
                {booking.listing?.title ?? 'Property'}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted mt-0.5">
                <MapPin size={11} />
                <span className="truncate">{booking.listing?.address?.city ?? '—'}</span>
              </p>
            </div>
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${status.className}`}>
              <StatusIcon size={11} />
              {status.label}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDateShort(booking.checkIn)} – {formatDateShort(booking.checkOut)}
            </span>
            <span>·</span>
            <span>{nights} night{nights !== 1 ? 's' : ''}</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-navy">
              {formatPrice(booking.totalAmount)}
            </p>
            <ChevronRight size={16} className="text-muted group-hover:text-gold transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function BookingCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-white">
      <Skeleton className="w-28 h-24 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  )
}

export default function BookingsPage() {
  const [tab, setTab] = useState<BookingTab>('upcoming')
  const { bookings, isLoading: bookingsLoading, error: bookingsError } = useMyBookings()
  const { requests, isLoading: requestsLoading, error: requestsError } = useBookingRequests()

  const isLoading = bookingsLoading || requestsLoading
  const error = bookingsError || requestsError

  // Normalize booking requests to match Booking shape for the card
  const normalizedRequests = (requests ?? []).map((r: any) => ({
    ...r,
    status: r.status === 'pending' ? 'pending_host_approval' : r.status,
    totalAmount: r.priceSnapshot?.total ?? 0,
  }))

  const all = [...(bookings ?? []), ...normalizedRequests]

  const now = new Date()
  const filtered = all.filter((b: any) => {
    const checkOut = new Date(b.checkOut)
    if (tab === 'upcoming') return checkOut >= now && b.status !== 'cancelled' && b.status !== 'declined'
    if (tab === 'past') return checkOut < now && b.status !== 'cancelled'
    return b.status === 'cancelled' || b.status === 'declined'
  })

  const tabs: { key: BookingTab; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-navy mb-6">Your Trips</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-muted hover:text-navy'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <BookingCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">
            <AlertCircle size={32} className="mx-auto mb-2" />
            <p className="text-sm">Failed to load bookings. Please try again.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={40} className="mx-auto mb-3 text-gold opacity-50" />
            <p className="font-semibold text-navy text-lg mb-1">
              {tab === 'upcoming' ? 'No upcoming trips' : tab === 'past' ? 'No past trips' : 'No cancelled trips'}
            </p>
            <p className="text-sm text-muted mb-6">
              {tab === 'upcoming' ? 'Time to plan your next escape.' : 'Your travel history will appear here.'}
            </p>
            {tab === 'upcoming' && (
              <Link
                href="/"
                className="inline-flex items-center px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition-colors"
              >
                Explore properties
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking: any) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
