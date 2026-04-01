/**
 * HostController — dashboard-level aggregates for the host panel.
 *
 * All routes are protected by requireAuth() + requireRole('host') at the router level.
 */
import type { Context } from 'hono'
import { db } from '@casalux/db'

export class HostController {

  /** GET /host/stats — aggregate counts + earnings for the host dashboard */
  async getStats(c: Context): Promise<Response> {
    try {
      const authUser = c.get('authUser')

      // Resolve HostProfile.id — upsert so hosts approved before the profile-creation
      // fix existed get a profile created on first access rather than a hard 404.
      const hostProfile = await db.hostProfile.upsert({
        where:  { userId: authUser.dbUserId },
        update: {},
        create: { userId: authUser.dbUserId },
        select: { id: true },
      })

      const hostProfileId = hostProfile.id
      const now           = new Date()
      const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1)
      const weekAhead     = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const [
        activeListings,
        totalListings,
        pendingRequests,
        confirmedBookings,
        upcomingCheckIns,
        earningsThisMonth,
        earningsAllTime,
      ] = await Promise.all([
        db.listing.count({ where: { hostId: hostProfileId, status: 'active' } }),
        db.listing.count({ where: { hostId: hostProfileId } }),
        db.bookingRequest.count({ where: { hostId: hostProfileId, status: 'pending' } }),
        db.booking.count({ where: { hostId: hostProfileId, status: { in: ['confirmed', 'completed'] } } }),
        db.booking.count({
          where: {
            hostId: hostProfileId,
            status: 'confirmed',
            checkIn: { gte: now, lte: weekAhead },
          },
        }),
        db.hostEarning.aggregate({
          where: { hostId: hostProfileId, createdAt: { gte: monthStart } },
          _sum:  { amount: true },
        }),
        db.hostEarning.aggregate({
          where: { hostId: hostProfileId },
          _sum:  { amount: true },
        }),
      ])

      return c.json({
        success: true,
        data: {
          // Flat shape — matches the HostStats interface consumed by the dashboard
          activeListings:    activeListings,
          totalListings:     totalListings,
          pendingRequests:   pendingRequests,
          confirmedBookings: confirmedBookings,
          upcomingCheckIns:  upcomingCheckIns,
          thisMonthEarnings: earningsThisMonth._sum.amount ?? 0,
          allTimeEarnings:   earningsAllTime._sum.amount   ?? 0,
          // Not yet computed server-side — placeholders so the type is satisfied
          totalBookings:     confirmedBookings,
          totalEarnings:     earningsAllTime._sum.amount ?? 0,
          avgRating:         0,
          reviewCount:       0,
        },
      })
    } catch (err) {
      console.error('[HostController.getStats]', err)
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' } }, 500)
    }
  }
}
