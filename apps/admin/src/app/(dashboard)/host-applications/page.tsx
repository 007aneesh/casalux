import type { HostApplicationStatus } from '@casalux/types'

interface HostApplicationRow {
  id: string
  applicantName: string
  email: string
  status: HostApplicationStatus
  submittedAt: string
}

const MOCK_APPLICATIONS: HostApplicationRow[] = []

const STATUS_BADGE: Record<HostApplicationStatus, string> = {
  in_progress:   'bg-gray-100 text-gray-700',
  submitted:     'bg-yellow-100 text-yellow-700',
  approved:      'bg-green-100 text-green-700',
  auto_approved: 'bg-blue-100 text-blue-700',
  rejected:      'bg-red-100 text-red-700',
}

export default function HostApplicationsPage(): JSX.Element {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Host Applications</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Applicant', 'Email', 'Status', 'Submitted'].map((col) => (
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
            {MOCK_APPLICATIONS.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                  No applications found
                </td>
              </tr>
            ) : (
              MOCK_APPLICATIONS.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{app.applicantName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[app.status]}`}>
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.submittedAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
