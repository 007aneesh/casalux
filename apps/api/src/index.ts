import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { openApiSpec } from './docs/openapi.js'

import { listingsRouter } from './routes/listings.js'
import { bookingsRouter } from './routes/bookings.js'
import { bookingRequestsRouter } from './routes/booking-requests.js'
import { uploadsRouter } from './routes/uploads.js'
import { webhooksRouter } from './routes/webhooks.js'
import { hostRouter } from './routes/host.js'
import { adminRouter } from './routes/admin.js'
import { usersRouter } from './routes/users.js'
import { locationsRouter } from './routes/locations.js'
import { messagesRouter } from './routes/messages.js'
import { reviewsRouter } from './routes/reviews.js'
import { searchRouter } from './routes/search.js'
import { errorHandler } from './middleware/error-handler.js'
import { rateLimiter } from './middleware/rate-limiter.js'
import { startSearchIndexingWorker } from './workers/search-indexing.worker.js'
import { startPaymentEventsWorker } from './workers/payment-events.worker.js'
import { ensureESIndices } from './utils/es-init.js'
import { searchService } from './container.js'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', cors({ origin: process.env['CORS_ORIGINS']?.split(',') ?? '*' }))
app.use('*', secureHeaders())
app.use('/api/*', rateLimiter)

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ── Swagger UI ────────────────────────────────────────────────────────────────
// OpenAPI JSON spec — importable into Postman too
app.get('/api/v1/openapi.json', (c) => c.json(openApiSpec))

// Swagger UI — served at /docs, loads spec from /api/v1/openapi.json
app.get('/docs', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CasaLux API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
  <style>
    body { margin: 0; }
    .swagger-ui .topbar { background-color: #1a1a2e; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/v1/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      plugins: [SwaggerUIBundle.plugins.DownloadUrl],
      layout: 'StandaloneLayout',
      persistAuthorization: true,
      tryItOutEnabled: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
    })
  </script>
</body>
</html>`)
})

// API v1 routes
const v1 = new Hono()
v1.route('/listings', listingsRouter)
v1.route('/bookings', bookingsRouter)
v1.route('/booking-requests', bookingRequestsRouter)
v1.route('/uploads', uploadsRouter)
v1.route('/webhooks', webhooksRouter)
v1.route('/host', hostRouter)
v1.route('/admin', adminRouter)
v1.route('/users', usersRouter)
v1.route('/locations', locationsRouter)
v1.route('/messages', messagesRouter)
v1.route('/reviews', reviewsRouter)
v1.route('/search', searchRouter)

app.route('/api/v1', v1)

// Global error handler
app.onError(errorHandler)

// Ensure ES indices exist (idempotent — safe to run on every startup)
ensureESIndices(searchService)

// Start BullMQ workers
startSearchIndexingWorker()
startPaymentEventsWorker()   // concurrency=1 — payment state transitions serialised

const port = parseInt(process.env['PORT'] ?? '3001', 10)

console.log(`🚀 CasaLux API running on port ${port}`)

serve({ fetch: app.fetch, port })

export { app }
