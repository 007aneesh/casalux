'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userId:             string
  isBanned:           boolean
  bannedReason:       string | null
  isDeleted:          boolean
  verificationStatus: string
  role:               string
  isSuperhost:        boolean
  hasHostProfile:     boolean
  isSelf:             boolean
  // Server actions
  onBan:            (reason: string) => Promise<void>
  onUnban:          () => Promise<void>
  onVerify:         (verified: boolean) => Promise<void>
  onChangeRole:     (role: string) => Promise<void>
  onToggleSuperhost:(grant: boolean) => Promise<void>
  onDelete:         () => Promise<void>
}

type Modal =
  | { type: 'ban' }
  | { type: 'unban' }
  | { type: 'delete' }
  | { type: 'role'; currentRole: string }
  | null

const ROLES = ['guest', 'host', 'admin', 'super_admin'] as const

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
    default:  'border-gray-200 text-gray-700 hover:border-gray-400',
    danger:   'border-red-200 text-red-700 hover:border-red-400 hover:bg-red-50',
    success:  'border-green-200 text-green-700 hover:border-green-400 hover:bg-green-50',
    warning:  'border-yellow-200 text-yellow-700 hover:border-yellow-400 hover:bg-yellow-50',
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

export default function UserActions({
  isBanned, bannedReason, isDeleted, verificationStatus, role,
  isSuperhost, hasHostProfile, isSelf,
  onBan, onUnban, onVerify, onChangeRole, onToggleSuperhost, onDelete,
}: Props) {
  const router = useRouter()
  const [modal, setModal]         = useState<Modal>(null)
  const [banReason, setBanReason] = useState('')
  const [newRole, setNewRole]     = useState(role)
  const [toast, setToast]         = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function run(fn: () => Promise<void>, successMsg: string) {
    startTransition(async () => {
      try {
        await fn()
        setModal(null)
        setBanReason('')
        showToast('success', successMsg)
        router.refresh()
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : 'Something went wrong.')
      }
    })
  }

  if (isDeleted) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Admin Actions</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-gray-400 italic">This account has been deleted. No actions available.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Toast */}
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

          {/* Ban / Unban */}
          {isBanned ? (
            <ActionButton variant="success" disabled={pending || isSelf} onClick={() => setModal({ type: 'unban' })}>
              Unban user
            </ActionButton>
          ) : (
            <ActionButton variant="danger" disabled={pending || isSelf} onClick={() => setModal({ type: 'ban' })}>
              Ban user
            </ActionButton>
          )}

          {/* Verify / Unverify */}
          {verificationStatus === 'verified' ? (
            <ActionButton variant="warning" disabled={pending} onClick={() => run(() => onVerify(false), 'Verification removed.')}>
              Remove verification
            </ActionButton>
          ) : (
            <ActionButton variant="success" disabled={pending} onClick={() => run(() => onVerify(true), 'User verified.')}>
              Mark as verified
            </ActionButton>
          )}

          {/* Change role */}
          <ActionButton disabled={pending || isSelf} onClick={() => { setNewRole(role); setModal({ type: 'role', currentRole: role }) }}>
            Change role
          </ActionButton>

          {/* Superhost toggle (hosts only) */}
          {hasHostProfile && (
            isSuperhost ? (
              <ActionButton variant="warning" disabled={pending} onClick={() => run(() => onToggleSuperhost(false), 'Superhost status revoked.')}>
                Revoke superhost
              </ActionButton>
            ) : (
              <ActionButton variant="success" disabled={pending} onClick={() => run(() => onToggleSuperhost(true), 'Superhost granted.')}>
                Grant superhost
              </ActionButton>
            )
          )}

          {/* Delete */}
          <div className="pt-2 border-t border-gray-100">
            <ActionButton variant="danger" disabled={pending || isSelf} onClick={() => setModal({ type: 'delete' })}>
              Delete account
            </ActionButton>
          </div>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

            {/* Ban modal */}
            {modal.type === 'ban' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Ban this user</h3>
                <p className="text-sm text-gray-500 mb-4">
                  The user will be flagged as banned. Provide a reason for audit records.
                </p>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Reason (optional)
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Repeated policy violations, fraudulent activity…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setModal(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending}
                    onClick={() => run(() => onBan(banReason), 'User banned.')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                    {pending ? 'Banning…' : 'Ban user'}
                  </button>
                </div>
              </>
            )}

            {/* Unban modal */}
            {modal.type === 'unban' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Unban this user</h3>
                {bannedReason && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Ban reason</p>
                    <p className="text-sm text-gray-700">{bannedReason}</p>
                  </div>
                )}
                <p className="text-sm text-gray-500 mb-4">This will restore normal access for the user.</p>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setModal(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending}
                    onClick={() => run(() => onUnban(), 'User unbanned.')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60">
                    {pending ? 'Unbanning…' : 'Unban user'}
                  </button>
                </div>
              </>
            )}

            {/* Role change modal */}
            {modal.type === 'role' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Change role</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Role is synced to the auth provider. Changing to <strong>host</strong> will create a host profile if one doesn't exist.
                  Changing to/from <strong>admin</strong> requires super admin privileges.
                </p>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">New role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.replace('_', ' ')}</option>
                  ))}
                </select>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setModal(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending || newRole === role}
                    onClick={() => run(() => onChangeRole(newRole), `Role changed to ${newRole}.`)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60">
                    {pending ? 'Saving…' : 'Save role'}
                  </button>
                </div>
              </>
            )}

            {/* Delete modal */}
            {modal.type === 'delete' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete account</h3>
                <p className="text-sm text-gray-500 mb-4">
                  This is a <strong>soft delete</strong> — the account is deactivated and hidden but data is preserved for compliance.
                  This action cannot be undone from the admin panel.
                </p>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setModal(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="button" disabled={pending}
                    onClick={() => run(() => onDelete(), 'Account deleted.')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                    {pending ? 'Deleting…' : 'Delete account'}
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
