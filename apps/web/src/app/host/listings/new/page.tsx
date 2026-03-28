'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, Home } from 'lucide-react'
import { useAuthedRequest } from '@/lib/hooks/useAuthedRequest'
import { useAuth } from '@clerk/nextjs'

const STEPS = ['Type', 'Location', 'Details', 'Pricing', 'Review']

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house',     label: 'House' },
  { value: 'villa',     label: 'Villa' },
  { value: 'cabin',     label: 'Cabin' },
  { value: 'unique',    label: 'Unique stay' },
  { value: 'hotel',     label: 'Boutique hotel' },
]

const ROOM_TYPES = [
  { value: 'entire_place',  label: 'Entire place', desc: 'Guests have the whole place to themselves' },
  { value: 'private_room',  label: 'Private room', desc: 'Guests have their own room in a home' },
  { value: 'shared_room',   label: 'Shared room',  desc: 'Guests sleep in a room or area shared with others' },
]

const CANCELLATION_POLICIES = [
  { value: 'flexible',     label: 'Flexible',     desc: 'Full refund if cancelled 24h before check-in' },
  { value: 'moderate',     label: 'Moderate',     desc: 'Full refund up to 5 days before check-in' },
  { value: 'strict',       label: 'Strict',       desc: '50% refund up to 1 week before check-in' },
  { value: 'super_strict', label: 'Super Strict', desc: 'No refund after 48h of booking' },
]

