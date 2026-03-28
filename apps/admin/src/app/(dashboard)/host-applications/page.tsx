'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react'

interface Application {
  id: string
  status: string
  submittedAt: string | null
  user: { firstName: string; lastName: string; email: string }
}

const STATUS_BADGE: Record<string, string> = {
  in_progress:   'bg-gray-100 text-gray-700',
  submitted:     'bg-yellow-100 text-yellow-700',
  approved:      'bg-green-100 text-green-700',
  auto_approved: 'bg-blue-100 text-blue-700',
  rejected:      'bg-red-100 text-red-700',
}

export default function HostApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/host-applications')
      const data = await res.json()
      setApplications(data.applications ?? [])
    } catch {
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const approve = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`/api/host-applications/${id}/approve`, { method: 'POST' })
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  const reject = async () => {
    if (!rejectModal || !rejectReason.trim()) return
    setActionLoading(rejectModal.id)
    try {
      await fetch(`/api/host-applications/${rejectModal.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      setRejectModal(null)
      setRejectReason('')
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Host Applications</h1>
        <p className="text-sm text-gray-500 mt-0.5">{applications.length} applications</p>
      </div>

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
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400">Loading…</td></tr>
            ) : applications.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400">No applications found</td></tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {app.user.firstName} {app.user.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[app.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {app.submittedAt
                      ? new Date(app.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {app.status === 'submitted' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approve(app.id)}
                          disabled={actionLoading === app.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ id: app.id })}
                          disabled={actionLoading === app.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Reject application</h2>
            <p className="text-sm text-gray-500 mb-4">Provide a reason that will be sent to the applicant.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Reason for rejection (min 10 characters)…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={rejectReason.trim().length < 10 || !!actionLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
