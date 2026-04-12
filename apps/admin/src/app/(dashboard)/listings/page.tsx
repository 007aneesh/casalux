import Link from 'next/link'
import { getListings } from '@/lib/api'
import { DeleteListingButton } from '@/components/listings/DeleteListingButton'

const STATUS_BADGE: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-700',
  active:   'bg-green-100 text-green-700',
  paused:   'bg-yellow-100 text-yellow-700',
  archived: 'bg-red-100 text-red-700',
  flagged:  'bg-orange-100 text-orange-700',
}

const STATUSES = ['', 'active', 'draft', 'paused', 'flagged', 'archived']

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { page: pageStr, status } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)

  let data = { listings: [], total: 0, page: 1, limit: 20 } as Awaited<ReturnType<typeof getListings>>
  try { data = await getListings(page, status) } catch {}

  const totalPages = Math.ceil(data.total / data.limit)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.total} total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={s ? `/listings?status=${s}` : '/listings'}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                (status ?? '') === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Title', 'Host', 'City', 'Price / night', 'Status', 'Created', 'Actions'].map((col) => (
                <th
                  key={col}
                  className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.listings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  No listings found
                </td>
              </tr>
            ) : (
              data.listings.map((l) => {
                const city    = (l.address as Record<string, string> | null)?.city ?? '—'
                const price   = (l.basePrice / 100).toLocaleString('en-IN', {
                  style: 'currency', currency: l.currency ?? 'INR', maximumFractionDigits: 0,
                })
                const created = new Date(l.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })
                // Guard: host or user relation missing (bad seed / orphaned FK)
                const hostName  = l.host?.user
                  ? `${l.host.user.firstName} ${l.host.user.lastName}`.trim()
                  : '—'
                const hostEmail = l.host?.user?.email ?? '—'

                return (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-gray-900 max-w-xs">
                      <Link href={`/listings/${l.id}`} className="hover:underline line-clamp-1">
                        {l.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                      <div className="font-medium">{hostName}</div>
                      <div className="text-xs text-gray-400">{hostEmail}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{city}</td>
                    <td className="px-5 py-4 text-sm text-gray-700 font-medium whitespace-nowrap">{price}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[l.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">{created}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/listings/${l.id}`}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          href={`/listings/${l.id}/edit`}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-900 text-white hover:bg-gray-700 transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteListingButton id={l.id} title={l.title} />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {data.page} of {totalPages}</span>
          <div className="flex gap-2">
            {data.page > 1 && (
              <Link
                href={`/listings?page=${data.page - 1}${status ? `&status=${status}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
              >
                ← Prev
              </Link>
            )}
            {data.page < totalPages && (
              <Link
                href={`/listings?page=${data.page + 1}${status ? `&status=${status}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
