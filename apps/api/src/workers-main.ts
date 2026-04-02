/**
 * workers-main.ts — Fly.io entry point
 *
 * Starts only the long-running BullMQ workers.
 * No HTTP server. Deployed separately to Fly.io free tier.
 * The Hono API routes run on Vercel serverless.
 */
import 'dotenv/config'
import { startSearchIndexingWorker } from './workers/search-indexing.worker.js'
import { startPaymentEventsWorker } from './workers/payment-events.worker.js'
import { ensureESIndices } from './utils/es-init.js'
import { searchService } from './container.js'

console.log('🔧 CasaLux Workers starting...')

ensureESIndices(searchService)

startSearchIndexingWorker()
startPaymentEventsWorker()

console.log('✅ Workers running — search indexing + payment events')
