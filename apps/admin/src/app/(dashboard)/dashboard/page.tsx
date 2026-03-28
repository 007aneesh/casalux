import { getStats } from '@/lib/api'
import { Building2, CalendarCheck, Users, ClipboardList } from 'lucide-react'

export default async function DashboardPage() {
  let stats = { activeListings: 0, totalBookings: 0, totalUsers: 0, pendingApps: 0 }
  try { stats = await getStats() } catch {}

  const cards = [
    { label: 'Active Listings',   value: stats.activeListings, icon: Building2,     color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Total Bookings',    value: stats.totalBookings,  icon: CalendarCheck, color: 'text-green-600',  bg: 'bg-green-50'  },
    { label: 'Registered Users',  value: stats.totalUsers,     icon: Users,         color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Pending Host Apps', value: stats.pendingApps,    icon: ClipboardList, color: 'text-amber-600',  bg: 'bg-amber-50'  },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
