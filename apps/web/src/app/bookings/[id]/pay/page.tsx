'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { ArrowLeft, Shield } from 'lucide-react'
import { Button } from '@casalux/ui'
import { formatPrice } from '@/lib/utils'

const stripePromise = loadStripe(process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY']!)

interface PageProps {
  params: { id: string }
}

// ─── Inner form (needs Elements context) ─────────────────────────────────────
function PaymentForm({
  bookingId,
  amount,
  currency,
}: {
  bookingId: string
  amount: number
  currency: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsSubmitting(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings/${bookingId}/confirmation`,
      },
    })

    // confirmPayment only reaches here on error — success redirects to return_url
    if (submitError) {
      setError(submitError.message ?? 'Payment failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'upi', 'netbanking', 'wallet'],
        }}
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="gold"
        size="xl"
        className="w-full"
        disabled={!stripe || !elements || isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-navy border-t-transparent animate-spin" />
            Processing…
          </span>
        ) : (
          `Pay ${formatPrice(amount, currency)}`
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted">
        <Shield className="h-3.5 w-3.5" />
        <span>Secured by Stripe. Your payment info is encrypted.</span>
      </div>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PayPage({ params }: PageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const clientSecret = searchParams.get('clientSecret')
  const bookingId    = searchParams.get('bookingId') ?? params.id
  const amount       = parseInt(searchParams.get('amount') ?? '0', 10)
  const currency     = searchParams.get('currency') ?? 'INR'

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted text-sm">Invalid payment session.</p>
        <button onClick={() => router.back()} className="text-sm underline text-navy">Go back</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="font-display text-2xl font-semibold text-navy mb-2">Complete payment</h1>
        <p className="text-sm text-muted mb-8">
          {formatPrice(amount, currency)} · Booking reference{' '}
          <span className="font-mono font-medium text-navy">{bookingId.slice(0, 8).toUpperCase()}</span>
        </p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#0f1f3d',
                  colorBackground: '#ffffff',
                  borderRadius: '12px',
                  fontFamily: 'inherit',
                },
              },
            }}
          >
            <PaymentForm bookingId={bookingId} amount={amount} currency={currency} />
          </Elements>
        </div>
      </div>
    </div>
  )
}
