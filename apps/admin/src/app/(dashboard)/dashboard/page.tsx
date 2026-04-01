import Link from 'next/link'
import { getStats } from '@/lib/api'
import { Building2, CalendarCheck, Users, ClipboardList, Flag, AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  let stats = { activeListings: 0, totalBookings: 0, totalUsers: 0, pendingApps: 0, flaggedListings: 0, disputedBookings: 0 }
  try { stats = await getStats() } catch {}

  const cards = [
    {
      label: 'Active Listings',
      value: stats.activeListings,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/listings?status=active',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: CalendarCheck,
      color: 'text-green-600',
      bg: 'bg-green-50',
      href: '/bookings',
    },
    {
      label: 'Registered Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/users',
    },
    {
      label: 'Pending Host Apps',
      value: stats.pendingApps,
      icon: ClipboardList,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/host-applications?status=submitted',
      urgent: stats.pendingApps > 0,
    },
  ]

  const alerts = [
    {
      label: 'Flagged Listings',
      value: stats.flaggedListings,
      icon: Flag,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      href: '/listings?status=flagged',
      urgent: stats.flaggedListings > 0,
    },
    {
      label: 'Disputed Bookings',
      value: stats.disputedBookings,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      href: '/bookings?status=disputed',
      urgent: stats.disputedBookings > 0,
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Overview</h1>

      {/* Primary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {cards.map(({ label, value, icon: Icon, color, bg, href, urgent }) => (
          <Link
            key={label}
            href={href}
            className={`block bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
              urgent ? 'border-amber-300 ring-1 ring-amber-300' : 'border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
            {urgent && (
              <p className="text-xs text-amber-600 mt-1 font-medium">Requires attention</p>
            )}
          </Link>
        ))}
      </div>

      {/* Alert queue — flagged & disputed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {alerts.map(({ label, value, icon: Icon, color, bg, href, urgent }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center justify-between bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow ${
              urgent ? 'border-red-200 ring-1 ring-red-200' : 'border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{value.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
            {urgent ? (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                Review now →
              </span>
            ) : (
              <span className="text-xs text-gray-400">View →</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
