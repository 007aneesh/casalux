import type { Metadata } from 'next'
import { PageHero, PageContainerWide, SectionHeading } from '../_shared'

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join the team building the world\'s most curated luxury rental platform. See open roles at CasaLux.',
}

const departments: {
  name: string
  icon: string
  roles: { title: string; location: string; type: string }[]
}[] = [
  {
    name: 'Engineering',
    icon: '⚡',
    roles: [
      { title: 'Senior Full-Stack Engineer', location: 'Remote', type: 'Full-time' },
      { title: 'Mobile Engineer (React Native)', location: 'Remote', type: 'Full-time' },
      { title: 'DevOps / Infrastructure Engineer', location: 'Remote', type: 'Full-time' },
    ],
  },
  {
    name: 'Product & Design',
    icon: '🎨',
    roles: [
      { title: 'Senior Product Designer', location: 'Bangalore / Remote', type: 'Full-time' },
      { title: 'Product Manager — Guest Experience', location: 'Bangalore', type: 'Full-time' },
    ],
  },
  {
    name: 'Operations & Growth',
    icon: '📈',
    roles: [
      { title: 'Host Partnerships Manager', location: 'Multiple cities', type: 'Full-time' },
      { title: 'Customer Experience Lead', location: 'Remote', type: 'Full-time' },
      { title: 'Growth Marketing Manager', location: 'Bangalore / Remote', type: 'Full-time' },
    ],
  },
]

const values = [
  { icon: '🌟', title: 'Quality obsession', body: 'We raise the bar on everything — product, service, and hospitality.' },
  { icon: '🤝', title: 'Genuine trust', body: 'We build for long-term relationships with hosts, guests, and each other.' },
  { icon: '🌍', title: 'Global mindset', body: 'Luxury is universal. We design for guests and hosts everywhere.' },
  { icon: '⚡', title: 'Bias for action', body: 'We ship fast, learn quickly, and aren\'t afraid to iterate publicly.' },
]

export default function CareersPage() {
  return (
    <>
      <PageHero
        label="CasaLux"
        title="Work with us"
        description="We're a small, ambitious team building something we're genuinely proud of. If luxury travel excites you, come help us shape it."
      />

      <PageContainerWide>
        {/* Values */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {values.map(({ icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5 text-center">
              <span className="text-3xl mb-3 block">{icon}</span>
              <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Open roles */}
        <SectionHeading>Open roles</SectionHeading>
        <div className="space-y-8 mb-14">
          {departments.map(({ name, icon, roles }) => (
            <div key={name}>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span>{icon}</span> {name}
              </h3>
              <div className="space-y-3">
                {roles.map(({ title, location, type }) => (
                  <div
                    key={title}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 hover:bg-surface transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">{title}</p>
                      <p className="text-sm text-muted mt-0.5">{location}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-surface border border-border text-muted">
                        {type}
                      </span>
                      <a
                        href={`mailto:careers@casalux.com?subject=Application: ${encodeURIComponent(title)}`}
                        className="text-sm font-medium text-[rgb(var(--gold-600))] hover:underline whitespace-nowrap"
                      >
                        Apply →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Speculative */}
        <div className="rounded-2xl bg-[rgb(var(--navy))] text-white p-8 text-center">
          <h2 className="font-display text-2xl font-semibold mb-3">Don't see your role?</h2>
          <p className="text-white/70 max-w-lg mx-auto mb-6 text-sm">
            We hire talented people ahead of specific openings. Send us a note about who you are and what you'd build at CasaLux.
          </p>
          <a
            href="mailto:careers@casalux.com?subject=Speculative application"
            className="inline-block bg-[rgb(var(--gold))] text-[rgb(var(--navy))] font-semibold px-6 py-3 rounded-xl hover:bg-[rgb(var(--gold-600))] transition-colors"
          >
            Send a speculative application
          </a>
        </div>
      </PageContainerWide>
    </>
  )
}
