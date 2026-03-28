import { getBookings } from '@/lib/api'

const STATUS_BADGE: Record<string, string> = {
  confirmed:         'bg-green-100 text-green-700',
  pending_payment:   'bg-yellow-100 text-yellow-700',
  completed:         'bg-blue-100 text-blue-700',
  guest_cancelled:   'bg-red-100 text-red-700',
  cancelled_by_host: 'bg-red-100 text-red-700',
  payment_failed:    'bg-orange-100 text-orange-700',
  disputed:          'bg-purple-100 text-purple-700',
}

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)

  let data = { bookings: [], total: 0, page: 1, limit: 20 } as Awaited<ReturnType<typeof getBookings>>
  try { data = await getBookings(page) } catch {}

  const totalPages = Math.ceil(data.total / data.limit)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 mt-0.5">{data.total} total</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Guest', 'Listing', 'Check-in', 'Check-out', 'Amount', 'Status'].map((col) => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-gray-400">No bookings found</td>
              </tr>
            ) : (
              data.bookings.map((b) => {
                const amount = (b.totalAmount / 100).toLocaleString('en-IN', { style: 'currency', currency: b.currency ?? 'INR', maximumFractionDigits: 0 })
                const checkIn  = new Date(b.checkIn).toLocaleDateString('en-IN',  { day: 'numeric', month: 'short', year: 'numeric' })
                const checkOut = new Date(b.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.guest.firstName} {b.guest.lastName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">{b.listing.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{checkIn}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{checkOut}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{amount}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
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
              <a href={`/bookings?page=${data.page - 1}`} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors">← Prev</a>
            )}
            {data.page < totalPages && (
              <a href={`/bookings?page=${data.page + 1}`} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors">Next →</a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
