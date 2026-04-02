/**
 * Vercel serverless entry point.
 *
 * Vercel automatically picks up files in the `api/` directory.
 * The `vercel.json` rewrites all traffic to this function.
 *
 * NOTE: BullMQ workers (search indexing, payment events) are NOT started here
 * because Vercel functions are ephemeral. Those run on Fly.io (workers-main.ts).
 */
import app from '../src/app.js'

export default app.fetch
