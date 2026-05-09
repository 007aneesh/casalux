'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  busyLabel?: string
  variant?: 'danger' | 'default'
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  busyLabel,
  variant = 'default',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  const isDanger = variant === 'danger'
  const confirmClass = isDanger
    ? 'bg-red-600 text-white hover:bg-red-700'
    : 'bg-navy text-white hover:bg-navy/90'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel()
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-card-hover border border-gray-100 p-6">
        <div className="flex items-start gap-3 mb-4">
          {isDanger && (
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
          )}
          <div className="min-w-0">
            <h2 id="confirm-dialog-heading" className="font-display text-base font-semibold text-navy">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-muted mt-1 break-words">{description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-navy bg-white hover:border-gray-400 transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-60 ${confirmClass}`}
          >
            {busy ? (busyLabel ?? `${confirmLabel}…`) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
