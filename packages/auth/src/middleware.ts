/**
 * Clerk JWT verification middleware for Hono.
 * PRD Section 4.1 — every protected route validates a Clerk JWT via this middleware.
 */
import type { MiddlewareHandler } from 'hono'
import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env['CLERK_SECRET_KEY']! })

/**
 * requireAuth() — validates the Clerk JWT from Authorization header.
 * Attaches userId and authUser to the Hono context.
 * Returns 401 if no valid token.
 */
export function requireAuth(): MiddlewareHandler {
  return async (c, next) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return c.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        401
      )
    }

    try {
      const payload = await clerk.verifyToken(token)
      const userId = payload.sub

      // Attach to context for downstream handlers
      c.set('userId', userId)

      // Fetch user role from Clerk public metadata
      const clerkUser = await clerk.users.getUser(userId)
      const role = (clerkUser.publicMetadata['role'] as string) ?? 'guest'

      c.set('authUser', {
        userId,
        clerkId: userId,
        role: role as import('./types.js').AuthUser['role'],
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      })

      await next()
    } catch {
      return c.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
        401
      )
    }
  }
}
