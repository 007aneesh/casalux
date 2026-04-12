import type { Metadata } from 'next'
import { PageHero, PageContainerWide, SectionHeading } from '../_shared'

export const metadata: Metadata = {
  title: 'Cancellation Options',
  description: 'Understand CasaLux cancellation policies — Flexible, Moderate, and Strict — and what you\'re entitled to if plans change.',
}

const policies = [
  {
    name: 'Flexible',
    badge: 'Most lenient',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    icon: '🌿',
    tagline: 'Full refund up to 24 hours before check-in.',
    timeline: [
      { label: 'More than 24h before check-in', refund: '100% refund', positive: true },
      { label: 'Less than 24h before check-in', refund: '0% refund (first night + service fee)', positive: false },
      { label: 'After check-in (early departure)', refund: 'Unused nights refunded', positive: true },
    ],
    note: 'Service fees are refunded on cancellations made more than 48 hours before check-in.',
  },
  {
    name: 'Moderate',
    badge: 'Most common',
    badgeColor: 'bg-blue-100 text-blue-800',
    icon: '⚖️',
    tagline: 'Full refund up to 5 days before check-in.',
    timeline: [
      { label: 'More than 5 days before check-in', refund: '100% refund', positive: true },
      { label: '1–5 days before check-in', refund: '50% refund (minus service fee)', positive: false },
      { label: 'Less than 24h before / after check-in', refund: 'No refund', positive: false },
      { label: 'After check-in (early departure)', refund: 'No refund for remaining nights', positive: false },
    ],
    note: 'Most popular among hosts. Balances guest flexibility with host security.',
  },
  {
    name: 'Strict',
    badge: 'Least flexible',
    badgeColor: 'bg-amber-100 text-amber-800',
    icon: '🔒',
    tagline: '50% refund up to 7 days before check-in, no refund after.',
    timeline: [
      { label: 'More than 14 days before check-in', refund: '100% refund', positive: true },
      { label: '7–14 days before check-in', refund: '50% refund (minus service fee)', positive: false },
      { label: 'Less than 7 days before check-in', refund: 'No refund', positive: false },
      { label: 'After check-in', refund: 'No refund', positive: false },
    ],
    note: 'Typically applied to high-demand luxury properties and holiday-season bookings.',
  },
]

export default function CancellationsPage() {
  return (
    <>
      <PageHero
        label="Support"
        title="Cancellation Options"
        description="Every listing displays its cancellation policy clearly before you book. Here's what each policy means in plain language."
      />

      <PageContainerWide>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {policies.map((policy) => (
            <div
              key={policy.name}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{policy.icon}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${policy.badgeColor}`}>
                  {policy.badge}
                </span>
              </div>
              <h2 className="font-display text-xl font-semibold mb-1">{policy.name}</h2>
              <p className="text-sm text-muted mb-5">{policy.tagline}</p>

              <div className="space-y-2 flex-1">
                {policy.timeline.map(({ label, refund, positive }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {positive ? '✓' : '✕'}
                    </span>
                    <div>
                      <p className="text-muted">{label}</p>
                      <p className="font-medium text-foreground">{refund}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-5 pt-5 border-t border-border text-xs text-muted italic">
                {policy.note}
              </p>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <SectionHeading>Policy comparison at a glance</SectionHeading>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left px-5 py-3 font-semibold text-foreground">Cancel timing</th>
                <th className="text-center px-5 py-3 font-semibold text-foreground">Flexible</th>
                <th className="text-center px-5 py-3 font-semibold text-foreground">Moderate</th>
                <th className="text-center px-5 py-3 font-semibold text-foreground">Strict</th>
              </tr>
            </thead>
            <tbody>
              {[
                { when: '14+ days before', flexible: '100%', moderate: '100%', strict: '100%' },
                { when: '7–14 days before', flexible: '100%', moderate: '100%', strict: '50%' },
                { when: '5–7 days before', flexible: '100%', moderate: '100%', strict: '0%' },
                { when: '1–5 days before', flexible: '100%', moderate: '50%', strict: '0%' },
                { when: 'Within 24h / after check-in', flexible: '0%', moderate: '0%', strict: '0%' },
              ].map(({ when, flexible, moderate, strict }, i) => (
                <tr key={when} className={i % 2 === 0 ? 'bg-card' : 'bg-surface/40'}>
                  <td className="px-5 py-3 text-muted">{when}</td>
                  {[flexible, moderate, strict].map((val, j) => (
                    <td key={j} className={`px-5 py-3 text-center font-medium ${val === '100%' ? 'text-emerald-600' : val === '50%' ? 'text-amber-600' : 'text-red-500'}`}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Extra circumstances */}
        <div className="mt-14 grid sm:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-3">Extenuating circumstances</h3>
            <p className="text-sm text-muted leading-relaxed">
              In certain documented situations — severe illness, natural disasters, government travel bans, or bereavement — you may qualify for a full refund regardless of the cancellation policy. Contact support with documentation within 14 days of the booking date.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-3">Host-initiated cancellations</h3>
            <p className="text-sm text-muted leading-relaxed">
              If a host cancels a confirmed booking, you receive a <strong>full refund</strong> plus a rebooking credit equal to 10% of the original booking value. Hosts who cancel frequently are penalised and may lose Superhost status or be removed from the platform.
            </p>
          </div>
        </div>

        <p className="mt-8 text-xs text-muted text-center">
          Questions? Email <a href="mailto:support@casalux.com" className="underline">support@casalux.com</a>. All policies are subject to{' '}
          <a href="/terms" className="underline">CasaLux Terms of Service</a>.
        </p>
      </PageContainerWide>
    </>
  )
}
