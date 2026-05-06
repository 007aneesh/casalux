/**
 * Per-request context passed to every aivoy tool handler.
 *
 * Decoupling pattern: handlers never `import` services directly — they receive
 * them through this context. Swapping a service implementation, mocking in
 * tests, or scoping per-request all happen here, not inside handlers.
 */

import { cacheService, queueService, searchService } from '../container.js'
import { ListingService } from '../services/listing.service.js'

export interface AivoyToolContext {
  /** Services the handler can call. Add more as new tools need them. */
  services: AivoyServices

  /**
   * The Casalux end-user that triggered this tool call. Always null today —
   * will be populated once the user-token pass-through is implemented in the
   * aivoy cloud + standalone bundle. Tool definitions can already declare
   * `requiresUser: true` and they'll start working the day pass-through ships.
   */
  user: AivoyAuthenticatedUser | null

  /** Tenant + token from the aivoy webhook payload. Useful for audit logs. */
  source: {
    tenantId: string
    tokenId: string
  }
}

export interface AivoyServices {
  listings: ListingService
  // Add more services as tools need them — e.g. bookings, wishlists, messages.
  // Pattern: instantiate once at module load below; tools depend on the
  // interface, not the wiring.
}

export interface AivoyAuthenticatedUser {
  /** Casalux DB user id (the internal one, NOT the Clerk user id). */
  id: string
  email?: string
  name?: string
  isHost?: boolean
}

// ─── Service singletons ─────────────────────────────────────────────────────
// Mirrors the per-route instantiation in `routes/listings.ts`. Each service
// keeps its own internal cache; one shared instance per process is fine.

const listingService = new ListingService(cacheService, searchService, queueService)

export const aivoyServices: AivoyServices = {
  listings: listingService,
}
