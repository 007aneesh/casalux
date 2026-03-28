'use client'

import { useState } from 'react'
import { Heart, Plus, Check, X } from 'lucide-react'
import { useWishlists, useWishlistActions } from '@/lib/hooks/useWishlists'
import { useAuthedRequest } from '@/lib/hooks/useAuthedRequest'

interface WishlistPickerProps {
  listingId: string
  onClose: () => void
}

export function WishlistPicker({ listingId, onClose }: WishlistPickerProps) {
  const { wishlists, isLoading, mutate } = useWishlists()
  const { createWishlist } = useWishlistActions()
  const authedRequest = useAuthedRequest()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  async function handleSelect(wishlistId: string) {
    setSaving(wishlistId)
    try {
      await authedRequest(`/users/me/wishlists/${wishlistId}/listings`, {
        method: 'POST',
        body: JSON.stringify({ listingId }),
      })
      await mutate()
      onClose()
    } finally {
      setSaving(null)
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    await createWishlist(newName.trim())
    await mutate()
    setCreating(false)
    setNewName('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="font-display text-base font-semibold text-navy">Save to wishlist</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 max-h-64 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted text-center py-4">Loading…</p>
          ) : wishlists.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No wishlists yet. Create one below.</p>
          ) : (
            <div className="space-y-1">
              {(wishlists as any[]).map((w) => (
                <button
                  key={w.id}
                  onClick={() => handleSelect(w.id)}
                  disabled={!!saving}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition text-left disabled:opacity-60"
                >
                  <Heart size={16} className="text-gold shrink-0" />
                  <span className="text-sm font-medium text-navy flex-1 truncate">{w.name}</span>
                  {saving === w.id ? (
                    <span className="text-xs text-muted">Saving…</span>
                  ) : (
                    <span className="text-xs text-muted">{w.itemCount ?? 0} saved</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-2 border-t border-gray-100">
          {creating ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Wishlist name"
                maxLength={50}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') setCreating(false)
                }}
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-3 py-2 bg-navy text-white rounded-xl disabled:opacity-40 hover:bg-navy/90 transition"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-navy"
            >
              <Plus size={16} />
              New list
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
