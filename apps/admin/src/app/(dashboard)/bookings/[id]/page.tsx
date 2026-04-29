import { notFound } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import {
  getBookingDetail,
  cancelBooking,
  overrideBookingRefund,
  overrideBookingPayout,
  overrideBookingStatus,
  setBookingDispute,
} from '@/lib/api'
import BookingActions from '@/components/bookings/BookingActions'

const STATUS_BADGE: Record<string, string> = {
  pending_request:        'bg-gray-100 text-gray-600',
  host_approved:          'bg-yellow-100 text-yellow-700',
  pending_payment:        'bg-yellow-100 text-yellow-700',
  confirmed:              'bg-green-100 text-green-700',
  completed:              'bg-blue-100 text-blue-700',
  host_declined:          'bg-red-100 text-red-600',
  guest_cancelled:        'bg-red-100 text-red-600',
  cancelled_by_host:      'bg-red-100 text-red-600',
  cancelled_by_admin:     'bg-red-100 text-red-700',
  request_expired:        'bg-gray-100 text-gray-500',
  payment_window_expired: 'bg-gray-100 text-gray-500',
  payment_failed:         'bg-orange-100 text-orange-700',
  payment_expired:        'bg-orange-100 text-orange-600',
  disputed:               'bg-purple-100 text-purple-700',
}

const PAYOUT_BADGE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  initiated: 'bg-blue-100 text-blue-700',
  settled:   'bg-green-100 text-green-700',
}

const REFUND_BADGE: Record<string, string> = {
  none:      'bg-gray-100 text-gray-500',
  requested: 'bg-yellow-100 text-yellow-700',
  partial:   'bg-orange-100 text-orange-700',
  full:      'bg-blue-100 text-blue-700',
  processed: 'bg-green-100 text-green-700',
}

