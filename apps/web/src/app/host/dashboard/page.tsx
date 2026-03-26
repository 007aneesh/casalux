'use client'

import Link from 'next/link'
import { useHostStats, useHostBookingRequests } from '@/lib/hooks/useHost'
import { Skeleton } from '@casalux/ui'
import { formatPrice, formatDateShort } from '@/lib/utils'
import {
  Home, BookOpen, TrendingUp, Star,
  Clock, CheckCircle2, XCircle, ChevronRight, AlertCircle
} from 'lucide-react'

function StatCard({
  label, value, sub, icon: Icon, accent = false,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-card border ${accent ? 'border-gold/30 bg-gradient-to-br from-white to-gold/5' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted font-medium mb-1">{label}</p>
          <p className={`text-2xl font-bold ${accent ? 'text-gold' : 'text-navy'}`}>{value}</p>
          {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${accent ? 'bg-gold/10' : 'bg-navy/5'}`}>
          <Icon size={20} className={accent ? 'text-gold' : 'text-navy'} />
        </div>
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
      <Skeleton className="h-3 w-1/2 mb-2" />
      <Skeleton className="h-8 w-1/3 mb-1" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

function RequestCard({ req, onApprove, onDecline }: { req: any; onApprove: () => void; onDecline: () => void }) {
  const nights = Math.round(
    (new Date(req.checkOut).getTime() - new Date(req.checkIn).getTime()) / 86400000
  )
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card">
      <div className="flex gap-3">
        <div className="w-16 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {req.listingImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={req.listingImage} alt={req.listingTitle} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-navy/5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-navy truncate">{req.listingTitle}</p>
          <p className="text-xs text-muted mt-0.5">
            {req.guestName} · {req.guestCount} guest{req.guestCount !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {formatDateShort(req.checkIn)} – {formatDateShort(req.checkOut)} · {nights}n
          </p>
        </div>
        <p className="text-sm font-semibold text-gold flex-shrink-0">{formatPrice(req.totalAmount)}</p>
      </div>
      {req.message && (
        <p className="mt-3 text-xs text-muted italic border-l-2 border-gold/30 pl-3 line-clamp-2">
          "{req.message}"
        </p>
      )}
      <div className="flex gap-2 mt-3">
        <button
          onClick={onDecline}
          className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5"
        >
          <XCircle size={14} />
          Decline
        </button>
        <button
          onClick={onApprove}
          className="flex-1 py-2 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 size={14} />
          Approve
        </button>
      </div>
    </div>
  )
}

export default function HostDashboardPage() {
  const { stats, isLoading: statsLoading } = useHostStats()
  const { requests, isLoading: reqLoading, mutate } = useHostBookingRequests()
  const { approveRequest, declineRequest } = { approveRequest: async (id: string) => {}, declineRequest: async (id: string) => {} }

  const pendingRequests = requests.filter((r: any) => r.status === 'pending_host_approval')

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy">Overview</h1>
        <p className="text-sm text-muted mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statsLoading ? (
          [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="This month"
              value={formatPrice(stats?.thisMonthEarnings ?? 0)}
              sub="Earnings"
              icon={TrendingUp}
              accent
            />
            <StatCard
              label="Pending"
              value={stats?.pendingRequests ?? 0}
              sub="Booking requests"
              icon={Clock}
            />
            <StatCard
              label="Active"
              value={stats?.activeListings ?? 0}
              sub={`of ${stats?.totalListings ?? 0} listings`}
              icon={Home}
            />
            <StatCard
              label="Avg rating"
              value={stats?.avgRating ? stats.avgRating.toFixed(1) : '—'}
              sub={`${stats?.reviewCount ?? 0} reviews`}
              icon={Star}
            />
          </>
        )}
      </div>

      {/* Pending booking requests */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy">Pending Requests</h2>
          <Link href="/host/bookings" className="text-sm text-gold hover:underline flex items-center gap-1">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {reqLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
                <Skeleton className="h-14 rounded-xl mb-3" />
                <Skeleton className="h-8 rounded-xl" />
              </div>
            ))}
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400" />
            <p className="text-sm font-medium text-navy">All caught up!</p>
            <p className="text-xs text-muted mt-1">No pending booking requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.slice(0, 3).map((req: any) => (
              <RequestCard
                key={req.id}
                req={req}
                onApprove={async () => { await approveRequest(req.id); mutate() }}
                onDecline={async () => { await declineRequest(req.id); mutate() }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/host/listings/new"
          className="flex items-center gap-3 p-4 bg-navy text-white rounded-2xl hover:bg-navy/90 transition-colors"
        >
          <Home size={20} className="flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Add listing</p>
            <p className="text-xs opacity-70">Start earning</p>
          </div>
        </Link>
        <Link
          href="/host/calendar"
          className="flex items-center gap-3 p-4 bg-gold/10 text-navy rounded-2xl hover:bg-gold/20 transition-colors border border-gold/20"
        >
          <AlertCircle size={20} className="text-gold flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Block dates</p>
            <p className="text-xs text-muted">Manage calendar</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
