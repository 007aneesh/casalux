/**
 * Vercel serverless entry point.
 * esbuild bundles this into api/index.js — see esbuild.config.mjs.
 *
 * NOTE: Do NOT add `import { fileURLToPath } from 'url'` or
 * `import { dirname } from 'path'` here. The esbuild banner already injects
 * those imports + `__dirname` at the top of the bundle. Duplicate ESM import
 * declarations cause a SyntaxError and crash the function before it starts.
 *
 * ─── Why we don't use @hono/node-server/vercel ──────────────────────────────
 * The official adapter relies on Vercel pre-populating `incoming.rawBody` as
 * a Buffer; when that isn't set (some Vercel runtimes, certain content-types,
 * larger payloads), Hono falls back to `Readable.toWeb(incoming)` which on
 * Vercel's wrapped IncomingMessage hangs forever — every POST that reads the
 * body 504s at the function timeout. Symptoms: `c.req.text()`, `c.req.json()`,
 * `c.req.raw.text()` all hang, regardless of which one you call.
 *
 * Our own adapter reads the body up-front into a Buffer (using `req.rawBody`
 * if Vercel populated it, otherwise draining the stream), constructs a clean
 * Web Request with that body, and calls `app.fetch(request)` directly. Hono
 * only ever sees a Web Request whose body is already materialized — no
 * streaming, no IncomingMessage wrappers, no hangs. Local dev (tsx + Hono's
 * own serve()) is unaffected; this code path only runs on Vercel.
 */
import { join } from 'path'
import type { IncomingMessage, ServerResponse } from 'http'

// ─── Prisma engine path override ─────────────────────────────────────────────
// esbuild.config.mjs copies the native query-engine binary next to this
// bundle (api/libquery_engine-rhel-openssl-3.0.x.so.node).
// We set PRISMA_QUERY_ENGINE_LIBRARY *before* any DB imports so Prisma uses
// the bundled binary instead of trying to locate it in node_modules (which
// don't exist in the Vercel serverless deployment).
// __dirname is injected by the esbuild banner — points to the bundle directory.
process.env['PRISMA_QUERY_ENGINE_LIBRARY'] ??= join(
  __dirname,
  'libquery_engine-rhel-openssl-3.0.x.so.node',
)
// ─────────────────────────────────────────────────────────────────────────────

type FetchApp = { fetch: (request: Request) => Promise<Response> }
type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>

let appPromise: Promise<FetchApp> | null = null
async function getApp(): Promise<FetchApp> {
  if (!appPromise) appPromise = import('./app.js').then((m) => m.default as FetchApp)
  return appPromise
}

async function readBody(req: IncomingMessage): Promise<Buffer | null> {
  const method = req.method ?? 'GET'
  if (method === 'GET' || method === 'HEAD') return null

  // Vercel often pre-buffers the body and exposes it as `req.rawBody`. Use
  // the fast path when it does — saves a stream drain and works even if the
  // underlying socket has already been consumed.
  const anyReq = req as IncomingMessage & { rawBody?: unknown; body?: unknown }
  if (anyReq.rawBody instanceof Uint8Array) return Buffer.from(anyReq.rawBody)
  if (typeof anyReq.rawBody === 'string') return Buffer.from(anyReq.rawBody, 'utf8')
  if (anyReq.body instanceof Uint8Array) return Buffer.from(anyReq.body)
  if (typeof anyReq.body === 'string') return Buffer.from(anyReq.body, 'utf8')

  // Fallback: drain the IncomingMessage. We don't pass a timeout here — the
  // function-level Vercel timeout is the upper bound. If the client never
  // sends the body, the function will be killed by Vercel before this hangs.
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function buildHeaders(req: IncomingMessage): Headers {
  const headers = new Headers()
  const raw = req.rawHeaders
  for (let i = 0; i < raw.length; i += 2) {
    const key = raw[i]
    const val = raw[i + 1]
    if (!key || val == null) continue
    // Skip HTTP/2 pseudo-headers (`:authority`, `:scheme`, …) — Web Request
    // forbids them.
    if (key.charCodeAt(0) === 58) continue
    headers.append(key, val)
  }
  return headers
}

function buildUrl(req: IncomingMessage, headers: Headers): string {
  // Vercel always terminates TLS in front of the function and forwards plain
  // HTTP, so we can't rely on `req.socket.encrypted`. The `x-forwarded-proto`
  // header is the source of truth — fallback to `https` for safety.
  const proto = headers.get('x-forwarded-proto') ?? 'https'
  const host = headers.get('host') ?? 'localhost'
  const path = req.url ?? '/'
  return `${proto}://${host}${path}`
}

const handler: Handler = async (req, res) => {
  try {
    const app = await getApp()
    const headers = buildHeaders(req)
    const url = buildUrl(req, headers)
    const init: RequestInit = { method: req.method ?? 'GET', headers }

    const body = await readBody(req)
    if (body !== null) init.body = body

    const request = new Request(url, init)
    const response = await app.fetch(request)

    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      // `set-cookie` can repeat — `setHeader` last-wins on Node, but since
      // Hono never emits multiple Set-Cookies through a single Headers
      // object today this is fine. Revisit if that changes.
      res.setHeader(key, value)
    })

    if (response.body) {
      const reader = response.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) res.write(value)
      }
    }
    res.end()
  } catch (err) {
    console.error('[casalux] handler error', err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
    }
    res.end(
      JSON.stringify({
        error: 'Handler crashed',
        message: err instanceof Error ? err.message : String(err),
      }),
    )
  }
}

export default handler
