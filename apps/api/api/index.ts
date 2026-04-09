/**
 * Vercel serverless entry point.
 *
 * esbuild bundles this file (and all workspace/npm deps) into api/index.js
 * before deployment so Node.js never has to resolve TypeScript source files
 * from workspace packages at runtime.
 */
import { handle } from '@hono/node-server/vercel'
import app from '../src/app.js'

export default handle(app)
