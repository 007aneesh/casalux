import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  ArrowLeft, User, MapPin, Home, Bed, Bath, Users,
  Wifi, Star, DollarSign, Clock, CalendarCheck, CheckCircle,
  XCircle, Image as ImageIcon, Tag,
} from 'lucide-react'
import {
  getHostApplication,
  approveHostApplication,
  rejectHostApplication,
  type AdminHostApplicationDetail,
} from '@/lib/api'
import HostApplicationActions from '@/components/host-applications/HostApplicationActions'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  in_progress:   'bg-gray-100 text-gray-600 border-gray-200',
  submitted:     'bg-amber-100 text-amber-700 border-amber-200',
  approved:      'bg-green-100 text-green-700 border-green-200',
  auto_approved: 'bg-blue-100 text-blue-700 border-blue-200',
  rejected:      'bg-red-100 text-red-700 border-red-200',
}

const PROPERTY_LABELS: Record<string, string> = {
  apartment: 'Apartment',
  house:     'House',
  villa:     'Villa',
  cabin:     'Cabin',
  unique:    'Unique stay',
  hotel:     'Boutique hotel',
}

const ROOM_LABELS: Record<string, string> = {
  entire_place: 'Entire place',
  private_room: 'Private room',
  shared_room:  'Shared room',
}

const CANCELLATION_LABELS: Record<string, string> = {
  flexible: 'Flexible — full refund if cancelled 24 h before check-in',
  moderate: 'Moderate — full refund up to 5 days before check-in',
  strict:   'Strict — 50% refund up to 1 week before check-in',
}

