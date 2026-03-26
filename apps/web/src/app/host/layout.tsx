import Link from 'next/link'
import { LayoutDashboard, Home, CalendarDays, BookOpen, TrendingUp, MessageCircle, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/host/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/host/listings', icon: Home, label: 'Listings' },
  { href: '/host/bookings', icon: BookOpen, label: 'Requests' },
  { href: '/host/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
]

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 shadow-nav fixed inset-y-0 left-0 z-30 pt-20">
        <div className="px-4 pb-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-3 mb-2">Host Centre</p>
          <nav className="space-y-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-navy hover:bg-gray-50 transition-colors group"
              >
                <item.icon size={18} className="group-hover:text-gold transition-colors" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto px-4 pb-6">
          <Link
            href="/host/listings/new"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gold text-white text-sm font-semibold rounded-xl hover:bg-gold/90 transition-colors"
          >
            + Add listing
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 flex">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-muted hover:text-navy transition-colors"
          >
            <item.icon size={20} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Main */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
