/**
 * Vercel serverless entry point.
 *
 * Vercel automatically picks up files in the `api/` directory.
 * The `vercel.json` rewrites all traffic to this function.
 *
 * Uses @hono/node-server/vercel to bridge Hono's Web-API fetch handler
 * to the Node.js (req, res) format that Vercel's Node runtime expects.
 */
import { handle } from '@hono/node-server/vercel'
import app from '../src/app.js'

export default handle(app)
