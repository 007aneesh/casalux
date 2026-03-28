/**
 * AdminController — platform-wide data for the admin dashboard.
 * All routes are protected by requireRole('admin') at the router level.
 */
import type { Context } from 'hono'
import { db } from '@casalux/db'

export class AdminController {

  /** GET /admin/stats */
  async getStats(c: Context): Promise<Response> {
    try {
      const [activeListings, totalBookings, totalUsers, pendingApps] = await Promise.all([
        db.listing.count({ where: { status: 'active' } }),
        db.booking.count(),
        db.user.count({ where: { deletedAt: null } }),
        db.hostApplication.count({ where: { status: 'submitted' } }),
      ])
      return c.json({ activeListings, totalBookings, totalUsers, pendingApps })
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

  /** GET /admin/bookings?page=1 */
  async getBookings(c: Context): Promise<Response> {
    try {
      const page  = Math.max(1, parseInt(c.req.query('page') ?? '1', 10))
      const limit = 20

      const [bookings, total] = await Promise.all([
        db.booking.findMany({
          skip:    (page - 1) * limit,
          take:    limit,
          orderBy: { createdAt: 'desc' },
          include: {
            guest:   { select: { firstName: true, lastName: true, email: true } },
            listing: { select: { title: true, address: true } },
          },
        }),
        db.booking.count(),
      ])

      return c.json({ bookings, total, page, limit })
    } catch (err) {
      console.error('[AdminController.getBookings]', err)
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
            createdAt: true, isBanned: true,
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
}
