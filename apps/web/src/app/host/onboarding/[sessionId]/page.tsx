'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthedRequest } from '@/lib/hooks/useAuthedRequest'
import { useClerk } from '@clerk/nextjs'
import Image from 'next/image'
import {
  ChevronLeft, ChevronRight, Check, Home,
  Sparkles, Camera, DollarSign, Calendar, Eye,
  Wifi, ChefHat, Waves, Dumbbell, Flame, Thermometer,
  Wind, Tv, PawPrint, Car, Mountain, TreePine, Key, Shirt, Coffee,
  Monitor, Utensils, Bath, ImagePlus, X, Loader2, Link,
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'space',        label: 'Your space',   icon: Home },
  { id: 'amenities',   label: 'Amenities',    icon: Sparkles },
  { id: 'photos',      label: 'Photos',       icon: Camera },
  { id: 'details',     label: 'Details',      icon: Sparkles },
  { id: 'pricing',     label: 'Pricing',      icon: DollarSign },
  { id: 'availability',label: 'Availability', icon: Calendar },
  { id: 'review',      label: 'Review',       icon: Eye },
]

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment', emoji: '🏢' },
  { value: 'house',     label: 'House',     emoji: '🏡' },
  { value: 'villa',     label: 'Villa',     emoji: '🏛️' },
  { value: 'cabin',     label: 'Cabin',     emoji: '🪵' },
  { value: 'unique',    label: 'Unique stay',emoji: '⛺' },
  { value: 'hotel',     label: 'Boutique hotel', emoji: '🏨' },
]

const ROOM_TYPES = [
  { value: 'entire_place',  label: 'Entire place',  desc: 'Guests have the whole place to themselves' },
  { value: 'private_room',  label: 'Private room',  desc: 'Guests have their own room in a home' },
  { value: 'shared_room',   label: 'Shared room',   desc: 'Guests sleep in a shared room or area' },
]

const AMENITY_OPTIONS: { slug: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { slug: 'wifi',               label: 'Wifi',              icon: Wifi },
  { slug: 'fast_wifi',          label: 'Fast wifi (100+)',  icon: Wifi },
  { slug: 'kitchen',            label: 'Full kitchen',      icon: ChefHat },
  { slug: 'pool',               label: 'Private pool',      icon: Waves },
  { slug: 'hot_tub',            label: 'Hot tub',           icon: Waves },
  { slug: 'gym',                label: 'Gym',               icon: Dumbbell },
  { slug: 'fireplace',          label: 'Indoor fireplace',  icon: Flame },
  { slug: 'heating',            label: 'Heating',           icon: Thermometer },
  { slug: 'air_conditioning',   label: 'Air conditioning',  icon: Wind },
  { slug: 'tv',                 label: 'Smart TV',          icon: Tv },
  { slug: 'pets_allowed',       label: 'Pets allowed',      icon: PawPrint },
  { slug: 'free_parking',       label: 'Free parking',      icon: Car },
  { slug: 'mountain_view',      label: 'Mountain view',     icon: Mountain },
  { slug: 'ocean_view',         label: 'Ocean view',        icon: Eye },
  { slug: 'garden',             label: 'Private garden',    icon: TreePine },
  { slug: 'self_checkin',       label: 'Self check-in',     icon: Key },
  { slug: 'washer',             label: 'Washer',            icon: Shirt },
  { slug: 'dryer',              label: 'Dryer',             icon: Shirt },
  { slug: 'coffee',             label: 'Coffee maker',      icon: Coffee },
  { slug: 'dedicated_workspace',label: 'Workspace',         icon: Monitor },
  { slug: 'bbq_grill',          label: 'BBQ grill',         icon: Utensils },
  { slug: 'sauna',              label: 'Sauna',             icon: Bath },
  { slug: 'beachfront',         label: 'Beachfront',        icon: Waves },
]

const CANCELLATION_POLICIES = [
  { value: 'flexible', label: 'Flexible',  desc: 'Full refund if cancelled 24h before check-in' },
  { value: 'moderate', label: 'Moderate',  desc: 'Full refund up to 5 days before check-in' },
  { value: 'strict',   label: 'Strict',    desc: '50% refund up to 1 week before check-in' },
]

