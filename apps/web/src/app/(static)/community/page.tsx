import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero, PageContainer } from '../layout'

export const metadata: Metadata = {
  title: 'Community Forum',
  description: 'Connect with other CasaLux guests and hosts — share tips, ask questions, and celebrate great stays.',
}

const channels = [
  { icon: '🏡', name: '#host-tips', desc: 'Swap hosting strategies and ask experienced Superhosts for advice.' },
  { icon: '✈️', name: '#travel-stories', desc: 'Share your favourite CasaLux stays and hidden-gem destinations.' },
  { icon: '🛠️', name: '#property-management', desc: 'Discuss smart home tech, cleaners, and maintenance services.' },
  { icon: '💡', name: '#feature-requests', desc: 'Suggest improvements directly to the CasaLux product team.' },
  { icon: '🌍', name: '#international-hosts', desc: 'For hosts and guests navigating international bookings and tax.' },
  { icon: '🎉', name: '#wins', desc: 'Celebrate milestones — first booking, Superhost status, 100 stays!' },
]

export default function CommunityPage() {
  return (
    <>
      <PageHero
        label="Hosting"
        title="Community Forum"
        description="A space for CasaLux guests and hosts to connect, learn from each other, and build something special together."
      />

      <PageContainer>
        {/* Coming soon notice */}
        <div className="rounded-2xl border-2 border-dashed border-[rgb(var(--gold))]/40 bg-[rgb(var(--gold))]/5 p-8 text-center mb-12">
          <span className="text-4xl mb-4 block">🚧</span>
          <h2 className="font-display text-2xl font-semibold mb-3">Forum launching soon</h2>
          <p className="text-muted max-w-sm mx-auto mb-6 text-sm leading-relaxed">
            We're building a dedicated community space. In the meantime, our Discord server is live and active — thousands of hosts and guests are already there.
          </p>
          <a
            href="https://discord.gg/casalux"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#5865F2] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#4752C4] transition-colors"
          >
            {/* Discord icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Join our Discord
          </a>
        </div>

        <h2 className="font-display text-xl font-semibold mb-6">Channels you'll find on Discord</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {channels.map(({ icon, name, desc }) => (
            <div key={name} className="flex gap-4 rounded-xl border border-border bg-card p-4">
              <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
              <div>
                <p className="font-mono text-sm font-semibold text-foreground">{name}</p>
                <p className="text-sm text-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-surface border border-border p-6 text-center">
          <p className="text-sm text-muted mb-3">
            Have a question that needs a direct answer? Our support team is always available.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:support@casalux.com" className="text-sm font-medium text-foreground hover:text-[rgb(var(--gold-600))] transition-colors underline">
              support@casalux.com
            </a>
            <span className="text-muted">·</span>
            <Link href="/help" className="text-sm font-medium text-foreground hover:text-[rgb(var(--gold-600))] transition-colors underline">
              Help Centre
            </Link>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
