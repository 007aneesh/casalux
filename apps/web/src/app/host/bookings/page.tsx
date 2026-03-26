'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useHostBookingRequests, useHostActions } from '@/lib/hooks/useHost'
import { Skeleton } from '@casalux/ui'
import { formatPrice, formatDateShort } from '@/lib/utils'
import { CheckCircle2, XCircle, Clock, BookOpen, ChevronDown } from 'lucide-react'

type FilterTab = 'pending' | 'approved' | 'all'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending_host_approval: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50' },
  confirmed: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  declined: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-50' },
  cancelled: { label: 'Cancelled', color: 'text-gray-600', bg: 'bg-gray-50' },
  checked_in: { label: 'Checked In', color: 'text-blue-700', bg: 'bg-blue-50' },
  checked_out: { label: 'Completed', color: 'text-gray-600', bg: 'bg-gray-100' },
}

function BookingRequestCard({ req, isPending, onApprove, onDecline }: {
  req: any
  isPending: boolean
  onApprove?: () => void
  onDecline?: () => void
}) {
  const nights = Math.round(
    (new Date(req.checkOut).getTime() - new Date(req.checkIn).getTime()) / 86400000
  )
  const status = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending_host_approval

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="p-4">
        <div className="flex gap-4">
          {/* Listing thumbnail */}
          <div className="relative w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
            {req.listingImage ? (
              <Image src={req.listingImage} alt={req.listingTitle} fill className="object-cover" sizes="80px" />
            ) : (
              <div className="w-full h-full bg-navy/5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm text-navy truncate">{req.listingTitle}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${status.bg} ${status.color}`}>
                {status.label}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {req.guestImage ? (
                <Image src={req.guestImage} alt={req.guestName} width={20} height={20} className="rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-navy/10 flex items-center justify-center text-xs font-bold text-navy">
                  {req.guestName.charAt(0)}
                </div>
              )}
              <p className="text-xs text-muted">{req.guestName} · {req.guestCount} guest{req.guestCount !== 1 ? 's' : ''}</p>
            </div>

            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted">
                {formatDateShort(req.checkIn)} – {formatDateShort(req.checkOut)} · {nights}n
              </p>
              <p className="text-sm font-semibold text-gold">{formatPrice(req.totalAmount)}</p>
            </div>
          </div>
        </div>

        {req.message && (
          <div className="mt-3 text-xs text-muted italic bg-gray-50 rounded-xl px-3 py-2 border-l-2 border-gold/30 line-clamp-2">
            "{req.message}"
          </div>
        )}
      </div>

      {isPending && (
        <div className="flex border-t border-gray-100">
          <button
            onClick={onDecline}
            className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 border-r border-gray-100"
          >
            <XCircle size={14} />
            Decline
          </button>
          <button
            onClick={onApprove}
            className="flex-1 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            Approve
          </button>
        </div>
      )}
    </div>
  )
}

export default function HostBookingsPage() {
  const [tab, setTab] = useState<FilterTab>('pending')
  const { requests, isLoading, mutate } = useHostBookingRequests()
  const { approveRequest, declineRequest } = useHostActions()

  const filtered = requests.filter((r: any) => {
    if (tab === 'pending') return r.status === 'pending_host_approval'
    if (tab === 'approved') return r.status === 'confirmed' || r.status === 'checked_in' || r.status === 'checked_out'
    return true
  })

  const pendingCount = requests.filter((r: any) => r.status === 'pending_host_approval').length

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'approved', label: 'Approved' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div className="px-4 md:px-8 py-6">
      <h1 className="font-display text-2xl font-bold text-navy mb-6">Booking Requests</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              tab === t.key ? 'bg-navy text-white shadow-sm' : 'text-muted hover:text-navy'
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={`text-xs font-bold rounded-full px-1.5 ${tab === t.key ? 'bg-white/20' : 'bg-gold/10 text-gold'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
              <Skeleton className="h-16 rounded-xl mb-3" />
              <Skeleton className="h-8 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <BookOpen size={32} className="mx-auto mb-2 text-navy/20" />
          <p className="font-medium text-navy">
            {tab === 'pending' ? 'No pending requests' : 'No bookings found'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req: any) => (
            <BookingRequestCard
              key={req.id}
              req={req}
              isPending={req.status === 'pending_host_approval'}
              onApprove={async () => { await approveRequest(req.id); mutate() }}
              onDecline={async () => { await declineRequest(req.id); mutate() }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
