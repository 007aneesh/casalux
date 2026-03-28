import { getListings } from '@/lib/api'

const STATUS_BADGE: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-700',
  active:   'bg-green-100 text-green-700',
  paused:   'bg-yellow-100 text-yellow-700',
  archived: 'bg-red-100 text-red-700',
  flagged:  'bg-orange-100 text-orange-700',
}

export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const { page: pageStr, status } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)

  let data = { listings: [], total: 0, page: 1, limit: 20 } as Awaited<ReturnType<typeof getListings>>
  try { data = await getListings(page, status) } catch {}

  const totalPages = Math.ceil(data.total / data.limit)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.total} total</p>
        </div>
        <div className="flex gap-2">
          {['', 'active', 'draft', 'paused', 'flagged', 'archived'].map((s) => (
            <a
              key={s}
              href={s ? `/listings?status=${s}` : '/listings'}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                (status ?? '') === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {s || 'All'}
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Title', 'Host', 'City', 'Price / night', 'Status'].map((col) => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.listings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-400">No listings found</td>
              </tr>
            ) : (
              data.listings.map((l) => {
                const city = (l.address as Record<string, string>)?.city ?? '—'
                const price = (l.basePrice / 100).toLocaleString('en-IN', { style: 'currency', currency: l.currency ?? 'INR', maximumFractionDigits: 0 })
                return (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">{l.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{l.host.user.firstName} {l.host.user.lastName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{city}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{price}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[l.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {l.status}
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
              <a href={`/listings?page=${data.page - 1}${status ? `&status=${status}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors">← Prev</a>
            )}
            {data.page < totalPages && (
              <a href={`/listings?page=${data.page + 1}${status ? `&status=${status}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors">Next →</a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
