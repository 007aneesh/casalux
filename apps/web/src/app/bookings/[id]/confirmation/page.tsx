'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Clock, XCircle, ArrowRight, CalendarDays, MessageSquare } from 'lucide-react'
import { Button } from '@casalux/ui'
import { useBookingStatus } from '@/lib/hooks/useBooking'

interface PageProps {
  params: { id: string }
}

const STATUS_CONFIG: Record<string, {
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
  bgColor: string
}> = {
  confirmed: {
    icon: <CheckCircle className="h-10 w-10 text-green-600" />,
    title: "You're booked!",
    subtitle: "Your reservation is confirmed. Have an amazing stay.",
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
  pending_payment: {
    icon: <Clock className="h-10 w-10 text-gold" />,
    title: 'Processing payment…',
    subtitle: "We're confirming your payment with the provider. This usually takes a few seconds.",
    color: 'text-gold',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  host_approved: {
    icon: <CheckCircle className="h-10 w-10 text-blue-600" />,
    title: 'Request approved!',
    subtitle: 'The host approved your request. Complete payment to confirm your booking.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  payment_failed: {
    icon: <XCircle className="h-10 w-10 text-red-500" />,
    title: 'Payment failed',
    subtitle: 'Something went wrong with your payment. Please try again.',
    color: 'text-red-500',
    bgColor: 'bg-red-50 border-red-200',
  },
  failed: {
    icon: <XCircle className="h-10 w-10 text-red-500" />,
    title: 'Booking failed',
    subtitle: 'Your booking could not be completed. No charge was made.',
    color: 'text-red-500',
    bgColor: 'bg-red-50 border-red-200',
  },
}

export default function BookingConfirmationPage({ params }: PageProps) {
  const router = useRouter()
  const { status, isLoading } = useBookingStatus(params.id)

  const config = status ? (STATUS_CONFIG[status] ?? STATUS_CONFIG.pending_payment) : STATUS_CONFIG.pending_payment

  // Auto-redirect away from payment failure
  useEffect(() => {
    if (status === 'payment_failed' || status === 'failed') {
      // Allow user to read the message, don't auto-redirect
    }
  }, [status])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Status icon */}
        <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full border-2 ${config.bgColor}`}>
          {isLoading ? (
            <div className="h-8 w-8 rounded-full border-3 border-gold border-t-transparent animate-spin" />
          ) : (
            config.icon
          )}
        </div>

        {/* Status text */}
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{config.title}</h1>
          <p className="text-muted text-sm mt-2 leading-relaxed">{config.subtitle}</p>
        </div>

        {/* Booking ID */}
        <div className="rounded-xl bg-surface border border-border px-4 py-3">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Booking reference</p>
          <p className="font-mono text-sm font-semibold text-foreground">{params.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Polling indicator */}
        {(status === 'pending_payment' || isLoading) && (
          <p className="text-xs text-muted flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse inline-block" />
            Checking payment status…
          </p>
        )}

        {/* CTAs */}
        {status === 'confirmed' && (
          <div className="flex flex-col gap-3">
            <Link href={`/bookings/${params.id}`}>
              <Button variant="gold" size="lg" className="w-full">
                <CalendarDays className="h-4 w-4" />
                View booking details
              </Button>
            </Link>
            <Link href={`/messages`}>
              <Button variant="outline" size="lg" className="w-full">
                <MessageSquare className="h-4 w-4" />
                Message host
              </Button>
            </Link>
          </div>
        )}

        {(status === 'payment_failed' || status === 'failed') && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground underline underline-offset-2"
            >
              Try again <ArrowRight className="h-4 w-4" />
            </button>
            <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
              Return to home
            </Link>
          </div>
        )}

        {status !== 'confirmed' && status !== 'payment_failed' && status !== 'failed' && (
          <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors block">
            Continue browsing
          </Link>
        )}
      </div>
    </div>
  )
}
