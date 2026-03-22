/**
 * Users router — /api/v1/users/me/* endpoints.
 *
 * Bookings:
 *   GET  /api/v1/users/me/bookings             — guest's booking history
 *   GET  /api/v1/users/me/booking-requests     — guest's booking request history
 *
 * Reviews (PRD Section 9):
 *   GET  /api/v1/users/me/reviews              — guest's submitted reviews
 *
 * Wishlists (PRD Section 11):
 *   GET    /api/v1/users/me/wishlists                          — list all wishlists
 *   POST   /api/v1/users/me/wishlists                          — create wishlist
 *   GET    /api/v1/users/me/wishlists/check/:listingId         — check if listing is saved (BEFORE /:id)
 *   GET    /api/v1/users/me/wishlists/:id                      — get single wishlist + items
 *   PUT    /api/v1/users/me/wishlists/:id                      — rename wishlist
 *   DELETE /api/v1/users/me/wishlists/:id                      — delete wishlist
 *   POST   /api/v1/users/me/wishlists/:id/listings             — add listing to wishlist
 *   DELETE /api/v1/users/me/wishlists/:id/listings/:listingId  — remove listing
 *
 * Search History (PRD Section 10):
 *   GET    /api/v1/users/me/search-history           — list recent searches
 *   DELETE /api/v1/users/me/search-history           — clear all history
 *   DELETE /api/v1/users/me/search-history/:id       — delete single entry (BEFORE clear-all)
 */
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { bookingController } from './bookings.js'
import { ReviewService }    from '../services/review.service.js'
import { ReviewController } from '../controllers/review.controller.js'
import { WishlistService }    from '../services/wishlist.service.js'
import { WishlistController } from '../controllers/wishlist.controller.js'
import { LocationService }    from '../services/location.service.js'
import { LocationController } from '../controllers/location.controller.js'
import { cacheService, queueService } from '../container.js'

const reviewService    = new ReviewService(cacheService, queueService)
const reviewController = new ReviewController(reviewService)

const wishlistService    = new WishlistService(cacheService)
const wishlistController = new WishlistController(wishlistService)

const locationService    = new LocationService(cacheService)
const locationController = new LocationController(locationService)

export const usersRouter = new Hono()

// ─── Bookings ─────────────────────────────────────────────────────────────────
usersRouter.get('/me/bookings',         requireAuth(), (c) => bookingController.getMyBookings(c))
usersRouter.get('/me/booking-requests', requireAuth(), (c) => bookingController.getMyRequests(c))

// ─── Reviews ─────────────────────────────────────────────────────────────────
usersRouter.get('/me/reviews', requireAuth(), (c) => reviewController.getMyReviews(c))

// ─── Wishlists ────────────────────────────────────────────────────────────────
// Static sub-path BEFORE /:id to avoid param collision
usersRouter.get(   '/me/wishlists/check/:listingId',         requireAuth(), (c) => wishlistController.checkListing(c))
usersRouter.get(   '/me/wishlists',                          requireAuth(), (c) => wishlistController.listWishlists(c))
usersRouter.post(  '/me/wishlists',                          requireAuth(), (c) => wishlistController.createWishlist(c))
usersRouter.get(   '/me/wishlists/:id',                      requireAuth(), (c) => wishlistController.getWishlist(c))
usersRouter.put(   '/me/wishlists/:id',                      requireAuth(), (c) => wishlistController.updateWishlist(c))
usersRouter.delete('/me/wishlists/:id',                      requireAuth(), (c) => wishlistController.deleteWishlist(c))
usersRouter.post(  '/me/wishlists/:id/listings',             requireAuth(), (c) => wishlistController.addListing(c))
usersRouter.delete('/me/wishlists/:id/listings/:listingId',  requireAuth(), (c) => wishlistController.removeListing(c))

// ─── Search History ───────────────────────────────────────────────────────────
// Static DELETE /me/search-history (clear all) BEFORE /:id to avoid collision
usersRouter.get(   '/me/search-history',     requireAuth(), (c) => locationController.listHistory(c))
usersRouter.delete('/me/search-history',     requireAuth(), (c) => locationController.clearHistory(c))
usersRouter.delete('/me/search-history/:id', requireAuth(), (c) => locationController.deleteHistoryItem(c))
