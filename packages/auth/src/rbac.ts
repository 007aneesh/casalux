/**
 * RBAC Guards — composable role + ownership middleware.
 * PRD Section 4.3.1 — never trusted from the client, enforced at middleware layer.
 *
 * Usage:
 *   router.put('/:id',
 *     requireAuth(),
 *     requireRole('host'),
 *     requireOwnership('listing', 'hostId'),
 *     handler
 *   )
 */
import type { MiddlewareHandler } from 'hono'
import type { UserRole } from '@casalux/types'
import { db } from '@casalux/db'

type ResourceType = 'listing' | 'booking' | 'booking_request' | 'host_application'

/**
 * requireRole — 403 if the authenticated user's role is not in the allowed list.
 * Admin always passes (admin can do everything host can do).
 */
export function requireRole(...allowedRoles: UserRole[]): MiddlewareHandler {
  return async (c, next) => {
    const authUser = c.get('authUser')

    if (!authUser) {
      return c.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        401
      )
    }

    const { role } = authUser
    // Admin + super_admin pass all role checks except super_admin-only
    const effectiveRoles = role === 'super_admin' ? [...allowedRoles, 'admin', 'super_admin'] : allowedRoles

    if (!effectiveRoles.includes(role) && role !== 'admin' && role !== 'super_admin') {
      return c.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        403
      )
    }

    await next()
  }
}

/**
 * requireOwnership — 403 if the resource's ownerField !== authenticated userId.
 * Fetches the resource from DB to verify ownership.
 */
export function requireOwnership(resourceType: ResourceType, ownerField: string): MiddlewareHandler {
  return async (c, next) => {
    const authUser = c.get('authUser')
    if (!authUser) {
      return c.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        401
      )
    }

    // Admin bypasses ownership checks
    if (authUser.role === 'admin' || authUser.role === 'super_admin') {
      await next()
      return
    }

    const id = c.req.param('id')
    if (!id) {
      return c.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Resource ID required' } },
        400
      )
    }

    // Dynamic DB lookup per resource type
    const tableMap: Record<ResourceType, keyof typeof db> = {
      listing: 'listing',
      booking: 'booking',
      booking_request: 'bookingRequest',
      host_application: 'hostApplication',
    }

    const table = tableMap[resourceType]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resource = await (db[table] as any).findUnique({ where: { id }, select: { [ownerField]: true } })

    if (!resource) {
      return c.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } },
        404
      )
    }

    if (resource[ownerField] !== authUser.userId) {
      return c.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        403
      )
    }

    await next()
  }
}
