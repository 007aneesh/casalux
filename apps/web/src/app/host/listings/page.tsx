'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useHostListings, useHostActions } from '@/lib/hooks/useHost'
import { Skeleton, Badge } from '@casalux/ui'
import { formatPrice } from '@/lib/utils'
import { Plus, Star, MoreVertical, Eye, EyeOff, Pencil, Trash2, Zap } from 'lucide-react'

const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'muted' | 'error' | 'default' }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Paused', variant: 'muted' },
  draft: { label: 'Draft', variant: 'warning' },
  pending_review: { label: 'In Review', variant: 'warning' },
}

function ListingRow({ listing, onToggle, onDelete }: { listing: any; onToggle: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const badge = STATUS_BADGE[listing.status] ?? STATUS_BADGE.inactive

  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow">
      {/* Image */}
      <div className="relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
        {listing.images?.[0]?.url ? (
          <Image src={listing.images[0].url} alt={listing.title} fill className="object-cover" sizes="96px" />
        ) : (
          <div className="w-full h-full bg-navy/5" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/listings/${listing.id}`} className="font-semibold text-sm text-navy hover:text-gold transition-colors truncate block">
            {listing.title}
          </Link>
          <Badge variant={badge.variant} className="flex-shrink-0">{badge.label}</Badge>
        </div>
        <p className="text-xs text-muted mt-0.5">{listing.address?.city}, {listing.address?.country}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted">
          <span className="font-semibold text-navy">{formatPrice(listing.basePrice)}/night</span>
          {listing.avgRating > 0 && (
            <span className="flex items-center gap-0.5">
              <Star size={10} className="text-gold fill-gold" />
              {listing.avgRating.toFixed(1)} ({listing.totalReviews})
            </span>
          )}
          {listing.instantBook && (
            <span className="flex items-center gap-0.5 text-emerald-600">
              <Zap size={10} fill="currentColor" />
              Instant
            </span>
          )}
        </div>
      </div>

      {/* Actions menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <MoreVertical size={16} className="text-muted" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[160px]">
              <Link
                href={`/host/listings/${listing.id}/edit`}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 text-navy transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Pencil size={14} />
                Edit listing
              </Link>
              <button
                onClick={() => { onToggle(); setMenuOpen(false) }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 text-navy transition-colors w-full text-left"
              >
                {listing.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                {listing.status === 'active' ? 'Pause listing' : 'Activate listing'}
              </button>
              <Link
                href={`/listings/${listing.id}`}
                target="_blank"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 text-navy transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Eye size={14} />
                Preview
              </Link>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => { if (confirm('Delete this listing?')) { onDelete(); setMenuOpen(false) } }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 transition-colors w-full text-left"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function HostListingsPage() {
  const { listings, isLoading, mutate } = useHostListings()
  const { toggleListingStatus, deleteListing } = useHostActions()

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">My Listings</h1>
          <p className="text-sm text-muted mt-1">{listings.length} propert{listings.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <Link
          href="/host/listings/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition-colors"
        >
          <Plus size={16} />
          Add listing
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100">
              <Skeleton className="w-24 h-20 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto mb-4">
            <Plus size={28} className="text-navy/40" />
          </div>
          <p className="font-semibold text-navy text-lg mb-1">No listings yet</p>
          <p className="text-sm text-muted mb-6">Create your first listing to start earning.</p>
          <Link
            href="/host/listings/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition"
          >
            <Plus size={16} />
            Create listing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing: any) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              onToggle={async () => {
                await toggleListingStatus(listing.id, listing.status !== 'active')
                mutate()
              }}
              onDelete={async () => {
                await deleteListing(listing.id)
                mutate()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
