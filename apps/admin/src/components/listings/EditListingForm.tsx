'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminListingDetail, UpdateListingPayload } from '@/lib/api'
import {
  PROPERTY_TYPES, ROOM_TYPES, STATUSES, POLICIES, CURRENCIES,
  STATUS_BADGE, STANDARD_AMENITIES, STANDARD_AMENITY_SLUGS, groupAmenitiesByCategory,
} from '@/lib/listing-constants'

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {children} {required && <span className="text-red-400">*</span>}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors
        disabled:bg-gray-50 disabled:text-gray-400 ${props.className ?? ''}`}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors resize-y
        disabled:bg-gray-50 disabled:text-gray-400 ${props.className ?? ''}`}
    />
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900
        focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors
        disabled:bg-gray-50 disabled:text-gray-400 ${props.className ?? ''}`}
    >
      {children}
    </select>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors
          ${checked ? 'bg-gray-900' : 'bg-gray-200'}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform
            ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface Props {
  listing: AdminListingDetail
  onSave: (payload: UpdateListingPayload) => Promise<void>
  onStatusChange: (status: string) => Promise<void>
  onAddCustomAmenity: (name: string) => Promise<{ slug: string; name: string; category: string }>
}

export default function EditListingForm({ listing, onSave, onStatusChange, onAddCustomAmenity }: Props) {
  const router = useRouter()
  const [saving, startSave] = useTransition()
  const [changingStatus, startStatusChange] = useTransition()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // ── Form state ──────────────────────────────────────────────────────────────
  const [title, setTitle]               = useState(listing.title)
  const [description, setDescription]   = useState(listing.description ?? '')
  const [propertyType, setPropertyType] = useState(listing.propertyType ?? 'apartment')
  const [roomType, setRoomType]         = useState(listing.roomType ?? 'entire_place')
  const [currency, setCurrency]         = useState(listing.currency ?? 'INR')

  // Address
  const [street, setStreet]   = useState(listing.address?.street ?? '')
  const [city, setCity]       = useState(listing.address?.city ?? '')
  const [state, setState]     = useState(listing.address?.state ?? '')
  const [country, setCountry] = useState(listing.address?.country ?? '')
  const [zip, setZip]         = useState(listing.address?.zip ?? '')
  const [lat, setLat]         = useState(String(listing.lat ?? ''))
  const [lng, setLng]         = useState(String(listing.lng ?? ''))

  // Capacity
  const [maxGuests, setMaxGuests] = useState(String(listing.maxGuests ?? 1))
  const [bedrooms, setBedrooms]   = useState(String(listing.bedrooms ?? 1))
  const [beds, setBeds]           = useState(String(listing.beds ?? 1))
  const [baths, setBaths]         = useState(String(listing.baths ?? 1))

  // Pricing (stored in paise/cents — display in rupees)
  const [basePrice, setBasePrice]     = useState(String(listing.basePrice / 100))
  const [cleaningFee, setCleaningFee] = useState(String(listing.cleaningFee / 100))

  // House rules
  const [minNights, setMinNights]                   = useState(String(listing.minNights ?? 1))
  const [maxNights, setMaxNights]                   = useState(String(listing.maxNights ?? ''))
  const [checkInTime, setCheckInTime]               = useState(listing.checkInTime ?? '14:00')
  const [checkOutTime, setCheckOutTime]             = useState(listing.checkOutTime ?? '11:00')
  const [cancellationPolicy, setCancellationPolicy] = useState(listing.cancellationPolicy ?? 'moderate')
  const [instantBook, setInstantBook]               = useState(listing.instantBook ?? false)

  // Requirements
  const [requireVerifiedId, setRequireVerifiedId]             = useState(listing.requireVerifiedId ?? false)
  const [requireProfilePhoto, setRequireProfilePhoto]         = useState(listing.requireProfilePhoto ?? false)
  const [requirePositiveReviews, setRequirePositiveReviews]   = useState(listing.requirePositiveReviews ?? false)

  // Amenities — all selected slugs (standard + custom)
  const [amenities, setAmenities] = useState<string[]>(listing.amenities ?? [])

  // Custom amenity input
  const [customInput, setCustomInput]   = useState('')
  const [addingCustom, startAddCustom]  = useTransition()

  // Status
  const [pendingStatus, setPendingStatus] = useState(listing.status)

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function toggleAmenity(slug: string) {
    setAmenities((prev) => prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug])
  }

  function handleAddCustomAmenity() {
    const name = customInput.trim()
    if (!name) return
    startAddCustom(async () => {
      try {
        const amenity = await onAddCustomAmenity(name)
        setAmenities((prev) => prev.includes(amenity.slug) ? prev : [...prev, amenity.slug])
        setCustomInput('')
        showToast('success', `Custom amenity "${amenity.name}" added.`)
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : 'Failed to add custom amenity.')
      }
    })
  }

  function handleSave() {
    startSave(async () => {
      try {
        await onSave({
          title,
          description,
          propertyType,
          roomType,
          currency,
          address: { street, city, state, country, zip },
          lat: parseFloat(lat) || 0,
          lng: parseFloat(lng) || 0,
          maxGuests: parseInt(maxGuests) || 1,
          bedrooms:  parseInt(bedrooms) || 1,
          beds:      parseInt(beds) || 1,
          baths:     parseInt(baths) || 1,
          basePrice:   Math.round(parseFloat(basePrice) * 100) || 0,
          cleaningFee: Math.round(parseFloat(cleaningFee) * 100) || 0,
          minNights:  parseInt(minNights) || 1,
          maxNights:  maxNights ? parseInt(maxNights) : null,
          checkInTime,
          checkOutTime,
          cancellationPolicy,
          instantBook,
          requireVerifiedId,
          requireProfilePhoto,
          requirePositiveReviews,
          amenities,
        })
        showToast('success', 'Listing saved successfully.')
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : 'Failed to save listing.')
      }
    })
  }

  function handleStatusChange() {
    if (pendingStatus === listing.status) return
    startStatusChange(async () => {
      try {
        await onStatusChange(pendingStatus)
        showToast('success', `Status changed to "${pendingStatus}".`)
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : 'Failed to change status.')
      }
    })
  }

  // Split amenities: standard ones shown in grid, custom ones shown separately
  const customAmenities = amenities.filter((s) => !STANDARD_AMENITY_SLUGS.has(s))
  const amenityGroups   = groupAmenitiesByCategory(STANDARD_AMENITIES)

  return (
    <div className="max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.push(`/listings/${listing.id}`)}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors mb-2 inline-flex items-center gap-1"
          >
            ← Back to listing
          </button>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">Edit Listing</h1>
          <p className="text-sm text-gray-400 mt-0.5 truncate max-w-lg">{listing.title}</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="space-y-6">

        {/* ── Status control ─────────────────────────────────────────────────── */}
        <SectionCard title="Status">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Current status</Label>
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[listing.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {listing.status}
                </span>
                <span className="text-gray-300">→</span>
                <Select
                  value={pendingStatus}
                  onChange={(e) => setPendingStatus(e.target.value)}
                  className="w-40"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </Select>
              </div>
            </div>
            <button
              type="button"
              onClick={handleStatusChange}
              disabled={changingStatus || pendingStatus === listing.status}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 disabled:opacity-40 transition-colors"
            >
              {changingStatus ? 'Updating…' : 'Change status'}
            </button>
          </div>
        </SectionCard>

        {/* ── Basic info ─────────────────────────────────────────────────────── */}
        <SectionCard title="Basic Information">
          <div>
            <Label required>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Listing title"
              maxLength={100}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{title?.length}/100</p>
          </div>

          <div>
            <Label required>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe the space, what makes it special…"
              maxLength={5000}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/5000</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Property type</Label>
              <Select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Room type</Label>
              <Select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </Select>
            </div>
          </div>
        </SectionCard>

        {/* ── Location ───────────────────────────────────────────────────────── */}
        <SectionCard title="Location">
          <div>
            <Label>Street address</Label>
            <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
            </div>
            <div>
              <Label>State / Province</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Maharashtra" />
            </div>
            <div>
              <Label required>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
            </div>
            <div>
              <Label>ZIP / PIN code</Label>
              <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="400001" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Latitude</Label>
              <Input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="19.0760" />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="72.8777" />
            </div>
          </div>
        </SectionCard>

        {/* ── Capacity & Layout ──────────────────────────────────────────────── */}
        <SectionCard title="Capacity & Layout">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Label required>Max guests</Label>
              <Input type="number" min={1} max={50} value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} />
            </div>
            <div>
              <Label required>Bedrooms</Label>
              <Input type="number" min={0} max={50} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
            </div>
            <div>
              <Label required>Beds</Label>
              <Input type="number" min={1} max={50} value={beds} onChange={(e) => setBeds(e.target.value)} />
            </div>
            <div>
              <Label required>Bathrooms</Label>
              <Input type="number" min={0} max={50} step={0.5} value={baths} onChange={(e) => setBaths(e.target.value)} />
            </div>
          </div>
        </SectionCard>

        {/* ── Pricing ────────────────────────────────────────────────────────── */}
        <SectionCard title="Pricing">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label required>Base price / night</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : ''}
                </span>
                <Input
                  type="number"
                  min={0}
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="pl-7"
                  placeholder="5000"
                />
              </div>
            </div>
            <div>
              <Label>Cleaning fee</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : ''}
                </span>
                <Input
                  type="number"
                  min={0}
                  value={cleaningFee}
                  onChange={(e) => setCleaningFee(e.target.value)}
                  className="pl-7"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label required>Currency</Label>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>
        </SectionCard>

        {/* ── House Rules ────────────────────────────────────────────────────── */}
        <SectionCard title="House Rules">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Label required>Min nights</Label>
              <Input type="number" min={1} max={365} value={minNights} onChange={(e) => setMinNights(e.target.value)} />
            </div>
            <div>
              <Label>Max nights</Label>
              <Input type="number" min={1} max={365} value={maxNights} onChange={(e) => setMaxNights(e.target.value)} placeholder="No limit" />
            </div>
            <div>
              <Label required>Check-in time</Label>
              <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
            </div>
            <div>
              <Label required>Check-out time</Label>
              <Input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Cancellation policy</Label>
              <Select value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)}>
                {POLICIES.map((p) => (
                  <option key={p} value={p}>{p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="pt-1 space-y-3">
            <Toggle checked={instantBook} onChange={setInstantBook} label="Instant Book — allow guests to book without host approval" />
          </div>
        </SectionCard>

        {/* ── Guest Requirements ─────────────────────────────────────────────── */}
        <SectionCard title="Guest Requirements">
          <div className="space-y-3">
            <Toggle checked={requireVerifiedId} onChange={setRequireVerifiedId} label="Require verified government ID" />
            <Toggle checked={requireProfilePhoto} onChange={setRequireProfilePhoto} label="Require profile photo" />
            <Toggle checked={requirePositiveReviews} onChange={setRequirePositiveReviews} label="Require positive reviews from past hosts" />
          </div>
        </SectionCard>

        {/* ── Amenities ──────────────────────────────────────────────────────── */}
        <SectionCard title={`Amenities (${amenities.length} selected)`}>
          {/* Standard amenities grouped by category */}
          <div className="space-y-5">
            {Object.entries(amenityGroups).map(([category, items]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{category}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {items.map((a) => {
                    const selected = amenities.includes(a.slug)
                    return (
                      <button
                        key={a.slug}
                        type="button"
                        onClick={() => toggleAmenity(a.slug)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border text-left transition-colors
                          ${selected
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                      >
                        <span className={`h-3.5 w-3.5 rounded-sm border flex items-center justify-center shrink-0 text-[10px]
                          ${selected ? 'border-white bg-white text-gray-900' : 'border-gray-300'}`}>
                          {selected ? '✓' : ''}
                        </span>
                        <span className="truncate">{a.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Custom amenities already on this listing */}
          {customAmenities.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Custom</p>
              <div className="flex flex-wrap gap-2">
                {customAmenities.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => toggleAmenity(slug)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-900 bg-gray-900 text-white"
                  >
                    <span className="truncate">{slug.replace(/^custom_/, '').replace(/_/g, ' ')}</span>
                    <span className="text-xs opacity-60">✕</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add custom amenity */}
          <div className="pt-2 border-t border-gray-100">
            <Label>Add custom amenity</Label>
            <div className="flex gap-2">
              <Input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomAmenity()}
                placeholder="e.g. Telescope, Game room…"
                maxLength={60}
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                disabled={addingCustom || !customInput.trim()}
                className="shrink-0 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 disabled:opacity-40 transition-colors"
              >
                {addingCustom ? 'Adding…' : 'Add'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Custom amenities are saved immediately and included in the next save.</p>
          </div>
        </SectionCard>

        {/* ── Images (view only) ─────────────────────────────────────────────── */}
        {listing.images && listing.images.length > 0 && (
          <SectionCard title={`Images (${listing.images.length} — manage via host portal)`}>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[...listing.images]
                .sort((a, b) => a.order - b.order)
                .map((img, idx) => (
                  <div key={img.publicId ?? idx} className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`Image ${idx + 1}`}
                      className="h-32 w-48 object-cover rounded-lg border border-gray-100 opacity-90"
                    />
                    {img.isPrimary && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-900 text-white">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Image reordering and uploads are managed through the host portal.</p>
          </SectionCard>
        )}

        {/* ── Save bar ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <button
            type="button"
            onClick={() => router.push(`/listings/${listing.id}`)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Discard changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
