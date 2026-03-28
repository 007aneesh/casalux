'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthedRequest } from '@/lib/hooks/useAuthedRequest'
import { Home } from 'lucide-react'

export default function OnboardingStartPage() {
  const router = useRouter()
  const authedRequest = useAuthedRequest()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function startSession() {
      try {
        const res = await authedRequest<any>('/host/onboarding/start', { method: 'POST' }) as any
        if (cancelled) return
        const sessionId = res?.session?.id ?? res?.data?.session?.id
        if (sessionId) {
          router.replace(`/host/onboarding/${sessionId}`)
        } else {
          setError('Could not start onboarding session. Please try again.')
        }
      } catch {
        if (!cancelled) setError('Something went wrong. Please try again.')
      }
    }

    startSession()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={() => { setError(null); window.location.reload() }}
            className="bg-navy text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

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
