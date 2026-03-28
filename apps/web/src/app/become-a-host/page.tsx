'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import { Home, TrendingUp, Shield, Star, ChevronRight, Check } from 'lucide-react'
import Link from 'next/link'

const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Earn on your terms',
    desc: 'Set your own price, availability, and house rules. CasaLux handles payments.',
  },
  {
    icon: Shield,
    title: 'Host guarantee',
    desc: 'Every booking includes our host protection policy, covering property damage up to ₹10L.',
  },
  {
    icon: Star,
    title: 'Reach premium guests',
    desc: 'Access a curated audience of travellers seeking high-quality, luxury stays.',
  },
  {
    icon: Home,
    title: 'Your home, your rules',
    desc: 'You control who stays, how long, and under what conditions — always.',
  },
]

const STEPS = [
  'Tell us about your space — property type, location, capacity',
  'Add photos and write a compelling listing',
  'Set your price and availability',
  'Publish and start earning',
]

export default function BecomeAHostPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()

  const role = user?.publicMetadata?.role as string | undefined
  const isHost = role === 'host' || role === 'admin'

  // Already a host — go straight to dashboard
  useEffect(() => {
    if (isLoaded && isHost) {
      router.replace('/host/dashboard')
    }
  }, [isLoaded, isHost, router])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-navy overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?w=1600&q=80')" }}
        />
        <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-gold text-sm font-semibold uppercase tracking-wider mb-3">Host on CasaLux</p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white leading-tight mb-5">
              Turn your property<br />into income
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-md">
              Join thousands of hosts earning on CasaLux. Our tools make it simple to list, manage, and grow your rental income.
            </p>

            {!isLoaded ? null : !user ? (
              // Not logged in — sign up to start
              <div className="flex flex-col sm:flex-row gap-3">
                <SignUpButton mode="modal" fallbackRedirectUrl="/host/onboarding">
                  <button className="bg-gold text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-gold/90 transition-colors flex items-center justify-center gap-2">
                    Get started — it's free
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </SignUpButton>
                <SignInButton mode="modal" fallbackRedirectUrl="/host/onboarding">
                  <button className="bg-white/10 border border-white/20 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors">
                    I already have an account
                  </button>
                </SignInButton>
              </div>
            ) : (
              // Logged in, not a host yet — go to onboarding
              <Link
                href="/host/onboarding"
                className="inline-flex items-center gap-2 bg-gold text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-gold/90 transition-colors"
              >
                Start your host setup
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Stat card */}
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 space-y-6">
              <p className="text-white/70 text-sm font-medium">Average host on CasaLux earns</p>
              <p className="font-display text-5xl font-bold text-white">₹85,000</p>
              <p className="text-gold text-sm">per month from a single listing</p>
              <div className="border-t border-white/20 pt-5 space-y-3">
                {['No listing fee', 'Payouts within 24 hours', 'Dedicated host support'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/80">
                    <div className="h-5 w-5 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-gold" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-screen-xl px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl font-semibold text-foreground text-center mb-10">
          Why host on CasaLux?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6">
              <div className="h-11 w-11 rounded-xl bg-navy/5 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-navy" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-16">
          <h2 className="font-display text-3xl font-semibold text-foreground text-center mb-10">
            How it works
          </h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-foreground text-sm leading-relaxed pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-screen-xl px-4 sm:px-6 py-16 text-center">
        <h2 className="font-display text-3xl font-semibold text-foreground mb-4">Ready to start hosting?</h2>
        <p className="text-muted text-sm mb-8 max-w-sm mx-auto">
          The setup takes less than 10 minutes. Your listing goes live as soon as you publish.
        </p>
        {!isLoaded ? null : !user ? (
          <SignUpButton mode="modal" fallbackRedirectUrl="/host/onboarding">
            <button className="bg-navy text-white px-10 py-4 rounded-xl font-semibold text-sm hover:bg-navy/90 transition-colors">
              Create your host account
            </button>
          </SignUpButton>
        ) : (
          <Link
            href="/host/onboarding"
            className="inline-flex items-center gap-2 bg-navy text-white px-10 py-4 rounded-xl font-semibold text-sm hover:bg-navy/90 transition-colors"
          >
            Continue to setup
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </section>
    </div>
  )
}
