import type { UserRole, VerificationStatus } from '@casalux/types'

interface UserRow {
  id: string
  name: string
  email: string
  role: UserRole
  verificationStatus: VerificationStatus
  createdAt: string
}

const MOCK_USERS: UserRow[] = []

const ROLE_BADGE: Record<UserRole, string> = {
  guest:       'bg-gray-100 text-gray-700',
  host:        'bg-blue-100 text-blue-700',
  admin:       'bg-purple-100 text-purple-700',
  super_admin: 'bg-red-100 text-red-700',
}

export default function UsersPage(): JSX.Element {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Email', 'Role', 'Verified', 'Joined'].map((col) => (
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
            {MOCK_USERS.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              MOCK_USERS.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.verificationStatus}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.createdAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
