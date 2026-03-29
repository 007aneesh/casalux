'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  bookingId:    string
  status:       string
  refundAmount: number | null
  refundStatus: string | null
  payoutStatus: string
  // Server actions
  onCancel:         (reason: string, refundAmount?: number) => Promise<void>
  onOverrideRefund: (refundAmount: number, refundStatus: string) => Promise<void>
  onOverridePayout: (payoutStatus: string) => Promise<void>
  onDispute:        (disputed: boolean, reason?: string) => Promise<void>
}

type Modal =
  | { type: 'cancel' }
  | { type: 'refund' }
  | { type: 'payout' }
  | { type: 'dispute' }
  | { type: 'resolve_dispute' }
  | null

const TERMINAL_STATUSES = new Set([
  'completed', 'guest_cancelled', 'cancelled_by_host',
  'cancelled_by_admin', 'host_declined', 'request_expired',
  'payment_window_expired', 'payment_expired',
])

const REFUND_STATUSES  = ['none', 'requested', 'partial', 'full', 'processed'] as const
const PAYOUT_STATUSES  = ['pending', 'initiated', 'settled'] as const

function ActionButton({
  onClick,
  disabled,
  variant = 'default',
  children,
}: {
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'danger' | 'success' | 'warning'
  children: React.ReactNode
}) {
  const styles = {
    default: 'border-gray-200 text-gray-700 hover:border-gray-400',
    danger:  'border-red-200 text-red-700 hover:border-red-400 hover:bg-red-50',
    success: 'border-green-200 text-green-700 hover:border-green-400 hover:bg-green-50',
    warning: 'border-yellow-200 text-yellow-700 hover:border-yellow-400 hover:bg-yellow-50',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-3 py-2 text-sm font-medium rounded-lg border transition-colors text-left
        disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      {children}
    </button>
  )
}

export default function BookingActions({
  status, refundAmount, refundStatus, payoutStatus,
  onCancel, onOverrideRefund, onOverridePayout, onDispute,
}: Props) {
  const router = useRouter()
  const [modal, setModal]                 = useState<Modal>(null)
  const [cancelReason, setCancelReason]   = useState('')
  const [cancelRefund, setCancelRefund]   = useState<string>('')
  const [newRefundAmt, setNewRefundAmt]   = useState<string>(refundAmount != null ? String(refundAmount / 100) : '')
  const [newRefundSt, setNewRefundSt]     = useState(refundStatus ?? 'none')
  const [newPayoutSt, setNewPayoutSt]     = useState(payoutStatus)
  const [disputeReason, setDisputeReason] = useState('')
  const [toast, setToast]                 = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [pending, startTransition]        = useTransition()

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function run(fn: () => Promise<void>, successMsg: string) {
    startTransition(async () => {
      try {
        await fn()
        setModal(null)
        showToast('success', successMsg)
        router.refresh()
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : 'Something went wrong.')
      }
    })
  }

  const isTerminal = TERMINAL_STATUSES.has(status)
  const isDisputed = status === 'disputed'

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Admin Actions</h2>
        </div>
        <div className="px-5 py-5 space-y-2">

          {/* Cancel */}
          <ActionButton
            variant="danger"
            disabled={pending || isTerminal}
            onClick={() => setModal({ type: 'cancel' })}
          >
            Cancel booking
          </ActionButton>

          {/* Dispute / Resolve */}
          {isDisputed ? (
            <ActionButton variant="success" disabled={pending} onClick={() => setModal({ type: 'resolve_dispute' })}>
              Resolve dispute
            </ActionButton>
          ) : (
            <ActionButton variant="warning" disabled={pending || isTerminal} onClick={() => setModal({ type: 'dispute' })}>
              Flag as disputed
            </ActionButton>
          )}

          {/* Refund override */}
          <ActionButton disabled={pending} onClick={() => {
            setNewRefundAmt(refundAmount != null ? String(refundAmount / 100) : '')
            setNewRefundSt(refundStatus ?? 'none')
            setModal({ type: 'refund' })
          }}>
            Override refund
          </ActionButton>

          {/* Payout override */}
          <ActionButton disabled={pending} onClick={() => {
            setNewPayoutSt(payoutStatus)
            setModal({ type: 'payout' })
          }}>
            Override payout status
          </ActionButton>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

            {/* Cancel modal */}
            {modal.type === 'cancel' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Cancel booking</h3>
                <p className="text-sm text-gray-500 mb-4">
                  This will mark the booking as <strong>cancelled_by_admin</strong>. Optionally set a refund amount.
                </p>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reason</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Policy violation, host unresponsive…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 mb-3"
                />
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Refund amount (₹, leave blank for no refund)
                </label>
                <input
                  type="number"
                  min="0"
                  value={cancelRefund}
                  onChange={(e) => setCancelRefund(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending}
                    onClick={() => run(
                      () => onCancel(cancelReason, cancelRefund ? Math.round(parseFloat(cancelRefund) * 100) : undefined),
                      'Booking cancelled.'
                    )}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                    {pending ? 'Cancelling…' : 'Cancel booking'}
                  </button>
                </div>
              </>
            )}

            {/* Dispute modal */}
            {modal.type === 'dispute' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Flag as disputed</h3>
                <p className="text-sm text-gray-500 mb-4">This will change the booking status to <strong>disputed</strong> and notify both parties.</p>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reason (optional)</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={3}
                  placeholder="Describe the nature of the dispute…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending}
                    onClick={() => run(() => onDispute(true, disputeReason), 'Booking flagged as disputed.')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60">
                    {pending ? 'Flagging…' : 'Flag dispute'}
                  </button>
                </div>
              </>
            )}

            {/* Resolve dispute modal */}
            {modal.type === 'resolve_dispute' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Resolve dispute</h3>
                <p className="text-sm text-gray-500 mb-4">This will move the booking back to <strong>confirmed</strong> and clear the dispute flag.</p>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending}
                    onClick={() => run(() => onDispute(false), 'Dispute resolved.')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60">
                    {pending ? 'Resolving…' : 'Mark resolved'}
                  </button>
                </div>
              </>
            )}

            {/* Refund override modal */}
            {modal.type === 'refund' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Override refund</h3>
                <p className="text-sm text-gray-500 mb-4">Manually set the refund amount and status. Enter amount in rupees.</p>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Refund amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newRefundAmt}
                  onChange={(e) => setNewRefundAmt(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 mb-3"
                />
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Refund status</label>
                <select
                  value={newRefundSt}
                  onChange={(e) => setNewRefundSt(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                >
                  {REFUND_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending || !newRefundAmt}
                    onClick={() => run(
                      () => onOverrideRefund(Math.round(parseFloat(newRefundAmt) * 100), newRefundSt),
                      'Refund updated.'
                    )}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60">
                    {pending ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            )}

            {/* Payout override modal */}
            {modal.type === 'payout' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Override payout status</h3>
                <p className="text-sm text-gray-500 mb-4">This updates both the booking and host earning records.</p>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Payout status</label>
                <select
                  value={newPayoutSt}
                  onChange={(e) => setNewPayoutSt(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                >
                  {PAYOUT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending || newPayoutSt === payoutStatus}
                    onClick={() => run(() => onOverridePayout(newPayoutSt), 'Payout status updated.')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60">
                    {pending ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}
