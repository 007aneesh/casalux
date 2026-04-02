import { serve } from '@hono/node-server'
import app from './app.js'
import { startSearchIndexingWorker } from './workers/search-indexing.worker.js'
import { startPaymentEventsWorker } from './workers/payment-events.worker.js'
import { ensureESIndices } from './utils/es-init.js'
import { searchService } from './container.js'

// Ensure ES indices exist (idempotent — safe to run on every startup)
ensureESIndices(searchService)

// Start BullMQ workers
startSearchIndexingWorker()
startPaymentEventsWorker()   // concurrency=1 — payment state transitions serialised

const port = parseInt(process.env['PORT'] ?? '3001', 10)

console.log(`🚀 CasaLux API running on port ${port}`)

serve({ fetch: app.fetch, port })

export { app }
