/**
 * Vercel serverless entry point.
 */
let handler: ReturnType<typeof import('@hono/node-server/vercel').handle>

try {
  const { handle } = await import('@hono/node-server/vercel')
  const { default: app } = await import('../src/app.js')
  handler = handle(app)
} catch (err) {
  console.error('[casalux] FATAL: failed to initialise app', err)
  // Return the error as a 500 so we can read it in Vercel's function logs
  handler = (_req: import('http').IncomingMessage, res: import('http').ServerResponse) => {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      error: 'App failed to initialise',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }))
  }
}

export default handler
