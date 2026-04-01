'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useHostBookingRequests, useHostActions } from '@/lib/hooks/useHost'
import { Skeleton } from '@casalux/ui'
import { formatPrice, formatDateShort } from '@/lib/utils'
import { CheckCircle2, XCircle, Clock, BookOpen } from 'lucide-react'

type FilterTab = 'pending' | 'approved' | 'all'

type DeclineReason = 'dates_unavailable' | 'guests_dont_fit' | 'not_a_good_fit' | 'other'

const DECLINE_REASONS: { value: DeclineReason; label: string }[] = [
  { value: 'dates_unavailable',  label: 'Dates are unavailable' },
  { value: 'guests_dont_fit',    label: "Guests don't fit the property" },
  { value: 'not_a_good_fit',     label: "Not a good fit" },
  { value: 'other',              label: 'Other' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:      { label: 'Pending',    color: 'text-amber-700',   bg: 'bg-amber-50' },
  pre_approved: { label: 'Pre-Approved', color: 'text-blue-700', bg: 'bg-blue-50' },
  approved:     { label: 'Approved',   color: 'text-emerald-700', bg: 'bg-emerald-50' },
  confirmed:    { label: 'Confirmed',  color: 'text-emerald-700', bg: 'bg-emerald-50' },
  declined:     { label: 'Declined',   color: 'text-red-700',     bg: 'bg-red-50' },
  cancelled:    { label: 'Cancelled',  color: 'text-gray-600',    bg: 'bg-gray-50' },
  guest_cancelled: { label: 'Cancelled by Guest', color: 'text-gray-600', bg: 'bg-gray-50' },
  expired:      { label: 'Expired',    color: 'text-gray-500',    bg: 'bg-gray-50' },
  checked_in:   { label: 'Checked In', color: 'text-blue-700',   bg: 'bg-blue-50' },
  checked_out:  { label: 'Completed',  color: 'text-gray-600',   bg: 'bg-gray-100' },
}

function DeclineModal({ onConfirm, onClose }: {
  onConfirm: (reason: DeclineReason, message: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState<DeclineReason>('dates_unavailable')
  const [message, setMessage] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-navy">Decline request</h3>
        <p className="text-sm text-muted">Please let your guest know why you're declining.</p>

        <div className="space-y-2">
          <label className="text-xs font-medium text-navy uppercase tracking-wide">Reason</label>
          {DECLINE_REASONS.map(r => (
            <label key={r.value} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="decline-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-navy"
              />
              <span className="text-sm text-navy">{r.label}</span>
            </label>
          ))}
        </div>

        <div>
          <label className="text-xs font-medium text-navy uppercase tracking-wide block mb-1.5">
            Message to guest <span className="text-muted normal-case">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Add a personal note…"
            rows={3}
            maxLength={500}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-muted hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason, message)}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Decline request
          </button>
        </div>
      </div>
    </div>
  )
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
  const status = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="p-4">
        <div className="flex gap-4">
          <div className="relative w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
            {req.listing?.images?.[0]?.url ? (
              <Image src={req.listing.images[0].url} alt={req.listing.title} fill className="object-cover" sizes="80px" />
            ) : (
              <div className="w-full h-full bg-navy/5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm text-navy truncate">{req.listing?.title}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${status.bg} ${status.color}`}>
                {status.label}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {req.guest?.profileImageUrl ? (
                <Image src={req.guest.profileImageUrl} alt={req.guest.firstName} width={20} height={20} className="rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-navy/10 flex items-center justify-center text-xs font-bold text-navy">
                  {req.guest?.firstName?.charAt(0)}
                </div>
              )}
              <p className="text-xs text-muted">
                {req.guest?.firstName} {req.guest?.lastName} · {req.guests ?? req.guestCount} guest{(req.guests ?? req.guestCount) !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted">
                {formatDateShort(req.checkIn)} – {formatDateShort(req.checkOut)} · {nights}n
              </p>
              <p className="text-sm font-semibold text-gold">{formatPrice(req.priceSnapshot?.total)}</p>
            </div>
          </div>
        </div>

        {req.guestMessage && (
          <div className="mt-3 text-xs text-muted italic bg-gray-50 rounded-xl px-3 py-2 border-l-2 border-gold/30 line-clamp-2">
            "{req.guestMessage}"
          </div>
        )}

        {req.status === 'declined' && req.hostMessage && (
          <div className="mt-3 text-xs text-muted bg-red-50 rounded-xl px-3 py-2">
            Your message: "{req.hostMessage}"
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
  const [decliningId, setDecliningId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const filtered = requests.filter((r: any) => {
    if (tab === 'pending') return r.status === 'pending' || r.status === 'pre_approved'
    if (tab === 'approved') return r.status === 'approved' || r.status === 'confirmed' || r.status === 'checked_in' || r.status === 'checked_out'
    return true
  })

  const pendingCount = requests.filter((r: any) => r.status === 'pending').length

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'pending',  label: 'Pending',  count: pendingCount },
    { key: 'approved', label: 'Approved' },
    { key: 'all',      label: 'All' },
  ]

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      await approveRequest(id)
      await mutate()
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeclineConfirm = async (reason: DeclineReason, message: string) => {
    if (!decliningId) return
    const id = decliningId
    setDecliningId(null)
    setActionLoading(id)
    try {
      await declineRequest(id, reason, message)
      await mutate()
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <>
      {decliningId && (
        <DeclineModal
          onConfirm={handleDeclineConfirm}
          onClose={() => setDecliningId(null)}
        />
      )}

      <div className="px-4 md:px-8 py-6">
        <h1 className="font-display text-2xl font-bold text-navy mb-6">Booking Requests</h1>

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
            {tab === 'pending' && (
              <p className="text-sm text-muted mt-1">New requests will appear here.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req: any) => (
              <div key={req.id} className={actionLoading === req.id ? 'opacity-50 pointer-events-none' : ''}>
                <BookingRequestCard
                  req={req}
                  isPending={req.status === 'pending'}
                  onApprove={() => handleApprove(req.id)}
                  onDecline={() => setDecliningId(req.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
