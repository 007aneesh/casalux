/**
 * Host routes — PRD Sections 7.5, 12 + Booking Addendum Sections 6.3
 *
 * All routes require auth + requireRole('host')
 *
 * Listings:
 *   POST   /api/v1/host/listings              → create listing (draft)
 *   GET    /api/v1/host/listings              → list own listings
 *   GET    /api/v1/host/listings/:id          → get single listing (own only)
 *   PUT    /api/v1/host/listings/:id          → full update
 *   PATCH  /api/v1/host/listings/:id/status   → change status
 *   PUT    /api/v1/host/listings/:id/availability → set blocked dates / rules
 *
 * Bookings:
 *   GET    /api/v1/host/bookings              → all incoming bookings
 *   GET    /api/v1/host/bookings/:id          → booking detail
 *   POST   /api/v1/host/bookings/:id/cancel   → cancel confirmed booking (penalty applied)
 *
 * Booking Requests:
 *   GET    /api/v1/host/booking-requests         → all requests (paginated)
 *   GET    /api/v1/host/booking-requests/pending → pending queue sorted by expiresAt
 *   POST   /api/v1/host/booking-requests/pre-approve → send pre-approval to specific guest
 *   POST   /api/v1/host/booking-requests/:id/approve
 *   POST   /api/v1/host/booking-requests/:id/decline
 */
import { Hono } from 'hono'
import { requireAuth, requireRole } from '@casalux/auth'
import { ListingService }       from '../services/listing.service.js'
import { ListingController }    from '../controllers/listing.controller.js'
import { OnboardingService }    from '../services/onboarding.service.js'
import { OnboardingController } from '../controllers/onboarding.controller.js'
import { bookingController }    from './bookings.js'
import { cacheService, searchService, queueService } from '../container.js'

const service    = new ListingService(cacheService, searchService, queueService)
const controller = new ListingController(service)

const onboardingService    = new OnboardingService(queueService)
const onboardingController = new OnboardingController(onboardingService)

export const hostRouter = new Hono()

// All host routes require auth + host role
hostRouter.use('*', requireAuth(), requireRole('host'))

// ─── Listing management ───────────────────────────────────────────────────────
hostRouter.post('/listings',                          (c) => controller.createListing(c))
hostRouter.get('/listings',                           (c) => controller.getHostListings(c))
hostRouter.get('/listings/:id',                       (c) => controller.getHostListingById(c))
hostRouter.put('/listings/:id',                       (c) => controller.updateListing(c))
hostRouter.patch('/listings/:id/status',              (c) => controller.updateStatus(c))
hostRouter.put('/listings/:id/availability',          (c) => controller.updateAvailability(c))

// ─── Booking management ───────────────────────────────────────────────────────
hostRouter.get('/bookings',            (c) => bookingController.getHostBookings(c))
hostRouter.post('/bookings/:id/cancel', (c) => bookingController.cancelBookingAsHost(c))
hostRouter.get('/bookings/:id',        (c) => bookingController.getHostBookingById(c))

// ─── Booking Request management ───────────────────────────────────────────────
// Static paths BEFORE /:id to avoid param collision
hostRouter.get('/booking-requests/pending',          (c) => bookingController.getPendingRequests(c))
hostRouter.post('/booking-requests/pre-approve',     (c) => bookingController.preApproveRequest(c))
hostRouter.get('/booking-requests',                  (c) => bookingController.getHostRequests(c))
hostRouter.post('/booking-requests/:id/approve',     (c) => bookingController.approveRequest(c))
hostRouter.post('/booking-requests/:id/decline',     (c) => bookingController.declineRequest(c))

// ─── Host onboarding (8-step wizard) ─────────────────────────────────────────
// Note: onboarding routes only need requireAuth() — not requireRole('host')
//       because the user becomes a host AFTER completing onboarding.
hostRouter.post(  '/onboarding/start',                        requireAuth(), (c) => onboardingController.start(c))
hostRouter.get(   '/onboarding/:sessionId',                   requireAuth(), (c) => onboardingController.getSession(c))
hostRouter.patch( '/onboarding/:sessionId/space',             requireAuth(), (c) => onboardingController.saveSpace(c))
hostRouter.patch( '/onboarding/:sessionId/amenities',         requireAuth(), (c) => onboardingController.saveAmenities(c))
hostRouter.post(  '/onboarding/:sessionId/photos',            requireAuth(), (c) => onboardingController.savePhotos(c))
hostRouter.patch( '/onboarding/:sessionId/details',           requireAuth(), (c) => onboardingController.saveDetails(c))
hostRouter.patch( '/onboarding/:sessionId/pricing',           requireAuth(), (c) => onboardingController.savePricing(c))
hostRouter.patch( '/onboarding/:sessionId/availability',      requireAuth(), (c) => onboardingController.saveAvailability(c))
hostRouter.post(  '/onboarding/:sessionId/submit',            requireAuth(), (c) => onboardingController.submit(c))
