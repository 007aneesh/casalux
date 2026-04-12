import type { Metadata } from 'next'
import { PageHero, PageContainer, SectionHeading } from '../_shared'

export const metadata: Metadata = {
  title: 'Newsroom',
  description: 'The latest news, announcements, and press resources from CasaLux.',
}

const milestones = [
  { year: '2024', title: 'CasaLux Founded', body: 'CasaLux was founded with a single belief: that luxury travel should feel effortless from the first search to the final checkout. We launched with a curated catalogue of 50 hand-picked properties across India.' },
  { year: '2025', title: 'Platform Launch', body: 'After months of private beta with select hosts and guests, CasaLux opened publicly. Within the first quarter, hosts listed over 500 luxury properties spanning villas, mountain cabins, beachfront retreats, and heritage estates.' },
  { year: '2026', title: 'International Expansion', body: 'CasaLux crossed borders — properties in Bali, Portugal, and Thailand were added as international hosts joined the platform. We also launched our Superhost programme to recognise excellence.' },
]

export default function NewsroomPage() {
  return (
    <>
      <PageHero
        label="CasaLux"
        title="Newsroom"
        description="Stories, announcements, and milestones from the team building the future of luxury travel."
      />

      <PageContainer>
        {/* Press contact */}
        <div className="rounded-xl border border-border bg-card p-6 mb-12 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground mb-1">Press enquiries</h2>
            <p className="text-sm text-muted">For interview requests, press assets, or off-the-record background, contact our communications team.</p>
          </div>
          <a
            href="mailto:press@casalux.com"
            className="flex-shrink-0 inline-block bg-[rgb(var(--navy))] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-[rgb(var(--navy-800))] transition-colors"
          >
            press@casalux.com
          </a>
        </div>

        {/* Press releases placeholder */}
        <SectionHeading>Press releases</SectionHeading>
        <div className="rounded-xl border-2 border-dashed border-border bg-surface/40 p-10 text-center mb-12">
          <p className="text-3xl mb-3">📰</p>
          <p className="font-semibold text-foreground mb-1">No press releases yet</p>
          <p className="text-sm text-muted">
            We're a young company building in public. Sign up below for updates, or follow us on social media.
          </p>
        </div>

        {/* Company milestones */}
        <SectionHeading>Our story</SectionHeading>
        <div className="relative pl-6 border-l-2 border-border space-y-8 mb-12">
          {milestones.map(({ year, title, body }) => (
            <div key={year} className="relative">
              {/* dot */}
              <span className="absolute -left-[1.6rem] top-1 w-4 h-4 rounded-full bg-[rgb(var(--gold))] border-2 border-background" />
              <p className="text-xs font-bold text-[rgb(var(--gold-600))] uppercase tracking-widest mb-1">{year}</p>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Brand assets */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Brand assets</h3>
          <p className="text-sm text-muted mb-4">
            Logos, colour palette, and brand guidelines for media use. Please review our brand guidelines before publishing.
          </p>
          <a
            href="mailto:press@casalux.com?subject=Brand assets request"
            className="inline-block text-sm font-medium text-[rgb(var(--gold-600))] hover:underline"
          >
            Request brand kit →
          </a>
        </div>
      </PageContainer>
    </>
  )
}
