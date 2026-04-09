/**
 * Vercel serverless entry point.
 * esbuild bundles this into api/index.js — see esbuild.config.mjs.
 */
import type { IncomingMessage, ServerResponse } from 'http'

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