interface FormData {
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

const DEFAULT_FORM: FormData = {
  title: '',
  description: '',
  propertyType: '',
  roomType: '',
  address: { street: '', city: '', state: '', country: 'India', zip: '' },
  maxGuests: 2,
  bedrooms: 1,
  beds: 1,
  baths: 1,
  basePrice: 5000,
  cleaningFee: 0,
  minNights: 1,
  instantBook: false,
  cancellationPolicy: 'moderate',
  checkInTime: '14:00',
  checkOutTime: '11:00',
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
            i < current ? 'bg-navy text-white' : i === current ? 'bg-gold text-white' : 'bg-gray-100 text-muted'
          }`}>
            {i < current ? <Check size={14} /> : i + 1}
          </div>
          <span className={`text-xs hidden sm:block ${i === current ? 'font-semibold text-navy' : 'text-muted'}`}>
            {label}
          </span>
          {i < total - 1 && <div className="w-6 h-px bg-gray-200 mx-1" />}
        </div>
      ))}
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder, required }: {
  label: string; value: string | number; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy mb-1">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition"
      />
    </div>
  )
}

function NumericField({ label, value, onChange, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-navy">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-lg font-light hover:border-navy transition"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-lg font-light hover:border-navy transition"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function NewListingPage() {
  const router = useRouter()
  const { sessionClaims } = useAuth()
  const authedRequest = useAuthedRequest()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [becomingHost, setBecomingHost] = useState(false)

  // Check user role from Clerk session claims
  const role = (sessionClaims as any)?.['publicMetadata']?.['role'] ?? (sessionClaims as any)?.role ?? 'guest'
  const isHost = role === 'host' || role === 'admin' || role === 'super_admin'

  const set = (key: keyof FormData, value: any) => setForm((f) => ({ ...f, [key]: value }))
  const setAddress = (key: keyof FormData['address'], value: string) =>
    setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }))

  const canNext = () => {
    if (step === 0) return !!form.propertyType && !!form.roomType
    if (step === 1) return !!form.address.city && !!form.address.country
    if (step === 2) return !!form.title && form.title.length >= 3 && !!form.description && form.description.length >= 20
    if (step === 3) return form.basePrice >= 100
    return true
  }

  async function handleBecomeHost() {
    setBecomingHost(true)
    setError(null)
    try {
      // Start the onboarding session — no host role required
      const res = await authedRequest<any>('/host/onboarding/start', { method: 'POST' })
      const sessionId = (res as any)?.session?.id ?? (res as any)?.data?.session?.id
      if (sessionId) {
        router.push(`/host/onboarding/${sessionId}`)
      } else {
        setError('Could not start onboarding. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBecomingHost(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
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
        currency:           'INR',
      }
      const res = await authedRequest<any>('/host/listings', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const id = (res as any)?.data?.id ?? (res as any)?.listing?.id
      if (id) {
        router.push(`/host/listings`)
      } else {
        setError('Failed to create listing. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // If not a host yet, show the "become a host" prompt
  if (!isHost) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-100 shadow-card p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto mb-4">
            <Home size={28} className="text-navy" />
          </div>
          <h1 className="font-display text-xl font-bold text-navy mb-2">Become a host</h1>
          <p className="text-sm text-muted mb-6">
            You need a host account to create listings. Complete a quick onboarding to get started — it only takes a few minutes.
          </p>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          <button
            onClick={handleBecomeHost}
            disabled={becomingHost}
            className="w-full py-3 bg-navy text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-navy/90 transition"
          >
            {becomingHost ? 'Starting…' : 'Start host onboarding'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => step === 0 ? router.back() : setStep((s) => s - 1)}
            className="h-9 w-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:border-gray-400 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-navy">New listing</h1>
          </div>
        </div>

        <div className="mb-8">
          <StepIndicator current={step} total={STEPS.length} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-5">

          {/* Step 0: Type */}
          {step === 0 && (
            <>
              <div>
                <h2 className="font-semibold text-navy mb-3">What type of property?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('propertyType', value)}
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
              </div>

              <div>
                <h2 className="font-semibold text-navy mb-3">What will guests have?</h2>
                <div className="space-y-2">
                  {ROOM_TYPES.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('roomType', value)}
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
              </div>
            </>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <>
              <h2 className="font-semibold text-navy">Where is your property?</h2>
              <InputField label="Street address" value={form.address.street} onChange={(v) => setAddress('street', v)} placeholder="123 Beach Road" />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="City" value={form.address.city} onChange={(v) => setAddress('city', v)} placeholder="Goa" required />
                <InputField label="State" value={form.address.state} onChange={(v) => setAddress('state', v)} placeholder="Goa" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Country" value={form.address.country} onChange={(v) => setAddress('country', v)} placeholder="India" required />
                <InputField label="PIN code" value={form.address.zip} onChange={(v) => setAddress('zip', v)} placeholder="403509" />
              </div>
            </>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <>
              <InputField label="Listing title" value={form.title} onChange={(v) => set('title', v)} placeholder="Luxury Beach Villa with Private Pool" required />
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Description <span className="text-red-400">*</span></label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe your property, its highlights, and what makes it special…"
                  rows={5}
                  maxLength={5000}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition"
                />
                <p className="text-xs text-muted mt-1 text-right">{form.description.length}/5000</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy mb-2">Capacity</h3>
                <NumericField label="Guests" value={form.maxGuests} onChange={(v) => set('maxGuests', v)} min={1} />
                <NumericField label="Bedrooms" value={form.bedrooms} onChange={(v) => set('bedrooms', v)} />
                <NumericField label="Beds" value={form.beds} onChange={(v) => set('beds', v)} min={1} />
                <NumericField label="Bathrooms" value={form.baths} onChange={(v) => set('baths', v)} />
              </div>
            </>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <>
              <InputField label="Base price per night (₹)" value={form.basePrice} onChange={(v) => set('basePrice', parseInt(v) || 0)} type="number" placeholder="5000" required />
              <InputField label="Cleaning fee (₹)" value={form.cleaningFee} onChange={(v) => set('cleaningFee', parseInt(v) || 0)} type="number" placeholder="0" />
              <InputField label="Minimum nights" value={form.minNights} onChange={(v) => set('minNights', parseInt(v) || 1)} type="number" placeholder="1" />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Check-in time" value={form.checkInTime} onChange={(v) => set('checkInTime', v)} type="time" />
                <InputField label="Check-out time" value={form.checkOutTime} onChange={(v) => set('checkOutTime', v)} type="time" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy mb-2">Cancellation policy</h3>
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
              </div>
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
            </>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <>
              <h2 className="font-semibold text-navy mb-1">Review your listing</h2>
              <p className="text-sm text-muted mb-4">It will be saved as a draft. You can publish it anytime from your listings dashboard.</p>
              <div className="space-y-3 text-sm">
                <ReviewRow label="Type" value={`${PROPERTY_TYPES.find(t => t.value === form.propertyType)?.label} · ${ROOM_TYPES.find(t => t.value === form.roomType)?.label}`} />
                <ReviewRow label="Location" value={[form.address.city, form.address.state, form.address.country].filter(Boolean).join(', ')} />
                <ReviewRow label="Title" value={form.title} />
                <ReviewRow label="Guests" value={`${form.maxGuests} guests · ${form.bedrooms} bed${form.bedrooms !== 1 ? 's' : ''} · ${form.baths} bath${form.baths !== 1 ? 's' : ''}`} />
                <ReviewRow label="Price" value={`₹${form.basePrice.toLocaleString()}/night${form.cleaningFee > 0 ? ` · ₹${form.cleaningFee.toLocaleString()} cleaning fee` : ''}`} />
                <ReviewRow label="Check-in / out" value={`${form.checkInTime} / ${form.checkOutTime}`} />
                <ReviewRow label="Instant Book" value={form.instantBook ? 'Yes' : 'No'} />
                <ReviewRow label="Cancellation" value={CANCELLATION_POLICIES.find(p => p.value === form.cancellationPolicy)?.label ?? ''} />
              </div>
              {error && (
                <p className="text-sm text-red-500 mt-3">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium bg-white hover:border-gray-400 transition flex items-center justify-center gap-2"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 py-3 bg-navy text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-navy/90 transition flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1 py-3 bg-gold text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-gold/90 transition"
            >
              {submitting ? 'Creating…' : 'Create listing'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-navy text-right">{value}</span>
    </div>
  )
}
