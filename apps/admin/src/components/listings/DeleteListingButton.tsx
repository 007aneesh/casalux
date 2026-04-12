'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteListingAction } from '@/app/(dashboard)/listings/_actions'

interface Props {
  id:    string
  title: string
}

export function DeleteListingButton({ id, title }: Props) {
  const router = useRouter()
  const [open, setOpen]        = useState(false)
  const [pending, startTx]     = useTransition()
  const [error, setError]      = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTx(async () => {
      try {
        const result = await deleteListingAction(id)
        if (!result.success) throw new Error(result.error ?? 'Delete failed')
        setOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
        title="Delete listing"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            {/* Icon + heading */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete listing</h3>
                <p className="text-xs text-gray-500">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            {/* Warning */}
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 space-y-1">
                <p>
                  You are about to permanently delete:{' '}
                  <strong className="font-semibold">&ldquo;{title}&rdquo;</strong>
                </p>
                <p>
                  All associated data — amenities, availability rules, media assets, and views —
                  will be deleted. <strong>Confirmed bookings are NOT automatically cancelled</strong>.
                  Review them before proceeding.
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null) }}
                disabled={pending}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
              >
                {pending ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  'Delete permanently'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