// ─── Form state ───────────────────────────────────────────────────────────────

interface SpaceData {
  propertyType: string
  roomType: string
  maxGuests: number
  bedrooms: number
  beds: number
  baths: number
  address: { street: string; city: string; state: string; country: string; zip: string }
}

interface PhotoEntry {
  publicId: string
  url: string
  isPrimary: boolean
}

interface FormState {
  space: SpaceData
  amenities: string[]
  photos: PhotoEntry[]
  details: { title: string; description: string }
  pricing: { basePrice: number; cleaningFee: number; cancellationPolicy: string }
  availability: { instantBook: boolean; checkInTime: string; checkOutTime: string; minNights: number }
}

const DEFAULT_STATE: FormState = {
  space: {
    propertyType: '', roomType: '',
    maxGuests: 2, bedrooms: 1, beds: 1, baths: 1,
    address: { street: '', city: '', state: '', country: 'India', zip: '' },
  },
  amenities: [],
  photos: [],
  details: { title: '', description: '' },
  pricing: { basePrice: 5000, cleaningFee: 0, cancellationPolicy: 'moderate' },
  availability: { instantBook: false, checkInTime: '14:00', checkOutTime: '11:00', minNights: 1 },
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function NumericField({ label, value, onChange, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-navy">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-lg font-light hover:border-navy transition disabled:opacity-30"
          disabled={value <= min}
        >−</button>
        <span className="w-8 text-center text-sm font-semibold">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-lg font-light hover:border-navy transition"
        >+</button>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder, required, rows }: {
  label: string; value: string | number; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean; rows?: number
}) {
  const base = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition'
  return (
    <div>
      <label className="block text-sm font-medium text-navy mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${base} resize-none`}
        />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} className={base} />
      )}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-navy' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-navy text-right max-w-[60%]">{value}</span>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1.5">
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all ${
            i < current ? 'bg-navy text-white' : i === current ? 'bg-gold text-white scale-110' : 'bg-gray-100 text-muted'
          }`}>
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span className={`text-xs hidden sm:block ${i === current ? 'font-semibold text-navy' : 'text-muted'}`}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-200 mx-0.5 hidden sm:block" />}
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface UploadingFile {
  id: string
  preview: string
  status: 'uploading' | 'error'
  error?: string
}

export default function OnboardingWizardPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter()
  const authedRequest = useAuthedRequest()
  const { session } = useClerk()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(DEFAULT_STATE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Photo upload state
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const [photoDragging, setPhotoDragging] = useState(false)

  const sessionId = params.sessionId

  const setSpace = useCallback((key: keyof SpaceData, value: any) =>
    setForm((f) => ({ ...f, space: { ...f.space, [key]: value } })), [])
  const setAddress = useCallback((key: keyof SpaceData['address'], value: string) =>
    setForm((f) => ({ ...f, space: { ...f.space, address: { ...f.space.address, [key]: value } } })), [])
  const toggleAmenity = useCallback((slug: string) =>
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(slug) ? f.amenities.filter((a) => a !== slug) : [...f.amenities, slug],
    })), [])

  async function uploadPhotoFile(file: File) {
    const id = `${Date.now()}-${Math.random()}`
    const preview = URL.createObjectURL(file)
    setUploadingFiles((prev) => [...prev, { id, preview, status: 'uploading' }])

    try {
      const signRes = await authedRequest<{
        signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string
      }>('/uploads/sign', {
        method: 'POST',
        body: JSON.stringify({ folder: 'listings', resourceType: 'image' }),
      }) as any

      const { signature, timestamp, cloudName, apiKey, folder } = signRes?.data ?? signRes

      const fd = new FormData()
      fd.append('file', file)
      fd.append('api_key', apiKey)
      fd.append('timestamp', String(timestamp))
      fd.append('signature', signature)
      fd.append('folder', folder)

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: fd }
      )
      if (!cloudRes.ok) throw new Error('Cloudinary upload failed')
      const cloud = await cloudRes.json()

      setForm((f) => ({
        ...f,
        photos: [
          ...f.photos,
          { publicId: cloud.public_id, url: cloud.secure_url, isPrimary: f.photos.length === 0 },
        ],
      }))
      setUploadingFiles((prev) => prev.filter((u) => u.id !== id))
      URL.revokeObjectURL(preview)
    } catch (err: any) {
      setUploadingFiles((prev) =>
        prev.map((u) => u.id === id ? { ...u, status: 'error', error: err.message ?? 'Upload failed' } : u)
      )
    }
  }

  function handlePhotoFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith('image/'))
    images.forEach(uploadPhotoFile)
  }

  function addUrlPhoto() {
    const trimmed = urlDraft.trim()
    if (!trimmed) return
    setForm((f) => ({
      ...f,
      photos: [...f.photos, { publicId: `url_${Date.now()}`, url: trimmed, isPrimary: f.photos.length === 0 }],
    }))
    setUrlDraft('')
    setShowUrlInput(false)
  }

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return !!form.space.propertyType && !!form.space.roomType && !!form.space.address.city
      case 1: return form.amenities.length >= 1
      case 2: return form.photos.length >= 1 && uploadingFiles.every((u) => u.status !== 'uploading')
      case 3: return form.details.title.length >= 5 && form.details.description.length >= 20
      case 4: return form.pricing.basePrice >= 100
      default: return true
    }
  }

  async function saveStep() {
    setSaving(true)
    setError(null)
    try {
      const base = `/host/onboarding/${sessionId}`

      if (step === 0) {
        await authedRequest(`${base}/space`, {
          method: 'PATCH',
          body: JSON.stringify({ ...form.space }),
        })
      } else if (step === 1) {
        await authedRequest(`${base}/amenities`, {
          method: 'PATCH',
          body: JSON.stringify({ amenities: form.amenities }),
        })
      } else if (step === 2) {
        await authedRequest(`${base}/photos`, {
          method: 'POST',
          body: JSON.stringify({ photos: form.photos }),
        })
      } else if (step === 3) {
        await authedRequest(`${base}/details`, {
          method: 'PATCH',
          body: JSON.stringify(form.details),
        })
      } else if (step === 4) {
        await authedRequest(`${base}/pricing`, {
          method: 'PATCH',
          body: JSON.stringify(form.pricing),
        })
      } else if (step === 5) {
        await authedRequest(`${base}/availability`, {
          method: 'PATCH',
          body: JSON.stringify(form.availability),
        })
      }

      setStep((s) => s + 1)
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    setSaving(true)
    setError(null)
    try {
      const res = await authedRequest<{ status: string }>(`/host/onboarding/${sessionId}/submit`, { method: 'POST' }) as any
      const status: string = res?.data?.status ?? res?.status ?? ''

      if (status === 'auto_approved' || status === 'approved') {
        // Role was promoted in Clerk — reload session so JWT reflects new role,
        // then hard-navigate so Next.js middleware sees the fresh claim.
        await session?.reload()
        window.location.href = '/host/dashboard'
      } else {
        // Queued for admin review — send to the dedicated pending page.
        router.replace('/host/application-pending')
      }
    } catch (e: any) {
      setError(e?.message ?? 'Submission failed. Please try again.')
      setSaving(false)
    }
  }

  const isLastStep = step === STEPS.length - 1

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => step === 0 ? router.push('/become-a-host') : setStep((s) => s - 1)}
            className="h-9 w-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:border-gray-400 transition shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-navy">Become a host</h1>
            <p className="text-xs text-muted">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8 overflow-x-auto pb-1">
          <StepBar current={step} />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-5">

          {/* Step 0 — Space */}
          {step === 0 && (
            <>
              <div>
                <h2 className="font-semibold text-navy mb-3">What kind of property do you have?</h2>
                <div className="grid grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map(({ value, label, emoji }) => (
                    <button key={value} type="button" onClick={() => setSpace('propertyType', value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all ${
                        form.space.propertyType === value ? 'border-navy bg-navy/5 text-navy' : 'border-gray-200 text-muted hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-semibold text-navy mb-3">What will guests have access to?</h2>
                <div className="space-y-2">
                  {ROOM_TYPES.map(({ value, label, desc }) => (
                    <button key={value} type="button" onClick={() => setSpace('roomType', value)}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                        form.space.roomType === value ? 'border-navy bg-navy/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 transition-colors ${
                        form.space.roomType === value ? 'border-navy bg-navy' : 'border-gray-300'
                      }`} />
                      <div>
                        <p className="text-sm font-semibold text-navy">{label}</p>
                        <p className="text-xs text-muted mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-semibold text-navy mb-3">Where is your property?</h2>
                <div className="space-y-3">
                  <InputField label="Street address" value={form.space.address.street}
                    onChange={(v) => setAddress('street', v)} placeholder="123 Beachfront Road" />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="City" value={form.space.address.city}
                      onChange={(v) => setAddress('city', v)} placeholder="Goa" required />
                    <InputField label="State" value={form.space.address.state}
                      onChange={(v) => setAddress('state', v)} placeholder="Goa" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Country" value={form.space.address.country}
                      onChange={(v) => setAddress('country', v)} placeholder="India" required />
                    <InputField label="PIN code" value={form.space.address.zip}
                      onChange={(v) => setAddress('zip', v)} placeholder="403001" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-semibold text-navy mb-2">Capacity</h2>
                <NumericField label="Guests" value={form.space.maxGuests} onChange={(v) => setSpace('maxGuests', v)} min={1} />
                <NumericField label="Bedrooms" value={form.space.bedrooms} onChange={(v) => setSpace('bedrooms', v)} />
                <NumericField label="Beds" value={form.space.beds} onChange={(v) => setSpace('beds', v)} min={1} />
                <NumericField label="Bathrooms" value={form.space.baths} onChange={(v) => setSpace('baths', v)} />
              </div>
            </>
          )}

          {/* Step 1 — Amenities */}
          {step === 1 && (
            <div>
              <h2 className="font-semibold text-navy mb-1">What amenities do you offer?</h2>
              <p className="text-xs text-muted mb-4">Select at least one. You can update these later.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMENITY_OPTIONS.map(({ slug, label, icon: Icon }) => {
                  const selected = form.amenities.includes(slug)
                  return (
                    <button key={slug} type="button" onClick={() => toggleAmenity(slug)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm transition-all ${
                        selected ? 'border-navy bg-navy/5 text-navy font-medium' : 'border-gray-200 text-muted hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-xs leading-tight">{label}</span>
                      {selected && <Check className="h-3.5 w-3.5 ml-auto shrink-0 text-navy" />}
                    </button>
                  )
                })}
              </div>
              {form.amenities.length > 0 && (
                <p className="text-xs text-muted mt-3">{form.amenities.length} selected</p>
              )}
            </div>
          )}

          {/* Step 2 — Photos */}
          {step === 2 && (
            <div>
              <h2 className="font-semibold text-navy mb-1">Add photos of your property</h2>
              <p className="text-xs text-muted mb-4">
                Upload from your device or paste a URL. At least 1 photo required. The first photo is the cover.
              </p>

              {/* Photo grid */}
              {(form.photos.length > 0 || uploadingFiles.length > 0) && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {form.photos.map((photo, i) => (
                    <div key={photo.publicId} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                      <Image src={photo.url} alt="" fill className="object-cover" sizes="150px" unoptimized />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 bg-navy/80 text-white text-[10px] px-1.5 py-0.5 rounded-md">Cover</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white items-center justify-center hidden group-hover:flex transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {uploadingFiles.map((u) => (
                    <div key={u.id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                      <Image src={u.preview} alt="" fill className="object-cover opacity-50" sizes="150px" unoptimized />
                      {u.status === 'uploading' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 size={20} className="text-navy animate-spin" />
                        </div>
                      )}
                      {u.status === 'error' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 p-2 text-center">
                          <p className="text-[10px] text-red-600">{u.error ?? 'Failed'}</p>
                          <button
                            type="button"
                            onClick={() => setUploadingFiles((prev) => prev.filter((x) => x.id !== u.id))}
                            className="mt-1 text-[10px] text-red-500 underline"
                          >remove</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setPhotoDragging(true) }}
                onDragLeave={() => setPhotoDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setPhotoDragging(false)
                  handlePhotoFiles(Array.from(e.dataTransfer.files))
                }}
                onClick={() => photoInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl px-6 py-8 cursor-pointer transition-colors ${
                  photoDragging ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gray-400 bg-gray-50'
                }`}
              >
                <div className="h-11 w-11 rounded-xl bg-navy/5 flex items-center justify-center">
                  <ImagePlus size={20} className="text-navy/50" />
                </div>
                <p className="text-sm font-medium text-navy">Drop photos here or click to browse</p>
                <p className="text-xs text-muted">JPG, PNG, WEBP up to 10 MB</p>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handlePhotoFiles(Array.from(e.target.files ?? []))
                    e.target.value = ''
                  }}
                />
              </div>

              {/* Add by URL */}
              <div className="mt-3">
                {!showUrlInput ? (
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(true)}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-navy transition"
                  >
                    <Link size={12} /> Add by URL instead
                  </button>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="url"
                      value={urlDraft}
                      onChange={(e) => setUrlDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addUrlPhoto()}
                      placeholder="https://images.unsplash.com/…"
                      autoFocus
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={addUrlPhoto}
                      className="px-4 py-2 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90 transition"
                    >Add</button>
                    <button
                      type="button"
                      onClick={() => { setShowUrlInput(false); setUrlDraft('') }}
                      className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 text-muted hover:text-red-500 transition"
                    ><X size={14} /></button>
                  </div>
                )}
              </div>

              {form.photos.length > 0 && (
                <p className="text-xs text-muted mt-3">{form.photos.length} photo{form.photos.length !== 1 ? 's' : ''} added</p>
              )}
            </div>
          )}

          {/* Step 3 — Details */}
          {step === 3 && (
            <>
              <InputField
                label="Listing title"
                value={form.details.title}
                onChange={(v) => setForm((f) => ({ ...f, details: { ...f.details, title: v } }))}
                placeholder="Luxury Beachfront Villa with Private Pool"
                required
              />
              <p className="text-xs text-muted -mt-3">{form.details.title.length}/100 characters</p>
              <InputField
                label="Description"
                value={form.details.description}
                onChange={(v) => setForm((f) => ({ ...f, details: { ...f.details, description: v } }))}
                placeholder="Describe your property, its highlights, nearby attractions, and what makes it special…"
                required
                rows={6}
              />
              <p className="text-xs text-muted -mt-3">{form.details.description.length}/3000 characters</p>
            </>
          )}

          {/* Step 4 — Pricing */}
          {step === 4 && (
            <>
              <InputField
                label="Base price per night (₹)"
                value={form.pricing.basePrice}
                onChange={(v) => setForm((f) => ({ ...f, pricing: { ...f.pricing, basePrice: parseInt(v) || 0 } }))}
                type="number"
                placeholder="5000"
                required
              />
              <InputField
                label="Cleaning fee (₹)"
                value={form.pricing.cleaningFee}
                onChange={(v) => setForm((f) => ({ ...f, pricing: { ...f.pricing, cleaningFee: parseInt(v) || 0 } }))}
                type="number"
                placeholder="0"
              />
              <div>
                <h3 className="text-sm font-semibold text-navy mb-2">Cancellation policy</h3>
                <div className="space-y-2">
                  {CANCELLATION_POLICIES.map(({ value, label, desc }) => (
                    <button key={value} type="button"
                      onClick={() => setForm((f) => ({ ...f, pricing: { ...f.pricing, cancellationPolicy: value } }))}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        form.pricing.cancellationPolicy === value ? 'border-navy bg-navy/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 ${
                        form.pricing.cancellationPolicy === value ? 'border-navy bg-navy' : 'border-gray-300'
                      }`} />
                      <div>
                        <p className="text-sm font-semibold text-navy">{label}</p>
                        <p className="text-xs text-muted">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 5 — Availability */}
          {step === 5 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Check-in time"
                  value={form.availability.checkInTime}
                  onChange={(v) => setForm((f) => ({ ...f, availability: { ...f.availability, checkInTime: v } }))}
                  type="time"
                />
                <InputField
                  label="Check-out time"
                  value={form.availability.checkOutTime}
                  onChange={(v) => setForm((f) => ({ ...f, availability: { ...f.availability, checkOutTime: v } }))}
                  type="time"
                />
              </div>
              <InputField
                label="Minimum nights"
                value={form.availability.minNights}
                onChange={(v) => setForm((f) => ({ ...f, availability: { ...f.availability, minNights: parseInt(v) || 1 } }))}
                type="number"
                placeholder="1"
              />
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-navy">Instant Book</p>
                  <p className="text-xs text-muted mt-0.5">Guests can book without waiting for your approval</p>
                </div>
                <Toggle
                  checked={form.availability.instantBook}
                  onChange={(v) => setForm((f) => ({ ...f, availability: { ...f.availability, instantBook: v } }))}
                />
              </div>
            </>
          )}

          {/* Step 6 — Review */}
          {step === 6 && (
            <>
              <div>
                <h2 className="font-semibold text-navy mb-1">Review your listing</h2>
                <p className="text-xs text-muted mb-4">
                  Your listing goes live as a draft. You can edit and publish it from your dashboard.
                </p>
              </div>
              <div className="space-y-0">
                <ReviewRow label="Property type" value={`${PROPERTY_TYPES.find((t) => t.value === form.space.propertyType)?.label ?? '—'} · ${ROOM_TYPES.find((t) => t.value === form.space.roomType)?.label ?? '—'}`} />
                <ReviewRow label="Location" value={[form.space.address.city, form.space.address.state, form.space.address.country].filter(Boolean).join(', ')} />
                <ReviewRow label="Capacity" value={`${form.space.maxGuests} guests · ${form.space.bedrooms} bed${form.space.bedrooms !== 1 ? 'rooms' : 'room'} · ${form.space.baths} bath${form.space.baths !== 1 ? 's' : ''}`} />
                <ReviewRow label="Amenities" value={`${form.amenities.length} selected`} />
                <ReviewRow label="Photos" value={`${form.photos.length} photo${form.photos.length !== 1 ? 's' : ''}`} />
                <ReviewRow label="Title" value={form.details.title} />
                <ReviewRow label="Base price" value={`₹${form.pricing.basePrice.toLocaleString()}/night`} />
                {form.pricing.cleaningFee > 0 && (
                  <ReviewRow label="Cleaning fee" value={`₹${form.pricing.cleaningFee.toLocaleString()}`} />
                )}
                <ReviewRow label="Cancellation" value={CANCELLATION_POLICIES.find((p) => p.value === form.pricing.cancellationPolicy)?.label ?? '—'} />
                <ReviewRow label="Check-in / out" value={`${form.availability.checkInTime} / ${form.availability.checkOutTime}`} />
                <ReviewRow label="Min nights" value={`${form.availability.minNights}`} />
                <ReviewRow label="Instant Book" value={form.availability.instantBook ? 'Yes' : 'No'} />
              </div>
            </>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium bg-white hover:border-gray-400 transition flex items-center justify-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          {isLastStep ? (
            <button type="button" disabled={saving} onClick={handleSubmit}
              className="flex-1 py-3 bg-gold text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-gold/90 transition"
            >
              {saving ? 'Submitting…' : '🎉 Submit & Go Live'}
            </button>
          ) : (
            <button type="button" disabled={!canAdvance() || saving} onClick={saveStep}
              className="flex-1 py-3 bg-navy text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-navy/90 transition flex items-center justify-center gap-2"
            >
              {saving ? 'Saving…' : (<>Save & continue <ChevronRight className="h-4 w-4" /></>)}
            </button>
          )}
        </div>

        {/* Progress label */}
        <p className="text-center text-xs text-muted mt-4">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>
    </main>
  )
}
