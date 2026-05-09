// MUST live at project root, not src/middleware.ts — Next 14 + transpilePackages
// silently drops src/middleware.ts and middleware-manifest.json stays empty.
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

const isAuthRequired = createRouteMatcher([
  '/bookings(.*)',
  '/wishlists(.*)',
  '/messages(.*)',
  '/profile(.*)',
  '/host/onboarding(.*)',
  '/listings/(.*)/book(.*)',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

// /host/onboarding + /host/application-pending excluded — must be reachable
// before the role flips to 'host'.
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
  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth()
    if (!userId) return NextResponse.redirect(new URL('/', req.url))
    const role = (sessionClaims?.publicMetadata as Record<string, unknown>)?.role
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

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

  if (isAuthRequired(req)) {
    const { userId } = await auth()
    if (!userId) return redirectToSignIn(req)
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
