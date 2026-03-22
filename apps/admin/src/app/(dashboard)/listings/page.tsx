import type { ListingStatus } from '@casalux/types'

interface ListingRow {
  id: string
  title: string
  host: string
  status: ListingStatus
  city: string
  pricePerNight: number
}

// Placeholder — will be replaced with real API calls once admin API client is wired up
const MOCK_LISTINGS: ListingRow[] = []

const STATUS_BADGE: Record<ListingStatus, string> = {
  draft:    'bg-gray-100 text-gray-700',
  active:   'bg-green-100 text-green-700',
  paused:   'bg-yellow-100 text-yellow-700',
  archived: 'bg-red-100 text-red-700',
  flagged:  'bg-orange-100 text-orange-700',
}

export default function ListingsPage(): JSX.Element {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Title', 'Host', 'City', 'Price / night', 'Status'].map((col) => (
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
            {MOCK_LISTINGS.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No listings found
                </td>
              </tr>
            ) : (
              MOCK_LISTINGS.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{listing.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{listing.host}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{listing.city}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">${listing.pricePerNight}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[listing.status]}`}
                    >
                      {listing.status}
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
