'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

interface Props {
  applicationId: string
  onApprove: (id: string) => Promise<void>
  onReject:  (id: string, reason: string) => Promise<void>
  size?:     'sm' | 'lg'
}

export default function HostApplicationActions({ applicationId, onApprove, onReject, size = 'sm' }: Props) {
  const isLg = size === 'lg'
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [reason, setReason]                   = useState('')
  const [toast, setToast]                     = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [pending, startTransition]            = useTransition()

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  function handleApprove() {
    startTransition(async () => {
      try {
        await onApprove(applicationId)
        showToast('success', 'Application approved. Host role granted.')
      } catch {
        showToast('error', 'Failed to approve. Please try again.')
      }
    })
  }

  function handleReject() {
    if (reason.trim().length < 10) return
    startTransition(async () => {
      try {
        await onReject(applicationId, reason.trim())
        setShowRejectModal(false)
        setReason('')
        showToast('success', 'Application rejected.')
      } catch {
        showToast('error', 'Failed to reject. Please try again.')
      }
    })
  }

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border
          ${toast.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
          }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleApprove}
          disabled={pending}
          className={`flex items-center gap-1.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50
            ${isLg ? 'px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-xs'}`}
        >
          <CheckCircle className={isLg ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
          Approve
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={pending}
          className={`flex items-center gap-1.5 rounded-lg bg-white border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50
            ${isLg ? 'px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-xs'}`}
        >
          <XCircle className={isLg ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
          Reject
        </button>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Reject application</h2>
            <p className="text-sm text-gray-500 mb-4">
              Provide a clear reason — it will be shown to the applicant and logged in the audit trail.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="e.g. Incomplete documentation. Please re-apply with a valid ID and at least one listing ready to publish…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{reason.trim().length} / 10 min</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setReason('') }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={reason.trim().length < 10 || pending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {pending ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
