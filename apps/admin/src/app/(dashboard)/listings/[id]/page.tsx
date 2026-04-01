import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getListing, updateListingStatus } from '@/lib/api'
import ListingActions from '@/components/listings/ListingActions'

const STATUS_BADGE: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-700',
  active:   'bg-green-100 text-green-700',
  paused:   'bg-yellow-100 text-yellow-700',
  archived: 'bg-red-100 text-red-700',
  flagged:  'bg-orange-100 text-orange-700',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-gray-800">{value ?? <span className="text-gray-400 italic">—</span>}</dd>
    </div>
  )
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let listing
  try { listing = await getListing(id) } catch { notFound() }
  if (!listing) notFound()

  async function handleStatusChange(status: string, _reason?: string) {
    'use server'
    await updateListingStatus(id, status)
    revalidatePath(`/listings/${id}`)
    revalidatePath('/listings')
  }

  const price = (listing.basePrice / 100).toLocaleString('en-IN', {
    style: 'currency', currency: listing.currency ?? 'INR', maximumFractionDigits: 0,
  })
  const cleaningFee = (listing.cleaningFee / 100).toLocaleString('en-IN', {
    style: 'currency', currency: listing.currency ?? 'INR', maximumFractionDigits: 0,
  })

  return (
    <div className="max-w-7xl">
      {/* Back + header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <Link
            href="/listings"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors mb-2 inline-flex items-center gap-1"
          >
            ← All listings
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">{listing.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[listing.status] ?? 'bg-gray-100 text-gray-700'}`}>
              {listing.status}
            </span>
            <span className="text-xs text-gray-400">ID: {listing.id}</span>
            {listing.instantBook && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                ⚡ Instant Book
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/listings/${id}/edit`}
          className="shrink-0 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Edit listing
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — all listing detail */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-6">

        {/* Cover image row */}
        {listing.images && listing.images.length > 0 && (
          <Section title={`Images (${listing.images.length})`}>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[...listing.images]
                .sort((a, b) => a.order - b.order)
                .map((img, idx) => (
                  <div key={img.publicId ?? idx} className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`Image ${idx + 1}`}
                      className="h-36 w-52 object-cover rounded-lg border border-gray-100"
                    />
                    {img.isPrimary && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-900 text-white">
                        Primary
                      </span>
                    )}
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] bg-black/50 text-white">
                      #{img.order + 1}
                    </span>
                  </div>
                ))}
            </div>
          </Section>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Basic Info */}
          <Section title="Basic Information">
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Property Type" value={listing.propertyType} />
              <Field label="Room Type" value={listing.roomType?.replace('_', ' ')} />
              <div className="col-span-2">
                <Field label="Description" value={
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-4 whitespace-pre-line">
                    {listing.description}
                  </p>
                } />
              </div>
              <Field label="Avg Rating" value={listing.avgRating ? `${listing.avgRating.toFixed(1)} ★` : '—'} />
              <Field label="Total Reviews" value={listing.totalReviews} />
              <Field label="Created" value={new Date(listing.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
              <Field label="Updated" value={new Date(listing.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
            </dl>
          </Section>

          {/* Location */}
          <Section title="Location">
            <dl className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Street" value={listing.address?.street} />
              </div>
              <Field label="City" value={listing.address?.city} />
              <Field label="State" value={listing.address?.state} />
              <Field label="Country" value={listing.address?.country} />
              <Field label="ZIP" value={listing.address?.zip} />
              <Field label="Latitude" value={listing.lat} />
              <Field label="Longitude" value={listing.lng} />
            </dl>
          </Section>

          {/* Capacity */}
          <Section title="Capacity & Layout">
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Max Guests" value={listing.maxGuests} />
              <Field label="Bedrooms" value={listing.bedrooms} />
              <Field label="Beds" value={listing.beds} />
              <Field label="Bathrooms" value={listing.baths} />
            </dl>
          </Section>

          {/* Pricing */}
          <Section title="Pricing">
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Base Price / night" value={price} />
              <Field label="Cleaning Fee" value={cleaningFee} />
              <Field label="Currency" value={listing.currency} />
            </dl>
          </Section>

          {/* House Rules */}
          <Section title="House Rules">
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Min Nights" value={listing.minNights} />
              <Field label="Max Nights" value={listing.maxNights ?? 'No limit'} />
              <Field label="Check-in Time" value={listing.checkInTime} />
              <Field label="Check-out Time" value={listing.checkOutTime} />
              <Field label="Cancellation Policy" value={listing.cancellationPolicy} />
              <Field label="Instant Book" value={listing.instantBook ? '✅ Yes' : '❌ No'} />
            </dl>
          </Section>

          {/* Guest Requirements */}
          <Section title="Guest Requirements">
            <dl className="grid grid-cols-1 gap-3">
              <Field label="Verified ID" value={listing.requireVerifiedId ? '✅ Required' : '❌ Not required'} />
              <Field label="Profile Photo" value={listing.requireProfilePhoto ? '✅ Required' : '❌ Not required'} />
              <Field label="Positive Reviews" value={listing.requirePositiveReviews ? '✅ Required' : '❌ Not required'} />
            </dl>
          </Section>
        </div>

        {/* Amenities */}
        {listing.amenities && listing.amenities.length > 0 && (
          <Section title={`Amenities (${listing.amenities.length})`}>
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map((a) => (
                <span key={a} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {a.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </Section>
        )}

        </div>{/* end left column */}

        {/* Right column — admin actions */}
        <div className="space-y-4">
          <ListingActions
            listingId={id}
            currentStatus={listing.status}
            onStatusChange={handleStatusChange}
          />

          {/* Host quick info */}
          <Section title="Host">
            <dl className="grid grid-cols-1 gap-3">
              <Field label="Name" value={`${listing.host.user.firstName} ${listing.host.user.lastName}`} />
              <Field label="Email" value={listing.host.user.email} />
              {listing.host.isSuperhost && (
                <Field label="Superhost" value="⭐ Yes" />
              )}
              <Field label="Response rate" value={`${listing.host.responseRate.toFixed(0)}%`} />
            </dl>
            <div className="mt-3">
              <Link
                href={`/users/${listing.host.user.id}`}
                className="text-xs text-blue-600 hover:underline"
              >
                View host profile →
              </Link>
            </div>
          </Section>
        </div>

      </div>
    </div>
  )
}
