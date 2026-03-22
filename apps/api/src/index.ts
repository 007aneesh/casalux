import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

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
import { errorHandler } from './middleware/error-handler.js'
import { rateLimiter } from './middleware/rate-limiter.js'
import { startSearchIndexingWorker } from './workers/search-indexing.worker.js'
import { startPaymentEventsWorker } from './workers/payment-events.worker.js'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', cors({ origin: process.env['CORS_ORIGINS']?.split(',') ?? '*' }))
app.use('*', secureHeaders())
app.use('/api/*', rateLimiter)

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

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

app.route('/api/v1', v1)

// Global error handler
app.onError(errorHandler)

// Start BullMQ workers
startSearchIndexingWorker()
startPaymentEventsWorker()   // concurrency=1 — payment state transitions serialised

const port = parseInt(process.env['PORT'] ?? '3001', 10)

console.log(`🚀 CasaLux API running on port ${port}`)

serve({ fetch: app.fetch, port })

export { app }
