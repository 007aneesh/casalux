'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useWishlists, useWishlistActions } from '@/lib/hooks/useWishlists'
import { Skeleton } from '@casalux/ui'
import { Heart, Plus, Trash2, MapPin } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

function WishlistCard({ wishlist, onDelete }: { wishlist: any; onDelete: (id: string) => void }) {
  const coverImages = wishlist.listings?.slice(0, 4).map((l: any) => l.images?.[0]).filter(Boolean) ?? []

  return (
    <div className="group relative">
      <Link href={`/wishlists/${wishlist.id}`} className="block">
        {/* Image mosaic */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
          {coverImages.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy/5 to-gold/10">
              <Heart size={32} className="text-gold/30" />
            </div>
          ) : coverImages.length === 1 ? (
            <Image src={coverImages[0]} alt={wishlist.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:640px) 100vw, 300px" />
          ) : (
            <div className="grid grid-cols-2 gap-0.5 w-full h-full">
              {coverImages.slice(0, 4).map((img: string, i: number) => (
                <div key={i} className="relative overflow-hidden">
                  <Image src={img} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="150px" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-navy">{wishlist.name}</p>
          <p className="text-sm text-muted mt-0.5">{wishlist.listings?.length ?? 0} saved</p>
        </div>
      </Link>

      {/* Delete button */}
      <button
        onClick={e => { e.preventDefault(); onDelete(wishlist.id) }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 hover:text-red-500"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function WishlistCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-square rounded-2xl mb-3" />
      <Skeleton className="h-4 w-2/3 mb-1" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  )
}

function CreateWishlistModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-xl font-bold text-navy mb-4">Create wishlist</h2>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Maldives Dream"
          maxLength={50}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition"
          onKeyDown={e => e.key === 'Enter' && name.trim() && onCreate(name.trim())}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
          <button
            onClick={() => name.trim() && onCreate(name.trim())}
            disabled={!name.trim()}
            className="flex-1 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-navy/90 transition"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WishlistsPage() {
  const { wishlists, isLoading, mutate } = useWishlists()
  const { createWishlist, deleteWishlist } = useWishlistActions()
  const [showCreate, setShowCreate] = useState(false)

  async function handleCreate(name: string) {
    await createWishlist(name)
    setShowCreate(false)
    mutate()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this wishlist?')) return
    await deleteWishlist(id)
    mutate()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-navy">Wishlists</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition"
          >
            <Plus size={16} />
            New list
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(6)].map((_, i) => <WishlistCardSkeleton key={i} />)}
          </div>
        ) : !wishlists?.length ? (
          <div className="text-center py-20">
            <Heart size={40} className="mx-auto mb-3 text-gold/40" />
            <p className="font-semibold text-navy text-lg mb-1">No wishlists yet</p>
            <p className="text-sm text-muted mb-6">Save your favourite places to revisit later.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition"
            >
              <Plus size={16} />
              Create your first wishlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {wishlists.map((w: any) => (
              <WishlistCard key={w.id} wishlist={w} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateWishlistModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </main>
  )
}
