'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthedRequest } from '@/lib/hooks/useAuthedRequest'
import { useSession } from '@clerk/nextjs'
import { Clock, CheckCircle, XCircle, Home, ChevronRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Status = 'loading' | 'submitted' | 'approved' | 'auto_approved' | 'rejected' | 'none'

export default function ApplicationPendingPage() {
  const router        = useRouter()
  const authedRequest = useAuthedRequest()
  const { session }   = useSession()

  const [status,          setStatus]          = useState<Status>('loading')
  const [submittedAt,     setSubmittedAt]     = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function checkStatus() {
      try {
        const res = await authedRequest<{
          status: string
          submittedAt: string | null
          rejectionReason: string | null
        }>('/host/onboarding/status', { method: 'GET' }) as any

        if (cancelled) return

        const st: string = res?.data?.status ?? 'none'

        if (st === 'approved' || st === 'auto_approved') {
          // Reload Clerk session so JWT reflects new role, then hard-nav
          await session?.reload()
          window.location.href = '/host/dashboard'
          return
        }

        setSubmittedAt(res?.data?.submittedAt ?? null)
        setRejectionReason(res?.data?.rejectionReason ?? null)
        setStatus(st as Status)
      } catch {
        if (!cancelled) setStatus('submitted') // safe fallback
      }
    }

    checkStatus()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-12 w-12 rounded-2xl bg-navy/10 animate-pulse" />
      </div>
    )
  }

  // ── Approved (shouldn't stay here — redirected above, but just in case) ────
  if (status === 'approved' || status === 'auto_approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">You're approved!</h1>
          <p className="text-muted text-sm mb-6">Redirecting you to your host dashboard…</p>
          <Link href="/host/dashboard" className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors">
            Go to dashboard <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  // ── Rejected ──────────────────────────────────────────────────────────────
  if (status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-2">Application not approved</h1>
            <p className="text-muted text-sm leading-relaxed mb-4">
              Unfortunately, your host application wasn't approved at this time.
            </p>
            {rejectionReason && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-left mb-6">
                <p className="text-xs font-semibold text-red-700 mb-1">Reason</p>
                <p className="text-xs text-red-600">{rejectionReason}</p>
              </div>
            )}
            <p className="text-xs text-muted mb-6">
              If you have questions, please contact our support team.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-navy hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── No application (edge case) ─────────────────────────────────────────────
  if (status === 'none') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm w-full text-center">
          <p className="text-sm text-muted mb-4">No active application found.</p>
          <Link href="/become-a-host" className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors">
            Become a host <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  // ── Under review (submitted) ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">

        {/* Status card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>

          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
            Application under review
          </h1>
          <p className="text-muted text-sm leading-relaxed mb-2">
            We've received your host application and our team is reviewing it.
            This usually takes <strong>1–3 business days</strong>.
          </p>
          <p className="text-muted text-sm mb-6">
            We'll notify you by email once a decision has been made.
          </p>

          {submittedAt && (
            <p className="text-xs text-muted mb-6">
              Submitted on{' '}
              {new Date(submittedAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          )}

          {/* What's next */}
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-4 text-left mb-6">
            <p className="text-xs font-semibold text-amber-700 mb-2">What happens next?</p>
            <ul className="space-y-1.5">
              {[
                'Our team reviews your property details and photos',
                "You'll receive an email with the outcome",
                'Once approved, you can publish your listing and start earning',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-amber-700">
                  <span className="mt-0.5 h-3.5 w-3.5 rounded-full bg-amber-200 flex items-center justify-center shrink-0 text-amber-700 font-bold text-[9px]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy hover:underline"
          >
            <Home className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
