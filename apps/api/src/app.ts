import 'dotenv/config'
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
import { hostRouter, onboardingRouter } from './routes/host.js'
import { adminRouter } from './routes/admin.js'
import { usersRouter } from './routes/users.js'
import { locationsRouter } from './routes/locations.js'
import { messagesRouter } from './routes/messages.js'
import { reviewsRouter } from './routes/reviews.js'
import { searchRouter } from './routes/search.js'
import { errorHandler } from './middleware/error-handler.js'
import { rateLimiter } from './middleware/rate-limiter.js'

const app = new Hono()

// ── Allowed origins ────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env['CORS_ORIGINS'] ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

// Global middleware
app.use('*', logger())
app.use('*', cors({
  // Use a function so origin matching is explicit and whitespace-safe
  origin: (origin) => ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? '',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,   // needed for Authorization header pass-through
  maxAge: 600,         // cache preflight 10 min
}))
app.use('*', secureHeaders({
  // The default is 'same-origin' which blocks ALL cross-origin reads —
  // this is a public API, so it must be 'cross-origin'.
  crossOriginResourcePolicy: 'cross-origin',
}))
app.use('/api/*', rateLimiter)

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.get('/api/v1/openapi.json', (c) => c.json(openApiSpec))

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
v1.route('/host/onboarding', onboardingRouter)
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

export default app
