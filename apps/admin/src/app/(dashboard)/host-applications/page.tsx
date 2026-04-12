import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { getHostApplications, approveHostApplication, rejectHostApplication } from '@/lib/api'
import HostApplicationActions from '@/components/host-applications/HostApplicationActions'

const STATUS_BADGE: Record<string, string> = {
  in_progress:   'bg-gray-100 text-gray-700',
  submitted:     'bg-yellow-100 text-yellow-700',
  approved:      'bg-green-100 text-green-700',
  auto_approved: 'bg-blue-100 text-blue-700',
  rejected:      'bg-red-100 text-red-700',
}

const STATUS_FILTERS = [
  { label: 'All',          value: ''            },
  { label: 'Pending',      value: 'submitted'   },
  { label: 'Approved',     value: 'approved'    },
  { label: 'Rejected',     value: 'rejected'    },
  { label: 'In progress',  value: 'in_progress' },
]

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function HostApplicationsPage({ searchParams }: PageProps) {
  const { status: statusFilter } = await searchParams

  let applications: Awaited<ReturnType<typeof getHostApplications>>['applications'] = []
  try {
    const res = await getHostApplications(statusFilter)
    applications = res.applications ?? []
  } catch {}

  const pendingCount = statusFilter
    ? 0
    : applications.filter((a) => a.status === 'submitted').length

  // ── Server actions ────────────────────────────────────────────────────────────
  async function handleApprove(id: string) {
    'use server'
    await approveHostApplication(id)
    revalidatePath('/host-applications')
  }

  async function handleReject(id: string, reason: string) {
    'use server'
    await rejectHostApplication(id, reason)
    revalidatePath('/host-applications')
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Host Applications</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {applications.length} application{applications.length !== 1 ? 's' : ''}
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
              {pendingCount} pending review
            </span>
          )}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_FILTERS.map(({ label, value }) => {
          const isActive = (statusFilter ?? '') === value
          return (
            <Link
              key={value || 'all'}
              href={value ? `/host-applications?status=${value}` : '/host-applications'}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {label}
              {value === 'submitted' && pendingCount > 0 && !statusFilter && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-[10px] bg-amber-500 text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Applicant', 'Email', 'Status', 'Submitted', 'Actions'].map((col) => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                  {statusFilter
                    ? `No ${statusFilter.replace('_', ' ')} applications.`
                    : 'No host applications yet.'}
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {app.user.firstName} {app.user.lastName}
                    </p>
                    <Link
                      href={`/users/${app.user.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View profile →
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[app.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {app.submittedAt
                      ? new Date(app.submittedAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/host-applications/${app.id}`}
                        className="text-xs font-medium text-gray-700 hover:text-gray-900 underline underline-offset-2"
                      >
                        Review →
                      </Link>
                      {app.status === 'submitted' && (
                        <HostApplicationActions
                          applicationId={app.id}
                          onApprove={handleApprove}
                          onReject={handleReject}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PM context note */}
      {!statusFilter && pendingCount > 0 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-medium text-amber-800">
            {pendingCount} application{pendingCount !== 1 ? 's' : ''} awaiting review
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Approved applicants are immediately granted the host role and can publish listings.
            Rejected applicants are notified with your reason and may re-apply.
          </p>
        </div>
      )}
    </div>
  )
}
