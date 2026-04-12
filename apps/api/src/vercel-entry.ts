/**
 * Vercel serverless entry point.
 * esbuild bundles this into api/index.js — see esbuild.config.mjs.
 */
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import type { IncomingMessage, ServerResponse } from 'http'

// ─── Prisma engine path override ─────────────────────────────────────────────
// esbuild.config.mjs copies the native query-engine binary next to this
// bundle (api/libquery_engine-rhel-openssl-3.0.x.so.node).
// We set PRISMA_QUERY_ENGINE_LIBRARY *before* any DB imports so Prisma uses
// the bundled binary instead of trying to locate it in node_modules (which
// don't exist in the Vercel serverless deployment).
const _bundleDir = dirname(fileURLToPath(import.meta.url))
process.env['PRISMA_QUERY_ENGINE_LIBRARY'] ??= join(
  _bundleDir,
  'libquery_engine-rhel-openssl-3.0.x.so.node',
)
// ─────────────────────────────────────────────────────────────────────────────

type Handler = (req: IncomingMessage, res: ServerResponse) => void

let handler: Handler

try {
  const { handle } = await import('@hono/node-server/vercel')
  const { default: app } = await import('./app.js')
  handler = handle(app) as Handler
} catch (err) {
  console.error('[casalux] FATAL init error', err)
  handler = (_req, res) => {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      error: 'App failed to initialise',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }))
  }
}

export default handler
