'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, Pause, Archive, RotateCcw, AlertTriangle } from 'lucide-react'

interface Props {
  listingId:    string
  currentStatus: string
  onStatusChange: (status: string, reason?: string) => Promise<void>
}

const FLAG_REASONS = [
  'Misleading listing content',
  'Policy violation',
  'Safety concern reported by guest',
  'Fraudulent pricing or fees',
  'Inappropriate content or photos',
  'Host unresponsive / booking issues',
  'Other',
] as const

type ActionType = 'flag' | 'suspend' | 'archive' | 'restore' | 'unflag' | null

function ActionButton({
  onClick,
  disabled,
  variant = 'default',
  icon: Icon,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'danger' | 'warning' | 'success'
  icon: React.ElementType
  children: React.ReactNode
}) {
  const styles = {
    default: 'border-gray-200 text-gray-700 hover:border-gray-400',
    danger:  'border-red-200 text-red-700 hover:border-red-400 hover:bg-red-50',
    warning: 'border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50',
    success: 'border-green-200 text-green-700 hover:border-green-400 hover:bg-green-50',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors text-left
        disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {children}
    </button>
  )
}

export default function ListingActions({ listingId, currentStatus, onStatusChange }: Props) {
  const router = useRouter()
  const [action, setAction]           = useState<ActionType>(null)
  const [flagReason, setFlagReason]   = useState<string>(FLAG_REASONS[0] ?? '')
  const [toast, setToast]             = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [pending, startTransition]    = useTransition()

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function run(targetStatus: string, reason?: string, successMsg?: string) {
    startTransition(async () => {
      try {
        await onStatusChange(targetStatus, reason)
        setAction(null)
        showToast('success', successMsg ?? `Status updated to "${targetStatus}".`)
        router.refresh()
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : 'Something went wrong.')
      }
    })
  }

  const isFlagged  = currentStatus === 'flagged'
  const isArchived = currentStatus === 'archived'
  const isPaused   = currentStatus === 'paused'
  const isActive   = currentStatus === 'active'
  const isDraft    = currentStatus === 'draft'

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border
          ${toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Admin Actions</h2>
        </div>
        <div className="px-5 py-5 space-y-2">

          {/* Flag / Unflag */}
          {isFlagged ? (
            <ActionButton
              variant="success"
              icon={Flag}
              disabled={pending}
              onClick={() => setAction('unflag')}
            >
              Remove flag — restore listing
            </ActionButton>
          ) : (
            <ActionButton
              variant="danger"
              icon={Flag}
              disabled={pending}
              onClick={() => setAction('flag')}
            >
              Flag listing
            </ActionButton>
          )}

          {/* Suspend / Restore from paused */}
          {isPaused ? (
            <ActionButton
              variant="success"
              icon={RotateCcw}
              disabled={pending}
              onClick={() => setAction('restore')}
            >
              Restore to active
            </ActionButton>
          ) : !isArchived && (
            <ActionButton
              variant="warning"
              icon={Pause}
              disabled={pending}
              onClick={() => setAction('suspend')}
            >
              Suspend listing
            </ActionButton>
          )}

          {/* Archive / Restore from archived */}
          {isArchived ? (
            <ActionButton
              variant="success"
              icon={RotateCcw}
              disabled={pending}
              onClick={() => setAction('restore')}
            >
              Restore to active
            </ActionButton>
          ) : (
            <div className="pt-2 border-t border-gray-100">
              <ActionButton
                variant="danger"
                icon={Archive}
                disabled={pending}
                onClick={() => setAction('archive')}
              >
                Archive listing
              </ActionButton>
            </div>
          )}
        </div>

        <div className="px-5 pb-4 space-y-1 text-xs text-gray-400 border-t border-gray-50 pt-3">
          <p>• <strong className="text-gray-500">Flag</strong> — hides listing from search, notifies host. Use for policy reviews.</p>
          <p>• <strong className="text-gray-500">Suspend</strong> — pauses bookings without removing the listing.</p>
          <p>• <strong className="text-gray-500">Archive</strong> — permanently deactivates. Host must re-apply to restore.</p>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

            {/* Flag modal */}
            {action === 'flag' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Flag className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Flag listing</h3>
                    <p className="text-xs text-gray-500">This will hide the listing from search immediately.</p>
                  </div>
                </div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Reason for flagging
                </label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 mb-1"
                >
                  {FLAG_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mb-4">
                  The reason is recorded in the audit log. The host will be notified that their listing has been flagged for review.
                </p>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setAction(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending}
                    onClick={() => run('flagged', flagReason, 'Listing flagged and hidden from search.')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                    {pending ? 'Flagging…' : 'Flag listing'}
                  </button>
                </div>
              </>
            )}

            {/* Unflag modal */}
            {action === 'unflag' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <RotateCcw className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Remove flag</h3>
                    <p className="text-xs text-gray-500">Listing will be restored to active and visible in search.</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Confirm you have reviewed the listing and it complies with platform policies.
                </p>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setAction(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending}
                    onClick={() => run('active', undefined, 'Flag removed. Listing restored to active.')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60">
                    {pending ? 'Restoring…' : 'Remove flag'}
                  </button>
                </div>
              </>
            )}

            {/* Suspend modal */}
            {action === 'suspend' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Pause className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Suspend listing</h3>
                    <p className="text-xs text-gray-500">Existing bookings are not affected — new bookings are blocked.</p>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    The host will still have access to their dashboard and existing bookings.
                    New guests will not be able to discover or book this listing.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setAction(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending}
                    onClick={() => run('paused', undefined, 'Listing suspended. No new bookings allowed.')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60">
                    {pending ? 'Suspending…' : 'Suspend listing'}
                  </button>
                </div>
              </>
            )}

            {/* Restore modal */}
            {action === 'restore' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <RotateCcw className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Restore listing</h3>
                    <p className="text-xs text-gray-500">
                      {isArchived ? 'Listing will be set to active and visible to guests again.' : 'Listing will be restored to active.'}
                    </p>
                  </div>
                </div>
                {isArchived && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <p className="text-xs text-blue-700">
                      This will override the archived status. Verify the listing content is up to date before restoring.
                    </p>
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setAction(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending}
                    onClick={() => run('active', undefined, 'Listing restored to active.')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60">
                    {pending ? 'Restoring…' : 'Restore listing'}
                  </button>
                </div>
              </>
            )}

            {/* Archive modal */}
            {action === 'archive' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Archive className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Archive listing</h3>
                    <p className="text-xs text-gray-500">This permanently deactivates the listing.</p>
                  </div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">
                    The listing will be hidden from all search and discovery. Existing confirmed bookings
                    are not automatically cancelled — review them separately. The host will need to contact
                    support to restore an archived listing.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setAction(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending}
                    onClick={() => run('archived', undefined, 'Listing archived.')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                    {pending ? 'Archiving…' : 'Archive listing'}
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
