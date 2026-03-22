import type { BookingStatus } from '@casalux/types'

interface BookingRow {
  id: string
  guestName: string
  listingTitle: string
  checkIn: string
  checkOut: string
  status: BookingStatus
  totalAmount: number
}

const MOCK_BOOKINGS: BookingRow[] = []

const STATUS_BADGE: Partial<Record<BookingStatus, string>> & { default: string } = {
  confirmed:    'bg-green-100 text-green-700',
  pending_payment: 'bg-yellow-100 text-yellow-700',
  completed:    'bg-blue-100 text-blue-700',
  guest_cancelled:  'bg-red-100 text-red-700',
  cancelled_by_host: 'bg-red-100 text-red-700',
  payment_failed: 'bg-orange-100 text-orange-700',
  disputed:     'bg-purple-100 text-purple-700',
  default:      'bg-gray-100 text-gray-700',
}

function getBadgeClass(status: BookingStatus): string {
  return STATUS_BADGE[status] ?? STATUS_BADGE.default
}

export default function BookingsPage(): JSX.Element {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Guest', 'Listing', 'Check-in', 'Check-out', 'Amount', 'Status'].map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {MOCK_BOOKINGS.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No bookings found
                </td>
              </tr>
            ) : (
              MOCK_BOOKINGS.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.guestName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{booking.listingTitle}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{booking.checkIn}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{booking.checkOut}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">${booking.totalAmount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeClass(booking.status)}`}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
