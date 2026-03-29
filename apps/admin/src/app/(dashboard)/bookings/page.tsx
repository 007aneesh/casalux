import Link from 'next/link'
import { getBookings } from '@/lib/api'

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

const STATUSES = [
  { value: '',                       label: 'All' },
  { value: 'confirmed',              label: 'Confirmed' },
  { value: 'pending_payment',        label: 'Pending payment' },
  { value: 'completed',              label: 'Completed' },
  { value: 'disputed',               label: 'Disputed' },
  { value: 'guest_cancelled',        label: 'Guest cancelled' },
  { value: 'cancelled_by_host',      label: 'Host cancelled' },
  { value: 'cancelled_by_admin',     label: 'Admin cancelled' },
  { value: 'payment_failed',         label: 'Payment failed' },
]

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; from?: string; to?: string }>
}) {
  const { page: pageStr, status, from, to } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))

  let data = { bookings: [], total: 0, page: 1, limit: 20 } as Awaited<ReturnType<typeof getBookings>>
  try { data = await getBookings(page, status, from, to) } catch {}

  const totalPages = Math.ceil(data.total / data.limit)

  function paginationHref(p: number) {
    const qs = new URLSearchParams({ page: String(p) })
    if (status) qs.set('status', status)
    if (from)   qs.set('from', from)
    if (to)     qs.set('to', to)
    return `/bookings?${qs}`
  }

  function statusHref(s: string) {
    const qs = new URLSearchParams()
    if (s) qs.set('status', s)
    if (from) qs.set('from', from)
    if (to)   qs.set('to', to)
    return `/bookings${qs.toString() ? `?${qs}` : ''}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.total} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={statusHref(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              (status ?? '') === s.value
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Guest', 'Listing', 'Check-in', 'Check-out', 'Nights', 'Amount', 'Status', ''].map((col) => (
                <th key={col} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-gray-400">No bookings found</td>
              </tr>
            ) : (
              data.bookings.map((b) => {
                const amount   = (b.totalAmount / 100).toLocaleString('en-IN', { style: 'currency', currency: b.currency ?? 'INR', maximumFractionDigits: 0 })
                const checkIn  = new Date(b.checkIn).toLocaleDateString('en-IN',  { day: 'numeric', month: 'short', year: 'numeric' })
                const checkOut = new Date(b.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                const nights   = Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86_400_000)
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-gray-900">{b.guest.firstName} {b.guest.lastName}</div>
                      <div className="text-xs text-gray-400">{b.guest.email}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 max-w-[180px] truncate">{b.listing.title}</td>
                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{checkIn}</td>
                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{checkOut}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{nights}n</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">{amount}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {data.page} of {totalPages}</span>
          <div className="flex gap-2">
            {data.page > 1 && (
              <Link href={paginationHref(data.page - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors">← Prev</Link>
            )}
            {data.page < totalPages && (
              <Link href={paginationHref(data.page + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors">Next →</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
