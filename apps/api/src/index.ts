import { serve } from '@hono/node-server'
import app from './app.js'
import { ensureESIndices } from './utils/es-init.js'
import { searchService } from './container.js'
import { startSearchIndexingWorker } from './workers/search-indexing.worker.js'
import { startPaymentEventsWorker }  from './workers/payment-events.worker.js'
import { emailWorker }               from './workers/email.worker.js'

// ─── Workers ──────────────────────────────────────────────────────────────────
startSearchIndexingWorker()
startPaymentEventsWorker()
// emailWorker starts automatically on import (queueService.process is called at module level)
void emailWorker  // reference so the import isn't tree-shaken

// ─── Boot ─────────────────────────────────────────────────────────────────────
ensureESIndices(searchService)

const port = parseInt(process.env['PORT'] ?? '3001', 10)
console.log(`🚀 CasaLux API running on port ${port}`)

serve({ fetch: app.fetch, port })

export { app }