function fmt(amount: number, currency = 'INR') {
  return (amount / 100).toLocaleString('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 })
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0 w-40">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let booking: Awaited<ReturnType<typeof getBookingDetail>>

  try {
    booking = await getBookingDetail(id)
  } catch {
    notFound()
  }

  // Server actions
  async function handleCancel(reason: string, refundAmount?: number) {
    'use server'
    await cancelBooking(id, reason, refundAmount)
    revalidatePath(`/bookings/${id}`)
    revalidatePath('/bookings')
  }

  async function handleOverrideRefund(refundAmount: number, refundStatus: string) {
    'use server'
    await overrideBookingRefund(id, refundAmount, refundStatus)
    revalidatePath(`/bookings/${id}`)
  }

  async function handleOverridePayout(payoutStatus: string) {
    'use server'
    await overrideBookingPayout(id, payoutStatus)
    revalidatePath(`/bookings/${id}`)
  }

  async function handleDispute(disputed: boolean, reason?: string) {
    'use server'
    await setBookingDispute(id, disputed, reason)
    revalidatePath(`/bookings/${id}`)
    revalidatePath('/bookings')
  }

  async function handleOverrideStatus(status: string, reason?: string) {
    'use server'
    await overrideBookingStatus(id, status, reason)
    revalidatePath(`/bookings/${id}`)
    revalidatePath('/bookings')
  }

  const g = booking.guest
  const h = booking.hostProfile
  const l = booking.listing

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/bookings" className="hover:text-gray-700 transition-colors">Bookings</Link>
            <span>/</span>
            <span className="font-mono text-xs">{id.slice(0, 12)}…</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{l.title}</h1>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[booking.status] ?? 'bg-gray-100 text-gray-700'}`}>
              {booking.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} · {booking.nights} nights · {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Pricing breakdown */}
          <Section title="Pricing breakdown">
            <DetailRow label="Base subtotal"     value={fmt(booking.baseSubtotal, booking.currency)} />
            {booking.discountAmount > 0 && (
              <DetailRow label="Discount"         value={<span className="text-green-600">−{fmt(booking.discountAmount, booking.currency)}</span>} />
            )}
            {booking.cleaningFee > 0 && (
              <DetailRow label="Cleaning fee"     value={fmt(booking.cleaningFee, booking.currency)} />
            )}
            <DetailRow label="Service fee"        value={fmt(booking.platformServiceFee, booking.currency)} />
            {booking.taxes > 0 && (
              <DetailRow label="Taxes"            value={fmt(booking.taxes, booking.currency)} />
            )}
            <DetailRow label="Total charged"      value={<strong>{fmt(booking.totalAmount, booking.currency)}</strong>} />
            <DetailRow label="Host payout"        value={fmt(booking.hostPayout, booking.currency)} />
          </Section>

          {/* Payment */}
          <Section title="Payment">
            <DetailRow label="Provider"           value={booking.paymentProvider} />
            <DetailRow label="Order ID"           value={<span className="font-mono text-xs">{booking.paymentOrderId}</span>} />
            {booking.paymentId && (
              <DetailRow label="Payment ID"       value={<span className="font-mono text-xs">{booking.paymentId}</span>} />
            )}
            <DetailRow label="Payout status"      value={
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${PAYOUT_BADGE[booking.payoutStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                {booking.payoutStatus}
              </span>
            } />
            {booking.payoutId && (
              <DetailRow label="Payout ID"        value={<span className="font-mono text-xs">{booking.payoutId}</span>} />
            )}
          </Section>

          {/* Refund */}
          <Section title="Refund">
            <DetailRow label="Refund status"      value={
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${REFUND_BADGE[booking.refundStatus ?? 'none'] ?? 'bg-gray-100 text-gray-700'}`}>
                {booking.refundStatus ?? 'none'}
              </span>
            } />
            <DetailRow label="Refund amount"      value={booking.refundAmount != null ? fmt(booking.refundAmount, booking.currency) : '—'} />
            {booking.cancellationReason && (
              <DetailRow label="Cancel reason"    value={booking.cancellationReason} />
            )}
            {booking.cancelledBy && (
              <DetailRow label="Cancelled by"     value={booking.cancelledBy} />
            )}
            {booking.hostCancellationPenalty != null && (
              <DetailRow label="Host penalty"     value={fmt(booking.hostCancellationPenalty, booking.currency)} />
            )}
          </Section>

          {/* Host earning */}
          {booking.hostEarning && (
            <Section title="Host earning">
              <DetailRow label="Amount"           value={fmt(booking.hostEarning.amount, booking.hostEarning.currency)} />
              <DetailRow label="Payout status"    value={
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${PAYOUT_BADGE[booking.hostEarning.payoutStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                  {booking.hostEarning.payoutStatus}
                </span>
              } />
              {booking.hostEarning.payoutId && (
                <DetailRow label="Payout ID"      value={<span className="font-mono text-xs">{booking.hostEarning.payoutId}</span>} />
              )}
              {booking.hostEarning.payoutDate && (
                <DetailRow label="Payout date"    value={fmtDate(booking.hostEarning.payoutDate)} />
              )}
            </Section>
          )}

          {/* Review */}
          {booking.review && (
            <Section title="Guest review">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={i <= booking.review!.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                ))}
                <span className="ml-1 text-sm font-medium text-gray-700">{booking.review.rating}/5</span>
              </div>
              {booking.review.comment && (
                <p className="text-sm text-gray-600 italic mb-3">"{booking.review.comment}"</p>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                {[
                  ['Cleanliness', booking.review.cleanliness],
                  ['Accuracy',    booking.review.accuracy],
                  ['Location',    booking.review.location],
                  ['Check-in',    booking.review.checkIn],
                  ['Value',       booking.review.value],
                ].filter(([, v]) => v != null).map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between">
                    <span className="font-medium">{k}</span>
                    <span>{v}/5</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">{fmtDate(booking.review.createdAt)}</p>
            </Section>
          )}

          {/* Payment events */}
          {booking.paymentEvents.length > 0 && (
            <Section title="Payment events">
              <div className="space-y-2">
                {booking.paymentEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between text-xs text-gray-600 py-1.5 border-b border-gray-50 last:border-0">
                    <span className="font-mono">{ev.eventType}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${ev.status === 'processed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {ev.status}
                      </span>
                      <span className="text-gray-400">{fmtDate(ev.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Booking actions */}
          <BookingActions
            bookingId={id}
            status={booking.status}
            refundAmount={booking.refundAmount}
            refundStatus={booking.refundStatus}
            payoutStatus={booking.payoutStatus}
            onCancel={handleCancel}
            onOverrideRefund={handleOverrideRefund}
            onOverridePayout={handleOverridePayout}
            onOverrideStatus={handleOverrideStatus}
            onDispute={handleDispute}
          />

          {/* Guest */}
          <Section title="Guest">
            <div className="flex items-center gap-3 mb-3">
              {g.profileImageUrl ? (
                <img src={g.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-semibold">
                  {g.firstName?.[0]}{g.lastName?.[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{g.firstName} {g.lastName}</p>
                <p className="text-xs text-gray-400">{g.email}</p>
              </div>
            </div>
            <DetailRow label="Verification" value={
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${g.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {g.verificationStatus}
              </span>
            } />
            <div className="mt-2">
              <Link href={`/users/${g.id}`} className="text-xs text-blue-600 hover:underline">View user profile →</Link>
            </div>
          </Section>

          {/* Host */}
          {h && (
            <Section title="Host">
              <div className="flex items-center gap-3 mb-3">
                {h.user.profileImageUrl ? (
                  <img src={h.user.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-semibold">
                    {h.user.firstName?.[0]}{h.user.lastName?.[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">{h.user.firstName} {h.user.lastName}</p>
                  <p className="text-xs text-gray-400">{h.user.email}</p>
                </div>
              </div>
              {h.isSuperhost && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 mb-2">Superhost</span>
              )}
              <div className="mt-2">
                <Link href={`/users/${h.user.id}`} className="text-xs text-blue-600 hover:underline">View user profile →</Link>
              </div>
            </Section>
          )}

          {/* Listing */}
          <Section title="Listing">
            <p className="text-sm font-semibold text-gray-900 mb-1">{l.title}</p>
            {l.address && (
              <p className="text-xs text-gray-500 mb-2">
                {[l.address['street'], l.address['city'], l.address['state']].filter(Boolean).join(', ')}
              </p>
            )}
            <p className="text-xs text-gray-500 mb-2">{fmt(l.basePrice, l.currency)} / night</p>
            <Link href={`/listings/${l.id}`} className="text-xs text-blue-600 hover:underline">View listing →</Link>
          </Section>

          {/* Metadata */}
          <Section title="Details">
            <DetailRow label="Booking ID"    value={<span className="font-mono text-xs">{id}</span>} />
            <DetailRow label="Created"       value={fmtDate(booking.createdAt)} />
            <DetailRow label="Updated"       value={fmtDate(booking.updatedAt)} />
            <DetailRow label="Verified ID"   value={booking.guestVerifiedAtBooking ? 'Yes' : 'No'} />
            <DetailRow label="Agreed rules"  value={booking.agreedToHouseRules ? 'Yes' : 'No'} />
          </Section>
        </div>
      </div>
    </div>
  )
}
