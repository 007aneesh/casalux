/**
 * Next.js middleware — route guards for the casalux web app.
 *
 * IMPORTANT: this file MUST live at the project root (apps/web/middleware.ts),
 * NOT inside src/. Next.js 14 + this monorepo's transpilePackages config
 * silently fails to register middleware when it's at src/middleware.ts —
 * `.next/server/middleware-manifest.json` ends up empty, no compile, no run,
 * and every protected route is open. Verified via the manifest. Do not move.
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

// Auth required, no role restriction (any signed-in user is fine).
const isAuthRequired = createRouteMatcher([
  '/bookings(.*)',
  '/wishlists(.*)',
  '/messages(.*)',
  '/profile(.*)',
  '/host/onboarding(.*)',
  '/listings/(.*)/book(.*)',
])

// Admin / super_admin only. Non-admins (and signed-out users) bounce home.
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

// Host or admin role required — non-hosts get redirected to /become-a-host.
// /host/onboarding and /host/application-pending are intentionally excluded
// (must be accessible before the role is promoted to 'host').
const isHostRoute = createRouteMatcher([
  '/host/dashboard(.*)',
  '/host/listings(.*)',
  '/host/bookings(.*)',
  '/host/calendar(.*)',
])

function redirectToSignIn(req: NextRequest) {
  const url = new URL('/sign-in', req.url)
  url.searchParams.set('redirect_url', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(url)
}

export default clerkMiddleware(async (auth, req) => {
  // Admin-only: signed-out → home, non-admin → home (don't leak existence).
  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth()
    if (!userId) return NextResponse.redirect(new URL('/', req.url))
    const role = (sessionClaims?.publicMetadata as Record<string, unknown>)?.role
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Host-only: signed-out / non-host → /become-a-host with redirected=1
  // breadcrumb so the page can show a "you need to be a host" message.
  if (isHostRoute(req)) {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      const redirectUrl = new URL('/become-a-host', req.url)
      redirectUrl.searchParams.set('redirected', '1')
      return NextResponse.redirect(redirectUrl)
    }
    const role = (sessionClaims?.publicMetadata as Record<string, unknown>)?.role
    if (role !== 'host' && role !== 'admin' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/become-a-host', req.url))
    }
    return NextResponse.next()
  }

  // Generic auth-required: signed-out → /sign-in (preserving destination).
  // We do an explicit redirect rather than auth().protect() because the
  // latter rewrites to a 404 in v5, which is a worse UX than sending the
  // user somewhere they can actually authenticate.
  if (isAuthRequired(req)) {
    const { userId } = await auth()
    if (!userId) return redirectToSignIn(req)
  }
})

export const config = {
  // Run middleware on every request EXCEPT Next internals and static assets.
  // The simpler exclusion pattern recommended by Next docs — much easier to
  // reason about than the previous extension-allowlist regex, and behaves
  // identically for our needs.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
