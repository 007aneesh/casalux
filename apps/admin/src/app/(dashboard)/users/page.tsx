import Link from 'next/link'
import { getUsers } from '@/lib/api'

const ROLE_BADGE: Record<string, string> = {
  guest:       'bg-gray-100 text-gray-700',
  host:        'bg-blue-100 text-blue-700',
  admin:       'bg-purple-100 text-purple-700',
  super_admin: 'bg-red-100 text-red-700',
}

const VERIFY_BADGE: Record<string, string> = {
  unverified: 'bg-gray-100 text-gray-500',
  verified:   'bg-green-100 text-green-700',
}

const ROLES = ['', 'guest', 'host', 'admin']

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; role?: string }>
}) {
  const { page: pageStr, role } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)

  let data = { users: [], total: 0, page: 1, limit: 20 } as Awaited<ReturnType<typeof getUsers>>
  try { data = await getUsers(page, role) } catch {}

  const totalPages = Math.ceil(data.total / data.limit)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.total} total</p>
        </div>
        <div className="flex gap-2">
          {ROLES.map((r) => (
            <Link
              key={r}
              href={r ? `/users?role=${r}` : '/users'}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                (role ?? '') === r
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {r || 'All'}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['User', 'Role', 'Verified', 'Status', 'Joined', ''].map((col) => (
                <th key={col} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-gray-400">No users found</td>
              </tr>
            ) : (
              data.users.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${u.deletedAt ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${VERIFY_BADGE[u.verificationStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                      {u.verificationStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {u.deletedAt ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">deleted</span>
                    ) : u.isBanned ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">banned</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">active</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Link
                      href={`/users/${u.id}`}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {data.page} of {totalPages}</span>
          <div className="flex gap-2">
            {data.page > 1 && (
              <Link href={`/users?page=${data.page - 1}${role ? `&role=${role}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors">← Prev</Link>
            )}
            {data.page < totalPages && (
              <Link href={`/users?page=${data.page + 1}${role ? `&role=${role}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors">Next →</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