function fmt(n: number | undefined, currency = 'INR') {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function Section({ title, icon: Icon, children }: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
        <Icon className="h-4 w-4 text-gray-400" />
        {title}
      </h3>
      {children}
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-900 text-right">{value ?? '—'}</span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function HostApplicationDetailPage({ params }: PageProps) {
  const { id } = await params

  let app: AdminHostApplicationDetail
  try {
    app = await getHostApplication(id)
    if (!app) notFound()
  } catch {
    notFound()
  }

  const d = (app.sessionData ?? {}) as AdminHostApplicationDetail['sessionData']
  const isPending = app.status === 'submitted'

  // Server actions
  async function handleApprove(appId: string) {
    'use server'
    await approveHostApplication(appId)
    revalidatePath('/host-applications')
    revalidatePath(`/host-applications/${appId}`)
  }

  async function handleReject(appId: string, reason: string) {
    'use server'
    await rejectHostApplication(appId, reason)
    revalidatePath('/host-applications')
    revalidatePath(`/host-applications/${appId}`)
  }

  const address = d.address
    ? [d.address.street, d.address.city, d.address.state, d.address.country]
        .filter(Boolean).join(', ')
    : null

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Top bar ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <Link
            href="/host-applications"
            className="mt-0.5 h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:border-gray-400 transition shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">
                {app.user.firstName} {app.user.lastName}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE[app.status] ?? STATUS_BADGE.in_progress}`}>
                {app.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{app.user.email}</p>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
              {app.submittedAt && (
                <span>Submitted {new Date(app.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              )}
              {app.reviewedAt && (
                <span>Reviewed {new Date(app.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              )}
              <Link href={`/users/${app.user.id}`} className="text-blue-500 hover:underline">
                View user profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Action buttons — only for pending applications */}
        {isPending && (
          <div className="shrink-0">
            <HostApplicationActions
              applicationId={app.id}
              onApprove={handleApprove}
              onReject={handleReject}
              size="lg"
            />
          </div>
        )}

        {/* Decision banner — for already-decided applications */}
        {app.status === 'approved' || app.status === 'auto_approved' ? (
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Approved</span>
          </div>
        ) : app.status === 'rejected' ? (
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Rejected</span>
          </div>
        ) : null}
      </div>

      {/* Rejection reason banner */}
      {app.status === 'rejected' && app.rejectionReason && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs font-semibold text-red-700 mb-1">Rejection reason sent to applicant</p>
          <p className="text-sm text-red-700">{app.rejectionReason}</p>
        </div>
      )}

      {/* ── Photos ── */}
      {d.photos && d.photos.length > 0 ? (
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <ImageIcon className="h-4 w-4 text-gray-400" />
            Photos ({d.photos.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {d.photos.map((photo, i) => (
              <a
                key={photo.publicId}
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100 block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                {photo.isPrimary && (
                  <span className="absolute bottom-1.5 left-1.5 bg-gray-900/75 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md">
                    Cover
                  </span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
          <ImageIcon className="h-6 w-6 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No photos uploaded yet</p>
        </div>
      )}

      {/* ── Content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left column — 2 spans */}
        <div className="lg:col-span-2 space-y-4">

          {/* Property overview */}
          <Section title="Property overview" icon={Home}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { icon: Home,  label: 'Type',      value: PROPERTY_LABELS[d.propertyType ?? ''] ?? d.propertyType ?? '—' },
                { icon: Users, label: 'Access',     value: ROOM_LABELS[d.roomType ?? '']   ?? d.roomType    ?? '—' },
                { icon: Users, label: 'Max guests', value: d.maxGuests != null ? `${d.maxGuests} guests` : '—' },
                { icon: Bed,   label: 'Bedrooms',   value: d.bedrooms  != null ? `${d.bedrooms} bd`      : '—' },
                { icon: Bed,   label: 'Beds',       value: d.beds      != null ? `${d.beds} beds`        : '—' },
                { icon: Bath,  label: 'Baths',      value: d.baths     != null ? `${d.baths} ba`         : '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <Icon className="h-4 w-4 text-gray-400 mb-1" />
                  <p className="text-[11px] text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Address */}
            {address && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
                <MapPin className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800">{address}</p>
              </div>
            )}
          </Section>

          {/* Title & description */}
          {(d.title || d.description) && (
            <Section title="Listing details" icon={Star}>
              {d.title && (
                <div className="mb-3">
                  <p className="text-[11px] text-gray-400 mb-1">Title</p>
                  <p className="text-base font-semibold text-gray-900">{d.title}</p>
                </div>
              )}
              {d.description && (
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{d.description}</p>
                </div>
              )}
            </Section>
          )}

          {/* Amenities */}
          {d.amenities && d.amenities.length > 0 && (
            <Section title={`Amenities (${d.amenities.length})`} icon={Tag}>
              <div className="flex flex-wrap gap-2">
                {d.amenities.map((slug) => (
                  <span
                    key={slug}
                    className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                  >
                    {slug.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Applicant */}
          <Section title="Applicant" icon={User}>
            <div className="flex items-center gap-3 mb-3">
              {app.user.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={app.user.profileImageUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500">
                  {app.user.firstName?.[0]}{app.user.lastName?.[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{app.user.firstName} {app.user.lastName}</p>
                <p className="text-xs text-gray-500">{app.user.email}</p>
              </div>
            </div>
            <DataRow label="Member since" value={new Date(app.user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} />
            <DataRow label="Application ID" value={<span className="font-mono text-[10px]">{app.id.slice(0, 16)}…</span>} />
            <DataRow label="Started" value={new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
          </Section>

          {/* Pricing */}
          <Section title="Pricing" icon={DollarSign}>
            <DataRow label="Base price / night" value={fmt(d.basePrice)} />
            <DataRow label="Cleaning fee"       value={d.cleaningFee ? fmt(d.cleaningFee) : 'None'} />
            <DataRow
              label="Cancellation"
              value={
                <span title={CANCELLATION_LABELS[d.cancellationPolicy ?? ''] ?? ''}>
                  {d.cancellationPolicy
                    ? d.cancellationPolicy.charAt(0).toUpperCase() + d.cancellationPolicy.slice(1)
                    : '—'}
                </span>
              }
            />
            {d.cancellationPolicy && (
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                {CANCELLATION_LABELS[d.cancellationPolicy]}
              </p>
            )}
          </Section>

          {/* Availability */}
          <Section title="Availability" icon={CalendarCheck}>
            <DataRow label="Check-in"     value={d.checkInTime  ?? '—'} />
            <DataRow label="Check-out"    value={d.checkOutTime ?? '—'} />
            <DataRow label="Min nights"   value={d.minNights != null  ? `${d.minNights} night${d.minNights !== 1 ? 's' : ''}` : '—'} />
            <DataRow label="Max nights"   value={d.maxNights != null  ? `${d.maxNights} nights` : 'No limit'} />
            <DataRow
              label="Instant Book"
              value={
                d.instantBook != null
                  ? <span className={d.instantBook ? 'text-green-600' : 'text-gray-400'}>
                      {d.instantBook ? 'Yes' : 'No'}
                    </span>
                  : '—'
              }
            />
          </Section>

        </div>
      </div>

      {/* ── Bottom action bar — sticky on scroll ── */}
      {isPending && (
        <div className="mt-8 sticky bottom-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Ready to decide?</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Approving grants the host role immediately. Rejecting notifies the applicant with your reason.
              </p>
            </div>
            <HostApplicationActions
              applicationId={app.id}
              onApprove={handleApprove}
              onReject={handleReject}
              size="lg"
            />
          </div>
        </div>
      )}

    </div>
  )
}
