import type { Metadata } from 'next'
import { PageHero, PageContainer, SectionHeading } from '../layout'

export const metadata: Metadata = {
  title: 'Investors',
  description: 'CasaLux investor relations — company overview, milestones, and contact information.',
}

const highlights = [
  { label: 'Founded', value: '2024' },
  { label: 'Properties listed', value: '500+' },
  { label: 'Cities covered', value: '30+' },
  { label: 'Countries', value: '5' },
  { label: 'Avg. booking value', value: '₹45,000' },
  { label: 'Host service fee', value: '3%' },
]

export default function InvestorsPage() {
  return (
    <>
      <PageHero
        label="CasaLux"
        title="Investor Relations"
        description="CasaLux is redefining the luxury short-term rental market — starting with India and expanding globally."
      />

      <PageContainer>
        {/* IR contact */}
        <div className="rounded-xl border border-[rgb(var(--gold))]/30 bg-[rgb(var(--gold))]/5 p-6 mb-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <p className="font-semibold text-foreground mb-1">Investor enquiries</p>
            <p className="text-sm text-muted">For fundraising conversations, financial data requests, or partnership discussions.</p>
          </div>
          <a
            href="mailto:investors@casalux.com"
            className="flex-shrink-0 inline-block bg-[rgb(var(--navy))] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-[rgb(var(--navy-800))] transition-colors"
          >
            investors@casalux.com
          </a>
        </div>

        {/* The opportunity */}
        <SectionHeading>The opportunity</SectionHeading>
        <div className="space-y-4 text-sm text-muted leading-relaxed mb-10">
          <p>
            India's luxury travel market is growing at <strong className="text-foreground">18% CAGR</strong>, driven by a rising affluent class, domestic tourism boom, and a generation of travellers who prioritise experience over ownership.
          </p>
          <p>
            Existing platforms — Airbnb, VRBO, Booking.com — are mass-market products that lump a five-bedroom Goa villa next to a budget flat. CasaLux is purpose-built for the top end: rigorous curation, white-glove guest support, and hosts who understand that their property is a brand.
          </p>
          <p>
            Our marketplace model scales with near-zero marginal cost. Each new host and guest increases liquidity and defensibility. We monetise on both sides: a 3% host fee and 10–14% guest service fee — at parity or better unit economics than category leaders in mature markets.
          </p>
        </div>

        {/* Key metrics */}
        <SectionHeading>At a glance</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          {highlights.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5">
              <p className="font-display text-2xl font-bold text-foreground mb-1">{value}</p>
              <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* What we're building */}
        <SectionHeading>What we're building next</SectionHeading>
        <div className="space-y-3 mb-12">
          {[
            { title: 'Mobile apps (iOS & Android)', body: 'Full-featured native apps — search, booking, host management, and messaging.' },
            { title: 'International expansion', body: 'South-East Asia, Portugal, and East Africa — high luxury-supply markets with under-served premium guest demand.' },
            { title: 'CasaLux Concierge', body: 'White-glove services layer: private chefs, transfers, curated experiences — revenue per booking without adding inventory.' },
            { title: 'Dynamic pricing engine', body: 'ML-driven pricing recommendations for hosts, increasing average occupancy by modelling local demand signals.' },
          ].map(({ title, body }) => (
            <div key={title} className="flex gap-4 rounded-xl border border-border bg-card p-4">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-[rgb(var(--gold))] flex-shrink-0 mt-2" />
              <div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-sm text-muted mt-0.5">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-[rgb(var(--navy))] text-white p-8 text-center">
          <h2 className="font-display text-2xl font-semibold mb-3">Let's talk</h2>
          <p className="text-white/70 max-w-sm mx-auto mb-6 text-sm">
            We share detailed financials and traction data with qualified investors under NDA.
          </p>
          <a
            href="mailto:investors@casalux.com"
            className="inline-block bg-[rgb(var(--gold))] text-[rgb(var(--navy))] font-semibold px-6 py-3 rounded-xl hover:bg-[rgb(var(--gold-600))] transition-colors"
          >
            Get in touch
          </a>
        </div>
      </PageContainer>
    </>
  )
}
