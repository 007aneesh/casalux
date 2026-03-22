/**
 * Clerk authentication middleware + RBAC guards.
 * Full implementation lives in packages/auth — these are thin wrappers for the API layer.
 */
import type { MiddlewareHandler } from 'hono'
import { requireAuth, requireRole, requireOwnership } from '@casalux/auth'
import type { ResourceType } from '@casalux/auth'

export { requireAuth, requireRole, requireOwnership }
export type { ResourceType }

// Convenience: combined guard for host who owns the resource
export const requireHostOwner = (resourceType: ResourceType, ownerField: string): MiddlewareHandler[] => [
  requireAuth(),
  requireRole('host'),
  requireOwnership(resourceType, ownerField),
]
