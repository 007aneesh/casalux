import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Auth required, no role restriction (guests, hosts, anyone logged in)
const isAuthRequired = createRouteMatcher([
  '/bookings(.*)',
  '/wishlists(.*)',
  '/messages(.*)',
  '/profile(.*)',
  '/host/onboarding(.*)',
  '/listings/(.*)/book(.*)',
])

// Host or admin role required — non-hosts get redirected to /become-a-host
// Note: /host/onboarding and /host/application-pending are intentionally excluded
// (accessible before the role is promoted to 'host')
const isHostRoute = createRouteMatcher([
  '/host/dashboard(.*)',
  '/host/listings(.*)',
  '/host/bookings(.*)',
  '/host/calendar(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Host-only routes: check role, redirect non-hosts
  if (isHostRoute(req)) {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      const redirectUrl = new URL('/become-a-host', req.url)
      redirectUrl.searchParams.set('redirected', '1')
      return NextResponse.redirect(redirectUrl)
    }
    const role = (sessionClaims?.publicMetadata as Record<string, unknown>)?.role
    if (role !== 'host' && role !== 'admin') {
      return NextResponse.redirect(new URL('/become-a-host', req.url))
    }
    return NextResponse.next()
  }

  // Auth-required routes: protect (Clerk handles redirect to sign-in)
  if (isAuthRequired(req)) {
    await auth().protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
