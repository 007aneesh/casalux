/**
 * Locations router — autocomplete + anonymous search history save.
 * PRD Section 10.3.
 *
 * GET  /api/v1/locations/autocomplete?q=    — optional auth (enriches with recents)
 * POST /api/v1/search/history               — optional auth (save search)
 *
 * Auth-required search history endpoints live in /api/v1/users (users.ts).
 */
import { Hono } from 'hono'
import { LocationService }    from '../services/location.service.js'
import { LocationController } from '../controllers/location.controller.js'
import { cacheService } from '../container.js'

const service    = new LocationService(cacheService)
const controller = new LocationController(service)

export const locationsRouter = new Hono()

// No auth required — autocomplete is public (auth enriches recent section)
locationsRouter.get('/autocomplete', (c) => controller.autocomplete(c))

export { service as locationService, controller as locationController }
