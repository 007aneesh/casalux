'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

interface NavItem {
  label: string
  href: string
  icon: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard',          href: '/dashboard',          icon: '▣' },
  { label: 'Listings',           href: '/listings',           icon: '🏠' },
  { label: 'Bookings',           href: '/bookings',           icon: '📋' },
  { label: 'Users',              href: '/users',              icon: '👤' },
  { label: 'Host Applications',  href: '/host-applications',  icon: '📝' },
  { label: 'Audit Log',          href: '/audit-log',          icon: '🔍' },
]

export default function Sidebar(): JSX.Element {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <span className="text-xl font-bold tracking-tight">CasaLux Admin</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </aside>
  )
}
