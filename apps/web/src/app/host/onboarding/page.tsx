'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthedRequest } from '@/lib/hooks/useAuthedRequest'
import { Home, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react'

type AppStatus = 'loading' | 'none' | 'in_progress' | 'submitted' | 'approved' | 'auto_approved' | 'rejected' | 'error'

export default function OnboardingStartPage() {
  const router        = useRouter()
  const authedRequest = useAuthedRequest()
  const [appStatus, setAppStatus]           = useState<AppStatus>('loading')
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [submittedAt, setSubmittedAt]       = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function checkAndStart() {
      try {
        // 1. Check current application status first
        const statusRes = await authedRequest<{ status: string; sessionId: string | null; submittedAt: string | null; rejectionReason: string | null }>(
          '/host/onboarding/status',
          { method: 'GET' }
        ) as any

        if (cancelled) return

        const status: string = statusRes?.data?.status ?? statusRes?.status ?? 'none'

        // Already approved — send to host dashboard
        if (status === 'approved' || status === 'auto_approved') {
          router.replace('/host/dashboard')
          return
        }

        // Under review or rejected — dedicated page handles both
        if (status === 'submitted' || status === 'rejected') {
          router.replace('/host/application-pending')
          return
        }

        // No application or in_progress — start / resume
        const startRes = await authedRequest<any>('/host/onboarding/start', { method: 'POST' }) as any
        if (cancelled) return

        // Handle edge case: start returned 409 APPLICATION_UNDER_REVIEW
        const startError = startRes?.error
        if (startError === 'APPLICATION_UNDER_REVIEW') {
          setAppStatus('submitted')
          return
        }

        const sessionId = startRes?.session?.id ?? startRes?.data?.session?.id
        if (sessionId) {
          router.replace(`/host/onboarding/${sessionId}`)
        } else {
          setAppStatus('error')
        }
      } catch {
        if (!cancelled) setAppStatus('error')
      }
    }

    checkAndStart()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (appStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-navy flex items-center justify-center animate-pulse">
            <Home className="h-7 w-7 text-gold" />
          </div>
          <p className="text-sm text-muted">Setting up your host profile…</p>
        </div>
      </div>
    )
  }

  // ── Application under review ───────────────────────────────────────────────
  if (appStatus === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
              Application under review
            </h1>
            <p className="text-muted text-sm leading-relaxed mb-6">
              We've received your host application and our team is reviewing it. This usually takes 1–3 business days. We'll notify you by email once a decision has been made.
            </p>
            {submittedAt && (
              <p className="text-xs text-muted mb-6">
                Submitted on{' '}
                {new Date(submittedAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            )}
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-left mb-6">
              <p className="text-xs font-semibold text-amber-700 mb-1">What happens next?</p>
              <ul className="text-xs text-amber-600 space-y-1 list-disc list-inside">
                <li>Our team reviews your property details</li>
                <li>You'll receive an email with the outcome</li>
                <li>Once approved, your listing goes live immediately</li>
              </ul>
            </div>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-navy hover:underline"
            >
              Back to home
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Rejected ──────────────────────────────────────────────────────────────
  if (appStatus === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
              Application not approved
            </h1>
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
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-navy hover:underline"
            >
              Back to home
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (appStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <p className="text-sm text-red-500 mb-4">Something went wrong. Please try again.</p>
          <button
            onClick={() => { setAppStatus('loading'); window.location.reload() }}
            className="bg-navy text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // ── Fallback spinner (shouldn't be seen) ───────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-14 w-14 rounded-2xl bg-navy flex items-center justify-center animate-pulse">
        <Home className="h-7 w-7 text-gold" />
      </div>
    </div>
  )
}
