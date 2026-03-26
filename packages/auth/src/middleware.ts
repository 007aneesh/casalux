/**
 * Clerk JWT verification middleware for Hono.
 * PRD Section 4.1 — every protected route validates a Clerk JWT via this middleware.
 *
 * User sync: on every authenticated request we upsert the User row in our DB
 * from Clerk's data. This ensures new Clerk sign-ups automatically get a local
 * DB record without needing a separate webhook or seed step.
 */
import type { MiddlewareHandler } from 'hono'
import { createClerkClient, verifyToken } from '@clerk/backend'
import { db } from '@casalux/db'

const clerk = createClerkClient({ secretKey: process.env['CLERK_SECRET_KEY']! })

/**
 * requireAuth() — validates the Clerk JWT from Authorization header.
 * Attaches userId and authUser to the Hono context.
 * Auto-upserts the User record in the local DB from Clerk data.
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
      const payload = await verifyToken(token, { secretKey: process.env['CLERK_SECRET_KEY']! })
      const userId = payload.sub

      // Attach clerkId to context immediately
      c.set('userId', userId)

      // Fetch full Clerk user for metadata + profile fields
      const clerkUser = await clerk.users.getUser(userId)
      const role = (clerkUser.publicMetadata['role'] as string) ?? 'guest'
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''

      // Sync to local DB — ensures every Clerk user has a DB row.
      // update: keeps profile fields fresh; create: bootstraps new sign-ups.
      await db.user.upsert({
        where:  { clerkId: userId },
        update: {
          email,
          firstName:       clerkUser.firstName ?? '',
          lastName:        clerkUser.lastName  ?? '',
          profileImageUrl: clerkUser.imageUrl  ?? null,
          role:            role as any,
        },
        create: {
          clerkId:         userId,
          email,
          firstName:       clerkUser.firstName ?? '',
          lastName:        clerkUser.lastName  ?? '',
          profileImageUrl: clerkUser.imageUrl  ?? null,
          role:            (role as any) ?? 'guest',
        },
      })

      c.set('authUser', {
        userId,
        clerkId: userId,
        role: role as import('./types.js').AuthUser['role'],
        email,
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
