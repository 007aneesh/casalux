'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Save, Loader2 } from 'lucide-react'
import { useAuthedRequest } from '@/lib/hooks/useAuthedRequest'
import ImageUploader, { type UploadedImage } from '@/components/host/ImageUploader'

// ─── Constants ────────────────────────────────────────────────────────────────
const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house',     label: 'House' },
  { value: 'villa',     label: 'Villa' },
  { value: 'cabin',     label: 'Cabin' },
  { value: 'unique',    label: 'Unique stay' },
  { value: 'hotel',     label: 'Boutique hotel' },
]

const ROOM_TYPES = [
  { value: 'entire_place',  label: 'Entire place',  desc: 'Guests have the whole place to themselves' },
  { value: 'private_room',  label: 'Private room',  desc: 'Guests have their own room in a home' },
  { value: 'shared_room',   label: 'Shared room',   desc: 'Guests sleep in a room or area shared with others' },
]

const CANCELLATION_POLICIES = [
  { value: 'flexible',     label: 'Flexible',     desc: 'Full refund if cancelled 24h before check-in' },
  { value: 'moderate',     label: 'Moderate',     desc: 'Full refund up to 5 days before check-in' },
  { value: 'strict',       label: 'Strict',       desc: '50% refund up to 1 week before check-in' },
  { value: 'super_strict', label: 'Super Strict', desc: 'No refund after 48h of booking' },
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface ListingForm {
  title: string
  description: string
  propertyType: string
  roomType: string
  address: { street: string; city: string; state: string; country: string; zip: string }
  maxGuests: number
  bedrooms: number
  beds: number
  baths: number
  basePrice: number
  cleaningFee: number
  minNights: number
  instantBook: boolean
  cancellationPolicy: string
  checkInTime: string
  checkOutTime: string
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pb-4 border-b border-gray-100 mb-5">
      <h2 className="font-semibold text-navy">{title}</h2>
      {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder }: {
  value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition"
    />
  )
}

function NumericField({ label, value, onChange, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-navy">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-lg font-light hover:border-navy transition">
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-lg font-light hover:border-navy transition">
          +
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EditListingPage() {
  const { id }        = useParams<{ id: string }>()
  const router        = useRouter()
  const authedRequest = useAuthedRequest()

  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)
  const [images,    setImages]    = useState<UploadedImage[]>([])
  const [form,      setForm]      = useState<ListingForm>({
    title: '', description: '', propertyType: '', roomType: '',
    address: { street: '', city: '', state: '', country: 'India', zip: '' },
    maxGuests: 2, bedrooms: 1, beds: 1, baths: 1,
    basePrice: 5000, cleaningFee: 0, minNights: 1,
    instantBook: false, cancellationPolicy: 'moderate',
    checkInTime: '14:00', checkOutTime: '11:00',
  })

  const set = (key: keyof ListingForm, value: any) => setForm(f => ({ ...f, [key]: value }))
  const setAddr = (key: keyof ListingForm['address'], value: string) =>
    setForm(f => ({ ...f, address: { ...f.address, [key]: value } }))

  // Load listing
  useEffect(() => {
    if (!id) return
    authedRequest<any>(`/host/listings/${id}`)
      .then((res) => {
        const l = res?.data
        if (!l) { setError('Listing not found'); return }
        const addr = (l.address as any) ?? {}
        setForm({
          title:              l.title         ?? '',
          description:        l.description   ?? '',
          propertyType:       l.propertyType  ?? '',
          roomType:           l.roomType      ?? '',
          address: {
            street:  addr.street  ?? '',
            city:    addr.city    ?? '',
            state:   addr.state   ?? '',
            country: addr.country ?? 'India',
            zip:     addr.zip     ?? '',
          },
          maxGuests:          l.maxGuests          ?? 2,
          bedrooms:           l.bedrooms           ?? 1,
          beds:               l.beds               ?? 1,
          baths:              l.baths              ?? 1,
          basePrice:          l.basePrice          ?? 5000,
          cleaningFee:        l.cleaningFee        ?? 0,
          minNights:          l.minNights          ?? 1,
          instantBook:        l.instantBook        ?? false,
          cancellationPolicy: l.cancellationPolicy ?? 'moderate',
          checkInTime:        l.checkInTime        ?? '14:00',
          checkOutTime:       l.checkOutTime       ?? '11:00',
        })
        // Normalise images — DB stores them as plain objects with publicId / url
        const rawImages: any[] = Array.isArray(l.images) ? l.images : []
        setImages(
          rawImages
            .filter((img: any) => img?.url)
            .map((img: any, i: number): UploadedImage => ({
              publicId:  img.publicId ?? img.public_id ?? '',
              url:       img.url,
              width:     img.width  ?? 0,
              height:    img.height ?? 0,
              isPrimary: img.isPrimary ?? i === 0,
              order:     img.order ?? i,
            }))
        )
      })
      .catch(() => setError('Failed to load listing'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await authedRequest<any>(`/host/listings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title:              form.title,
          description:        form.description,
          propertyType:       form.propertyType,
          roomType:           form.roomType,
          address:            form.address,
          maxGuests:          form.maxGuests,
          bedrooms:           form.bedrooms,
          beds:               form.beds,
          baths:              form.baths,
          basePrice:          form.basePrice,
          cleaningFee:        form.cleaningFee,
          minNights:          form.minNights,
          instantBook:        form.instantBook,
          cancellationPolicy: form.cancellationPolicy,
          checkInTime:        form.checkInTime,
          checkOutTime:       form.checkOutTime,
        }),
      })
      if (res?.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError('Failed to save changes.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 size={28} className="text-navy animate-spin" />
      </div>
    )
  }

  if (error && !form.title) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-navy font-semibold mb-2">{error}</p>
          <button onClick={() => router.back()} className="text-sm text-gold underline">Go back</button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/host/listings')}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:border-gray-400 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold text-navy">Edit listing</h1>
              <p className="text-xs text-muted">{form.title || 'Untitled'}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 disabled:opacity-60 transition"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {/* Feedback */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
            Changes saved successfully.
          </div>
        )}
        {error && form.title && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* ── Photos ─────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <SectionHeader
            title="Photos"
            subtitle="Great photos help your listing stand out. First photo becomes the cover."
          />
          <ImageUploader
            listingId={id}
            initialImages={images}
            maxImages={10}
            onChange={setImages}
          />
        </section>

        {/* ── Property type ───────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-5">
          <SectionHeader title="Property type" />
          <Field label="Type">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROPERTY_TYPES.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => set('propertyType', value)}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                    form.propertyType === value
                      ? 'border-navy bg-navy text-white'
                      : 'border-gray-200 hover:border-navy text-navy'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="What guests have">
            <div className="space-y-2">
              {ROOM_TYPES.map(({ value, label, desc }) => (
                <button key={value} type="button" onClick={() => set('roomType', value)}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                    form.roomType === value ? 'border-navy bg-navy/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 transition-colors ${
                    form.roomType === value ? 'border-navy bg-navy' : 'border-gray-300'
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-navy">{label}</p>
                    <p className="text-xs text-muted mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Field>
        </section>

        {/* ── Location ────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
          <SectionHeader title="Location" />
          <Field label="Street address">
            <Input value={form.address.street} onChange={(v) => setAddr('street', v)} placeholder="123 Beach Road" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" required>
              <Input value={form.address.city}  onChange={(v) => setAddr('city', v)}  placeholder="Goa" />
            </Field>
            <Field label="State">
              <Input value={form.address.state} onChange={(v) => setAddr('state', v)} placeholder="Goa" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country" required>
              <Input value={form.address.country} onChange={(v) => setAddr('country', v)} placeholder="India" />
            </Field>
            <Field label="PIN code">
              <Input value={form.address.zip} onChange={(v) => setAddr('zip', v)} placeholder="403509" />
            </Field>
          </div>
        </section>

        {/* ── Details ─────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
          <SectionHeader title="Listing details" />
          <Field label="Title" required>
            <Input value={form.title} onChange={(v) => set('title', v)} placeholder="Luxury Beach Villa with Private Pool" />
          </Field>
          <Field label="Description" required>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe your property, its highlights, and what makes it special…"
              rows={6}
              maxLength={5000}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition"
            />
            <p className="text-xs text-muted text-right mt-1">{form.description.length}/5000</p>
          </Field>
          <Field label="Capacity">
            <div className="border border-gray-100 rounded-xl px-4">
              <NumericField label="Guests"    value={form.maxGuests} onChange={(v) => set('maxGuests', v)} min={1} />
              <NumericField label="Bedrooms"  value={form.bedrooms}  onChange={(v) => set('bedrooms', v)} />
              <NumericField label="Beds"      value={form.beds}      onChange={(v) => set('beds', v)} min={1} />
              <NumericField label="Bathrooms" value={form.baths}     onChange={(v) => set('baths', v)} />
            </div>
          </Field>
        </section>

        {/* ── Pricing & Policies ──────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
          <SectionHeader title="Pricing & policies" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price per night (₹)" required>
              <Input type="number" value={form.basePrice}   onChange={(v) => set('basePrice',   parseInt(v) || 0)} placeholder="5000" />
            </Field>
            <Field label="Cleaning fee (₹)">
              <Input type="number" value={form.cleaningFee} onChange={(v) => set('cleaningFee', parseInt(v) || 0)} placeholder="0" />
            </Field>
            <Field label="Minimum nights">
              <Input type="number" value={form.minNights}   onChange={(v) => set('minNights',   parseInt(v) || 1)} placeholder="1" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Check-in time">
              <Input type="time" value={form.checkInTime}  onChange={(v) => set('checkInTime', v)} />
            </Field>
            <Field label="Check-out time">
              <Input type="time" value={form.checkOutTime} onChange={(v) => set('checkOutTime', v)} />
            </Field>
          </div>
          <Field label="Cancellation policy">
            <div className="space-y-2">
              {CANCELLATION_POLICIES.map(({ value, label, desc }) => (
                <button key={value} type="button" onClick={() => set('cancellationPolicy', value)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    form.cancellationPolicy === value ? 'border-navy bg-navy/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 transition-colors ${
                    form.cancellationPolicy === value ? 'border-navy bg-navy' : 'border-gray-300'
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-navy">{label}</p>
                    <p className="text-xs text-muted">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Field>
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-semibold text-navy">Instant Book</p>
              <p className="text-xs text-muted">Guests can book without your approval</p>
            </div>
            <button
              type="button"
              onClick={() => set('instantBook', !form.instantBook)}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.instantBook ? 'bg-navy' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${form.instantBook ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </section>

        {/* Bottom save */}
        <div className="pb-8 flex gap-3">
          <button
            onClick={() => router.push('/host/listings')}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium bg-white hover:border-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-navy text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-navy/90 transition flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </main>
  )
}
