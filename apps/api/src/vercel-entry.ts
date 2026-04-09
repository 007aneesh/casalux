/**
 * Vercel serverless entry point.
 *
 * esbuild (esbuild.config.mjs) bundles this file into api/index.js so that
 * Node.js never has to resolve TypeScript workspace packages at runtime.
 * Do not import this file directly — it is only used as an esbuild entry.
 */
import { handle } from '@hono/node-server/vercel'
import app from './app.js'

export default handle(app)
