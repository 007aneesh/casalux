import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero, PageContainerWide } from '../_shared'

export const metadata: Metadata = {
  title: 'Sitemap',
  description: 'A complete map of all pages on CasaLux.',
}

const sections: {
  title: string
  icon: string
  links: { label: string; href: string; description?: string }[]
}[] = [
  {
    title: 'Discover',
    icon: '🔍',
    links: [
      { label: 'Homepage', href: '/', description: 'Curated stays and featured destinations' },
      { label: 'Search', href: '/search', description: 'Find your perfect property' },
      { label: 'Search — Beach', href: '/search?type=beach', description: 'Beachfront stays' },
      { label: 'Search — Mountain', href: '/search?type=mountain', description: 'Mountain retreats' },
      { label: 'Search — Villa', href: '/search?type=villa', description: 'Private villas' },
      { label: 'Search — Heritage', href: '/search?type=heritage', description: 'Heritage & historic estates' },
    ],
  },
  {
    title: 'Account',
    icon: '👤',
    links: [
      { label: 'Sign in', href: '/sign-in', description: 'Log into your account' },
      { label: 'Create account', href: '/sign-up', description: 'Join CasaLux' },
      { label: 'Profile', href: '/profile', description: 'Manage your public profile' },
      { label: 'Wishlists', href: '/wishlists', description: 'Your saved properties' },
      { label: 'Messages', href: '/messages', description: 'Your conversations' },
    ],
  },
  {
    title: 'Bookings',
    icon: '📅',
    links: [
      { label: 'My bookings', href: '/bookings', description: 'View and manage your stays' },
    ],
  },
  {
    title: 'Hosting',
    icon: '🏡',
    links: [
      { label: 'Host dashboard', href: '/host/dashboard', description: 'Your hosting overview' },
      { label: 'My listings', href: '/host/listings', description: 'Manage your properties' },
      { label: 'Add new listing', href: '/host/listings/new', description: 'List a new property' },
      { label: 'Host bookings', href: '/host/bookings', description: 'Manage guest bookings' },
      { label: 'Calendar', href: '/host/calendar', description: 'Availability and blocking' },
      { label: 'Become a host', href: '/become-a-host', description: 'Start your hosting journey' },
    ],
  },
  {
    title: 'Support',
    icon: '💬',
    links: [
      { label: 'Help Centre', href: '/help', description: 'Frequently asked questions' },
      { label: 'Safety information', href: '/safety', description: 'Keeping guests and hosts safe' },
      { label: 'Cancellation options', href: '/cancellations', description: 'Understanding our policies' },
      { label: 'Resources for hosts', href: '/host-resources', description: 'Guides and tips for hosts' },
      { label: 'Community forum', href: '/community', description: 'Connect with other users' },
    ],
  },
  {
    title: 'Company',
    icon: '🏢',
    links: [
      { label: 'Newsroom', href: '/newsroom', description: 'Company news and press' },
      { label: 'Careers', href: '/careers', description: 'Open roles at CasaLux' },
      { label: 'Investors', href: '/investors', description: 'Investor relations' },
    ],
  },
  {
    title: 'Legal',
    icon: '⚖️',
    links: [
      { label: 'Privacy Policy', href: '/privacy', description: 'How we handle your data' },
      { label: 'Terms of Service', href: '/terms', description: 'Rules governing platform use' },
      { label: 'Sitemap', href: '/sitemap', description: 'You are here' },
    ],
  },
]

export default function SitemapPage() {
  return (
    <>
      <PageHero
        label="CasaLux"
        title="Sitemap"
        description="A complete index of every section and page on the CasaLux platform."
      />

      <PageContainerWide>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map(({ title, icon, links }) => (
            <div key={title}>
              <h2 className="flex items-center gap-2 font-semibold text-foreground mb-4 pb-2 border-b border-border">
                <span>{icon}</span> {title}
              </h2>
              <ul className="space-y-2">
                {links.map(({ label, href, description }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="group flex flex-col hover:text-[rgb(var(--gold-600))] transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground group-hover:text-[rgb(var(--gold-600))] transition-colors">
                        {label}
                      </span>
                      {description && (
                        <span className="text-xs text-muted">{description}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </PageContainerWide>
    </>
  )
}
