/**
 * Public listings routes — PRD Section 7.2
 *
 * GET  /api/v1/listings                     → paginated feed + all filters
 * GET  /api/v1/listings/quick-filters       → filter chip metadata + counts
 * GET  /api/v1/listings/recommended         → personalized feed (auth optional)
 * GET  /api/v1/listings/:id                 → single listing detail
 * GET  /api/v1/listings/:id/availability    → blocked dates calendar
 * GET  /api/v1/listings/:id/pricing-preview → price breakdown
 * GET  /api/v1/listings/:id/reviews         → paginated reviews
 *
 * NOTE: static paths (/quick-filters, /recommended) MUST be registered
 *       BEFORE /:id to prevent Hono matching them as the :id param.
 */
import { Hono } from 'hono'
import { ListingService }    from '../services/listing.service.js'
import { ListingController } from '../controllers/listing.controller.js'
import { cacheService, searchService, queueService } from '../container.js'

const service    = new ListingService(cacheService, searchService, queueService)
const controller = new ListingController(service)

export const listingsRouter = new Hono()

// Static sub-paths first (before /:id to avoid param collision)
listingsRouter.get('/quick-filters', (c) => controller.getQuickFilters(c))
listingsRouter.get('/recommended',   (c) => controller.getRecommended(c))

// Root feed
listingsRouter.get('/', (c) => controller.getListings(c))

// Single listing + nested resources
listingsRouter.get('/:id',                    (c) => controller.getListingById(c))
listingsRouter.get('/:id/availability',       (c) => controller.getAvailability(c))
listingsRouter.get('/:id/pricing-preview',    (c) => controller.getPricingPreview(c))
listingsRouter.get('/:id/reviews',            (c) => controller.getReviews(c))
