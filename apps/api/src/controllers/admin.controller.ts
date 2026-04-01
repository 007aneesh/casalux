/**
 * AdminController — platform-wide data for the admin dashboard.
 * All routes are protected by requireRole('admin') at the router level.
 */
import type { Context } from 'hono'
import { db } from '@casalux/db'
import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env['CLERK_SECRET_KEY']! })

async function logAudit(params: {
  actorClerkId: string
  action: string
  entityType: string
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  c: Context
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId:    params.actorClerkId,
        action:     params.action,
        entityType: params.entityType,
        entityId:   params.entityId,
        before:     params.before  ?? undefined,
        after:      params.after   ?? undefined,
        ip:         params.c.req.header('x-forwarded-for') ?? params.c.req.header('x-real-ip') ?? undefined,
        userAgent:  params.c.req.header('user-agent') ?? undefined,
      },
    })
  } catch { /* audit failure must not break the primary operation */ }
}

export class AdminController {

  /** GET /admin/stats */
  async getStats(c: Context): Promise<Response> {
    try {
      const [activeListings, totalBookings, totalUsers, pendingApps, flaggedListings, disputedBookings] = await Promise.all([
        db.listing.count({ where: { status: 'active' } }),
        db.booking.count(),
        db.user.count({ where: { deletedAt: null } }),
        db.hostApplication.count({ where: { status: 'submitted' } }),
        db.listing.count({ where: { status: 'flagged' } }),
        db.booking.count({ where: { status: 'disputed' } }),
      ])
      return c.json({ activeListings, totalBookings, totalUsers, pendingApps, flaggedListings, disputedBookings })
    } catch (err) {
      console.error('[AdminController.getStats]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** GET /admin/listings?page=1&status= */
  async getListings(c: Context): Promise<Response> {
    try {
      const page   = Math.max(1, parseInt(c.req.query('page') ?? '1', 10))
      const limit  = 20
      const status = c.req.query('status') as string | undefined

      const where = status ? { status: status as never } : {}

      const [listings, total] = await Promise.all([
        db.listing.findMany({
          where,
          skip:    (page - 1) * limit,
          take:    limit,
          orderBy: { createdAt: 'desc' },
          include: {
            host: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
          },
        }),
        db.listing.count({ where }),
      ])

      return c.json({ listings, total, page, limit })
    } catch (err) {
      console.error('[AdminController.getListings]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** POST /admin/listings/:id/amenities — create + attach a custom amenity */
  async addCustomAmenity(c: Context): Promise<Response> {
    try {
      const id   = c.req.param('id')
      const body = await c.req.json() as { name?: string }
      const name = body.name?.trim()
      if (!name) return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } }, 400)

      const listing = await db.listing.findUnique({ where: { id }, select: { id: true } })
      if (!listing) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)

      const slug = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`

      const amenity = await db.amenity.upsert({
        where:  { slug },
        create: { slug, name, category: 'Custom' },
        update: {},
      })

      await db.listingAmenity.upsert({
        where:  { listingId_amenityId: { listingId: id, amenityId: amenity.id } },
        create: { listingId: id, amenityId: amenity.id },
        update: {},
      })

      return c.json({ success: true, data: { slug: amenity.slug, name: amenity.name, category: amenity.category } })
    } catch (err) {
      console.error('[AdminController.addCustomAmenity]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** PATCH /admin/listings/:id/status */
  async updateListingStatus(c: Context): Promise<Response> {
    try {
      const id     = c.req.param('id')
      const body   = await c.req.json() as { status: string }
      const listing = await db.listing.update({
        where: { id },
        data:  { status: body.status as never },
      })
      return c.json({ listing })
    } catch (err) {
      console.error('[AdminController.updateListingStatus]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** GET /admin/bookings?page=1&status=&from=&to= */
  async getBookings(c: Context): Promise<Response> {
    try {
      const page   = Math.max(1, parseInt(c.req.query('page') ?? '1', 10))
      const limit  = 20
      const status = c.req.query('status') as string | undefined
      const from   = c.req.query('from')
      const to     = c.req.query('to')

      const where: Record<string, unknown> = {}
      if (status) where['status'] = status
      if (from || to) {
        where['checkIn'] = {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to   ? { lte: new Date(to)   } : {}),
        }
      }

      const [bookings, total] = await Promise.all([
        db.booking.findMany({
          where,
          skip:    (page - 1) * limit,
          take:    limit,
          orderBy: { createdAt: 'desc' },
          include: {
            guest:   { select: { firstName: true, lastName: true, email: true } },
            listing: { select: { title: true, address: true } },
          },
        }),
        db.booking.count({ where }),
      ])

      return c.json({ bookings, total, page, limit })
    } catch (err) {
      console.error('[AdminController.getBookings]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** GET /admin/bookings/:id — full booking detail */
  async getBookingDetail(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id')

      const booking = await db.booking.findUnique({
        where: { id },
        include: {
          guest:         { select: { id: true, clerkId: true, firstName: true, lastName: true, email: true, profileImageUrl: true, verificationStatus: true } },
          listing:       { select: { id: true, title: true, address: true, basePrice: true, currency: true } },
          review:        true,
          paymentEvents: { orderBy: { createdAt: 'desc' } },
          earnings:      true,
        },
      })
      if (!booking) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } }, 404)

      // Resolve host info from denormalized hostId (HostProfile.id)
      const hostProfile = await db.hostProfile.findUnique({
        where:   { id: booking.hostId },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, profileImageUrl: true } } },
      })

      const { earnings, ...bookingRest } = booking
      return c.json({ success: true, data: { ...bookingRest, hostEarning: earnings[0] ?? null, hostProfile } })
    } catch (err) {
      console.error('[AdminController.getBookingDetail]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** PATCH /admin/bookings/:id/cancel — body: { reason: string, refundAmount?: number } */
  async cancelBooking(c: Context): Promise<Response> {
    try {
      const id       = c.req.param('id')
      const authUser = c.get('authUser')
      const body     = await c.req.json() as { reason?: string; refundAmount?: number }

      const booking = await db.booking.findUnique({ where: { id }, select: { id: true, status: true, totalAmount: true } })
      if (!booking) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } }, 404)

      const terminalStatuses = ['completed', 'guest_cancelled', 'cancelled_by_host', 'cancelled_by_admin', 'host_declined', 'request_expired', 'payment_window_expired', 'payment_expired']
      if (terminalStatuses.includes(booking.status)) {
        return c.json({ success: false, error: { code: 'CONFLICT', message: 'Booking is already in a terminal state' } }, 409)
      }

      const data: Record<string, unknown> = {
        status:             'cancelled_by_admin',
        cancelledBy:        'admin',
        cancellationReason: body.reason?.trim() || null,
      }
      if (typeof body.refundAmount === 'number') {
        data['refundAmount'] = body.refundAmount
        data['refundStatus'] = 'requested'
      }

      const before = { status: booking.status, refundStatus: undefined }
      await db.booking.update({ where: { id }, data: data as never })
      await logAudit({ actorClerkId: authUser.clerkId, action: 'booking.cancel_admin', entityType: 'booking', entityId: id, before, after: data, c })

      return c.json({ success: true })
    } catch (err) {
      console.error('[AdminController.cancelBooking]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** PATCH /admin/bookings/:id/refund — body: { refundAmount: number, refundStatus: string } */
  async overrideRefund(c: Context): Promise<Response> {
    try {
      const id       = c.req.param('id')
      const authUser = c.get('authUser')
      const body     = await c.req.json() as { refundAmount: number; refundStatus: string }

      const validStatuses = ['none', 'requested', 'partial', 'full', 'processed']
      if (!validStatuses.includes(body.refundStatus)) {
        return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid refundStatus' } }, 400)
      }

      const booking = await db.booking.findUnique({ where: { id }, select: { id: true, refundAmount: true, refundStatus: true } })
      if (!booking) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } }, 404)

      await db.booking.update({
        where: { id },
        data:  { refundAmount: body.refundAmount, refundStatus: body.refundStatus as never },
      })
      await logAudit({ actorClerkId: authUser.clerkId, action: 'booking.refund_override', entityType: 'booking', entityId: id, before: { refundAmount: booking.refundAmount, refundStatus: booking.refundStatus }, after: { refundAmount: body.refundAmount, refundStatus: body.refundStatus }, c })

      return c.json({ success: true })
    } catch (err) {
      console.error('[AdminController.overrideRefund]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** PATCH /admin/bookings/:id/payout — body: { payoutStatus: string } */
  async overridePayout(c: Context): Promise<Response> {
    try {
      const id       = c.req.param('id')
      const authUser = c.get('authUser')
      const body     = await c.req.json() as { payoutStatus: string }

      const validStatuses = ['pending', 'initiated', 'settled']
      if (!validStatuses.includes(body.payoutStatus)) {
        return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payoutStatus' } }, 400)
      }

      const booking = await db.booking.findUnique({ where: { id }, select: { id: true, payoutStatus: true } })
      if (!booking) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } }, 404)

      await db.$transaction(async (tx) => {
        await tx.booking.update({ where: { id }, data: { payoutStatus: body.payoutStatus as never } })
        await tx.hostEarning.updateMany({ where: { bookingId: id }, data: { payoutStatus: body.payoutStatus as never } })
      })
      await logAudit({ actorClerkId: authUser.clerkId, action: 'booking.payout_override', entityType: 'booking', entityId: id, before: { payoutStatus: booking.payoutStatus }, after: { payoutStatus: body.payoutStatus }, c })

      return c.json({ success: true })
    } catch (err) {
      console.error('[AdminController.overridePayout]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** PATCH /admin/bookings/:id/dispute — body: { disputed: boolean, reason?: string } */
  async setDispute(c: Context): Promise<Response> {
    try {
      const id       = c.req.param('id')
      const authUser = c.get('authUser')
      const body     = await c.req.json() as { disputed: boolean; reason?: string }

      const booking = await db.booking.findUnique({ where: { id }, select: { id: true, status: true } })
      if (!booking) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } }, 404)

      const newStatus = body.disputed ? 'disputed' : 'confirmed'
      await db.booking.update({
        where: { id },
        data:  {
          status:             newStatus as never,
          cancellationReason: body.disputed ? (body.reason?.trim() || null) : null,
        },
      })
      await logAudit({ actorClerkId: authUser.clerkId, action: body.disputed ? 'booking.dispute_flag' : 'booking.dispute_resolve', entityType: 'booking', entityId: id, before: { status: booking.status }, after: { status: newStatus }, c })

      return c.json({ success: true })
    } catch (err) {
      console.error('[AdminController.setDispute]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** GET /admin/users?page=1&role= */
  async getUsers(c: Context): Promise<Response> {
    try {
      const page  = Math.max(1, parseInt(c.req.query('page') ?? '1', 10))
      const limit = 20
      const role  = c.req.query('role') as string | undefined

      const where = {
        deletedAt: null,
        ...(role ? { role: role as never } : {}),
      }

      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          skip:    (page - 1) * limit,
          take:    limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, clerkId: true, email: true,
            firstName: true, lastName: true,
            role: true, verificationStatus: true,
            createdAt: true, isBanned: true, deletedAt: true,
          },
        }),
        db.user.count({ where }),
      ])

      return c.json({ users, total, page, limit })
    } catch (err) {
      console.error('[AdminController.getUsers]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** GET /admin/users/:id — full user detail with stats */
  async getUserDetail(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id')

      const user = await db.user.findUnique({
        where: { id },
        include: {
          hostProfile: true,
          hostApplications: {
            orderBy: { createdAt: 'desc' },
            take:    1,
            select:  { id: true, status: true, submittedAt: true, rejectionReason: true, createdAt: true },
          },
        },
      })
      if (!user) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, 404)

      const [guestBookingStats, reviewStats, recentBookings, recentListings] = await Promise.all([
        db.booking.aggregate({
          where: { guestId: user.clerkId },
          _count: { id: true },
          _sum:   { totalAmount: true },
        }),
        db.review.aggregate({
          where: { guestId: user.clerkId },
          _count: { id: true },
          _avg:   { rating: true },
        }),
        db.booking.findMany({
          where:   { guestId: user.clerkId },
          orderBy: { createdAt: 'desc' },
          take:    5,
          select:  {
            id: true, status: true, checkIn: true, checkOut: true,
            totalAmount: true, currency: true, createdAt: true, nights: true,
            listing: { select: { id: true, title: true } },
          },
        }),
        user.hostProfile
          ? db.listing.findMany({
              where:   { hostId: user.hostProfile.id },
              orderBy: { createdAt: 'desc' },
              take:    5,
              select:  { id: true, title: true, status: true, basePrice: true, currency: true, avgRating: true },
            })
          : [],
      ])

      const hostListingStats = user.hostProfile
        ? await db.listing.groupBy({
            by:    ['status'],
            where: { hostId: user.hostProfile.id },
            _count: { id: true },
          })
        : []

      const totalListings  = hostListingStats.reduce((s, r) => s + r._count.id, 0)
      const activeListings = hostListingStats.find((r) => r.status === 'active')?._count.id ?? 0

      return c.json({
        success: true,
        data: {
          user,
          stats: {
            guestBookings: {
              count:      guestBookingStats._count.id,
              totalSpent: guestBookingStats._sum.totalAmount ?? 0,
            },
            reviews: {
              count:     reviewStats._count.id,
              avgRating: Number((reviewStats._avg.rating ?? 0)).toFixed(1),
            },
            host: user.hostProfile ? { totalListings, activeListings } : null,
          },
          recentBookings,
          recentListings,
        },
      })
    } catch (err) {
      console.error('[AdminController.getUserDetail]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** PATCH /admin/users/:id/ban */
  async banUser(c: Context): Promise<Response> {
    try {
      const id       = c.req.param('id')
      const authUser = c.get('authUser')
      const body     = await c.req.json() as { reason?: string }

      const target = await db.user.findUnique({ where: { id }, select: { role: true, isBanned: true, clerkId: true } })
      if (!target) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, 404)
      if (target.clerkId === authUser.clerkId) return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot ban yourself' } }, 403)
      if ((target.role === 'admin' || target.role === 'super_admin') && authUser.role !== 'super_admin') {
        return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Only super admins can ban admin accounts' } }, 403)
      }

      await db.user.update({ where: { id }, data: { isBanned: true, bannedReason: body.reason?.trim() || null } })
      await logAudit({ actorClerkId: authUser.clerkId, action: 'user.ban', entityType: 'user', entityId: id, before: { isBanned: false }, after: { isBanned: true, bannedReason: body.reason }, c })

      return c.json({ success: true })
    } catch (err) {
      console.error('[AdminController.banUser]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** PATCH /admin/users/:id/unban */
  async unbanUser(c: Context): Promise<Response> {
    try {
      const id       = c.req.param('id')
      const authUser = c.get('authUser')

      const target = await db.user.findUnique({ where: { id }, select: { isBanned: true, bannedReason: true } })
      if (!target) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, 404)

      await db.user.update({ where: { id }, data: { isBanned: false, bannedReason: null } })
      await logAudit({ actorClerkId: authUser.clerkId, action: 'user.unban', entityType: 'user', entityId: id, before: { isBanned: true, bannedReason: target.bannedReason }, after: { isBanned: false }, c })

      return c.json({ success: true })
    } catch (err) {
      console.error('[AdminController.unbanUser]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** PATCH /admin/users/:id/verify — body: { verified: boolean } */
  async setVerification(c: Context): Promise<Response> {
    try {
      const id       = c.req.param('id')
      const authUser = c.get('authUser')
      const body     = await c.req.json() as { verified: boolean }

      const status = body.verified ? 'verified' : 'unverified'
      const target = await db.user.findUnique({ where: { id }, select: { verificationStatus: true } })
      if (!target) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, 404)

      await db.user.update({ where: { id }, data: { verificationStatus: status as never } })
      await logAudit({ actorClerkId: authUser.clerkId, action: `user.${status}`, entityType: 'user', entityId: id, before: { verificationStatus: target.verificationStatus }, after: { verificationStatus: status }, c })

      return c.json({ success: true })
    } catch (err) {
      console.error('[AdminController.setVerification]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** PATCH /admin/users/:id/role — body: { role: string } */
  async changeRole(c: Context): Promise<Response> {
    try {
      const id       = c.req.param('id')
      const authUser = c.get('authUser')
      const body     = await c.req.json() as { role: string }

      const allowed = ['guest', 'host', 'admin', 'super_admin']
      if (!allowed.includes(body.role)) {
        return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid role' } }, 400)
      }
      if ((body.role === 'admin' || body.role === 'super_admin') && authUser.role !== 'super_admin') {
        return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Only super admins can assign admin roles' } }, 403)
      }

      const user = await db.user.findUnique({ where: { id }, select: { id: true, clerkId: true, role: true } })
      if (!user) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, 404)
      if (user.clerkId === authUser.clerkId) return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot change your own role' } }, 403)

      // Sync to Clerk first — auth middleware reads from Clerk, so DB-only change gets overwritten
      await clerk.users.updateUser(user.clerkId, { publicMetadata: { role: body.role } })

      await db.user.update({ where: { id }, data: { role: body.role as never } })

      // Promote to host: ensure HostProfile exists
      if (body.role === 'host') {
        await db.hostProfile.upsert({ where: { userId: id }, create: { userId: id }, update: {} })
      }

      await logAudit({ actorClerkId: authUser.clerkId, action: 'user.role_change', entityType: 'user', entityId: id, before: { role: user.role }, after: { role: body.role }, c })

      return c.json({ success: true })
    } catch (err) {
      console.error('[AdminController.changeRole]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** PATCH /admin/users/:id/superhost — body: { grant: boolean } */
  async toggleSuperhost(c: Context): Promise<Response> {
    try {
      const id       = c.req.param('id')
      const authUser = c.get('authUser')
      const body     = await c.req.json() as { grant: boolean }

      const user = await db.user.findUnique({ where: { id }, include: { hostProfile: true } })
      if (!user) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, 404)
      if (!user.hostProfile) return c.json({ success: false, error: { code: 'BAD_REQUEST', message: 'User does not have a host profile' } }, 400)

      const before = { isSuperhost: user.hostProfile.isSuperhost }
      await db.hostProfile.update({
        where: { userId: id },
        data:  { isSuperhost: body.grant, superhostGrantedAt: body.grant ? new Date() : null },
      })
      await logAudit({ actorClerkId: authUser.clerkId, action: body.grant ? 'user.superhost_grant' : 'user.superhost_revoke', entityType: 'user', entityId: id, before, after: { isSuperhost: body.grant }, c })

      return c.json({ success: true })
    } catch (err) {
      console.error('[AdminController.toggleSuperhost]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  /** DELETE /admin/users/:id — soft delete */
  async deleteUser(c: Context): Promise<Response> {
    try {
      const id       = c.req.param('id')
      const authUser = c.get('authUser')

      const user = await db.user.findUnique({ where: { id }, select: { role: true, deletedAt: true, clerkId: true } })
      if (!user) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, 404)
      if (user.clerkId === authUser.clerkId) return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot delete your own account' } }, 403)
      if (user.deletedAt) return c.json({ success: false, error: { code: 'CONFLICT', message: 'Account already deleted' } }, 409)
      if ((user.role === 'admin' || user.role === 'super_admin') && authUser.role !== 'super_admin') {
        return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Only super admins can delete admin accounts' } }, 403)
      }

      await db.user.update({ where: { id }, data: { deletedAt: new Date() } })
      await logAudit({ actorClerkId: authUser.clerkId, action: 'user.soft_delete', entityType: 'user', entityId: id, before: { deletedAt: null }, after: { deletedAt: new Date().toISOString() }, c })

      return c.json({ success: true })
    } catch (err) {
      console.error('[AdminController.deleteUser]', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }
}
