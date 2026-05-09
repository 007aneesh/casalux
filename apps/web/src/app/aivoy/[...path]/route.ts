/**
 * Reverse proxy for the aivoy concierge embed.
 *
 * Why this exists, in order:
 *
 *   1. aivoy.vercel.app is on Vercel's free plan. Its system DDoS mitigations
 *      were flagging cross-site <script> loads from casalux-web with
 *      `x-vercel-mitigated: deny` (403). We can't tune that without Pro.
 *
 *   2. We tried a Next.js `rewrites()` rule. That made loader.js and
 *      standalone.js work, but the next call (`/api/v1/config?token=…`) failed
 *      with `Origin "<missing>" is not allowed for this token`. Reason: once
 *      the embed is same-origin to casalux-web, the browser stops sending
 *      `Origin` on GETs. aivoy's tokenContext requires Origin to be present
 *      and in the per-token allowlist (lib/chat/tokenContext.ts).
 *
 *   3. So we proxy at the route-handler layer and explicitly inject Origin
 *      = our public site URL. Add that exact value to the token's allowed
 *      origins in the aivoy dashboard.
 *
 * Long-term, the right fix is a custom domain on the aivoy project so other
 * customer sites don't each need a proxy hack. This is the bandage that
 * unblocks casalux today.
 */
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TARGET = (process.env.AIVOY_PROXY_TARGET ?? 'https://aivoy.vercel.app').replace(/\/$/, '')

// What we tell aivoy our origin is. Must match an entry in the integration
// token's `allowedOrigins`. Defaults to NEXT_PUBLIC_APP_URL so prod, preview,
// and local dev each forward their own origin without code changes.
const FORWARDED_ORIGIN = (
  process.env.AIVOY_FORWARDED_ORIGIN ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'https://casalux-web.vercel.app'
).replace(/\/$/, '')

// Hop-by-hop / connection-level headers that should never be forwarded by a
// proxy (RFC 7230 §6.1). `host` is overridden separately so the upstream sees
// its own hostname for SNI/cert reasons.
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length', // recomputed by fetch from the body
])

async function proxy(req: NextRequest, path: string[]): Promise<Response> {
  const targetUrl = new URL(`${TARGET}/${path.join('/')}`)
  // Preserve query params (?token=… etc.)
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value)
  })

  const headers = new Headers()
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value)
  })
  // Inject the origin aivoy expects. Browsers omit Origin on same-origin GET,
  // and even on cross-origin requests we want the upstream to see *our*
  // public-facing origin, not the internal proxy hostname.
  headers.set('origin', FORWARDED_ORIGIN)
  headers.set('referer', `${FORWARDED_ORIGIN}/`)

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
    // GET/HEAD requests must not have a body. For everything else, stream
    // the original body straight through — this preserves SSE upload bodies
    // and avoids buffering large payloads in memory.
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
    // @ts-expect-error — `duplex` is required by Node fetch when streaming
    duplex: 'half',
  }

  const upstream = await fetch(targetUrl, init)

  // Strip hop-by-hop headers from the response too, then stream the body
  // back to the browser. Critically: do NOT buffer — the chat endpoint
  // returns Server-Sent Events that must arrive token-by-token.
  //
  // Also strip `content-encoding` and `content-length`: undici (Node's fetch)
  // auto-decompresses brotli/gzip bodies, so by the time we forward them the
  // body is plain text. Forwarding the original `content-encoding: br` header
  // makes the browser try to brotli-decode plain text, which corrupts the
  // first few bytes (caused `Unexpected token '*'` on loader.js).
  // `content-length` is recomputed by the framework when streaming.
  const respHeaders = new Headers()
  upstream.headers.forEach((value, key) => {
    const k = key.toLowerCase()
    if (HOP_BY_HOP.has(k)) return
    if (k === 'content-encoding' || k === 'content-length') return
    respHeaders.set(key, value)
  })

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  })
}

// Next.js 14: `params` is a sync object, not a Promise. (Next 15 made it async.)
type Ctx = { params: { path: string[] } }

async function handler(req: NextRequest, ctx: Ctx): Promise<Response> {
  return proxy(req, ctx.params.path ?? [])
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
export const HEAD = handler
