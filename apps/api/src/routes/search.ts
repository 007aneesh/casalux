/**
 * Search router — search history save (called by clients after every search).
 * PRD Section 10.4.
 *
 * POST /api/v1/search/history — auth optional (anonymous searches stored by sessionId)
 *
 * Authenticated user history management lives in /api/v1/users/me/search-history.
 */
import { Hono } from 'hono'
import { LocationService }    from '../services/location.service.js'
import { LocationController } from '../controllers/location.controller.js'
import { cacheService } from '../container.js'

const service    = new LocationService(cacheService)
const controller = new LocationController(service)

export const searchRouter = new Hono()

// Optional auth — anonymous users can also have their searches recorded by sessionId
searchRouter.post('/history', (c) => controller.saveSearch(c))
