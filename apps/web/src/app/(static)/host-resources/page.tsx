import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero, PageContainerWide, SectionHeading } from '../layout'

export const metadata: Metadata = {
  title: 'Resources for Hosts',
  description: 'Guides, tips, and tools to help you become a successful CasaLux host — from creating your first listing to earning Superhost status.',
}

const guides = [
  {
    icon: '🚀',
    title: 'Getting Started',
    description: 'Set up your listing from scratch. Covers property details, amenities, house rules, and your first payout setup.',
    steps: ['Create your host profile', 'Add property photos & description', 'Set your house rules', 'Connect payout account'],
    cta: { label: 'Start listing', href: '/host/dashboard' },
  },
  {
    icon: '💰',
    title: 'Pricing & Revenue',
    description: 'Learn how to price competitively, use seasonal adjustments, and maximise your earnings year-round.',
    steps: ['Research comparable listings', 'Set base price & cleaning fee', 'Enable weekend pricing', 'Offer long-stay discounts'],
    cta: { label: 'Manage pricing', href: '/host/listings' },
  },
  {
    icon: '📸',
    title: 'Photography Tips',
    description: 'Great photos are the single most important factor in booking conversion. Here\'s how to shoot your property like a pro.',
    steps: ['Shoot in natural daylight', 'Stage every room', 'Include wide & detail shots', 'Show all key amenities'],
    cta: null,
  },
  {
    icon: '📅',
    title: 'Calendar & Availability',
    description: 'Keep your calendar up to date to avoid conflicts and maximise visibility in search results.',
    steps: ['Set minimum & maximum stays', 'Block off maintenance dates', 'Sync iCal from Airbnb / VRBO', 'Turn on Instant Book'],
    cta: { label: 'Manage calendar', href: '/host/calendar' },
  },
  {
    icon: '⭐', title: 'Earning Superhost',
    description: 'Superhosts get a badge, priority placement in search, and access to exclusive support. Here\'s how to qualify.',
    steps: ['Maintain 4.8+ average rating', 'Complete 10 stays per year', 'Keep response rate above 90%', 'Zero host cancellations'],
    cta: null,
  },
  {
    icon: '📋',
    title: 'House Rules & Check-in',
    description: 'Clear house rules protect your property and set expectations. A smooth check-in process earns five-star reviews.',
    steps: ['List all house rules clearly', 'Set up a smart lock or lockbox', 'Send check-in instructions 48h before', 'Provide a local guide'],
    cta: null,
  },
]

const stats = [
  { value: '₹12L+', label: 'Avg. top-host annual earnings' },
  { value: '48h', label: 'Avg. listing approval time' },
  { value: '3%', label: 'Host service fee (industry low)' },
  { value: '24/7', label: 'Dedicated host support' },
]

export default function HostResourcesPage() {
  return (
    <>
      <PageHero
        label="Hosting"
        title="Resources for Hosts"
        description="Everything you need to list, manage, and grow your property on CasaLux — from day one to Superhost."
      />

      {/* Stats */}
      <div className="bg-surface border-b border-border">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="font-display text-2xl font-bold text-[rgb(var(--gold-600))]">{value}</p>
                <p className="text-xs text-muted mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PageContainerWide>
        <SectionHeading>Host guides</SectionHeading>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {guides.map((guide) => (
            <div key={guide.title} className="rounded-2xl border border-border bg-card p-6 flex flex-col">
              <span className="text-3xl mb-4">{guide.icon}</span>
              <h3 className="font-semibold text-foreground text-base mb-2">{guide.title}</h3>
              <p className="text-sm text-muted mb-4 leading-relaxed">{guide.description}</p>
              <ul className="space-y-1.5 mb-5 flex-1">
                {guide.steps.map((step) => (
                  <li key={step} className="flex items-center gap-2 text-sm text-foreground/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--gold))] flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
              {guide.cta && (
                <Link
                  href={guide.cta.href}
                  className="mt-auto text-sm font-medium text-[rgb(var(--gold-600))] hover:underline"
                >
                  {guide.cta.label} →
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-[rgb(var(--navy))] text-white p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-semibold mb-2">Ready to list your property?</h2>
            <p className="text-white/70">Join hundreds of hosts earning passive income with CasaLux.</p>
          </div>
          <Link
            href="/host/dashboard"
            className="flex-shrink-0 bg-[rgb(var(--gold))] text-[rgb(var(--navy))] font-semibold px-6 py-3 rounded-xl hover:bg-[rgb(var(--gold-600))] transition-colors whitespace-nowrap"
          >
            Become a host
          </Link>
        </div>
      </PageContainerWide>
    </>
  )
}
