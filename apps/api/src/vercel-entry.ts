// Custom adapter — @hono/node-server/vercel hangs reading bodies on Vercel's
// wrapped IncomingMessage (c.req.text/json/raw.text all 504). Pre-read body
// into a Buffer, hand Hono a clean Web Request.
//
// Do NOT add `fileURLToPath` / `dirname` imports — esbuild's banner injects
// them and duplicates crash the function on boot.
import { join } from 'path'
import type { IncomingMessage, ServerResponse } from 'http'

process.env['PRISMA_QUERY_ENGINE_LIBRARY'] ??= join(
  __dirname,
  'libquery_engine-rhel-openssl-3.0.x.so.node',
)

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

  const anyReq = req as IncomingMessage & { rawBody?: unknown; body?: unknown }
  if (anyReq.rawBody instanceof Uint8Array) return Buffer.from(anyReq.rawBody)
  if (typeof anyReq.rawBody === 'string') return Buffer.from(anyReq.rawBody, 'utf8')
  if (anyReq.body instanceof Uint8Array) return Buffer.from(anyReq.body)
  if (typeof anyReq.body === 'string') return Buffer.from(anyReq.body, 'utf8')

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
    if (key.charCodeAt(0) === 58) continue // skip HTTP/2 pseudo-headers
    headers.append(key, val)
  }
  return headers
}

function buildUrl(req: IncomingMessage, headers: Headers): string {
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
