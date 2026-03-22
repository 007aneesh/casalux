/**
 * WishlistController — HTTP layer for wishlists.
 * PRD Section 11.
 * c.get('userId') returns the Clerk sub (= clerkId) — used throughout.
 */
import type { Context } from 'hono'
import { z } from 'zod'
import type { WishlistService } from '../services/wishlist.service.js'

function handleWishlistError(err: unknown, c: Context) {
  const msg = err instanceof Error ? err.message : ''
  if (msg === 'WISHLIST_NOT_FOUND')            return c.json({ error: 'Wishlist not found' }, 404)
  if (msg.startsWith('Wishlist name'))         return c.json({ error: msg }, 422)
  console.error('[WishlistController]', err)
  return c.json({ error: 'Internal server error' }, 500)
}

export class WishlistController {
  constructor(private readonly service: WishlistService) {}

  /** GET /api/v1/users/me/wishlists */
  async listWishlists(c: Context): Promise<Response> {
    try {
      const clerkId   = c.get('userId') as string
      const wishlists = await this.service.listWishlists(clerkId)
      return c.json({ wishlists })
    } catch (err) {
      return handleWishlistError(err, c)
    }
  }

  /** POST /api/v1/users/me/wishlists */
  async createWishlist(c: Context): Promise<Response> {
    const schema = z.object({ name: z.string().min(1).max(100) })
    try {
      const parsed = schema.safeParse(await c.req.json() as unknown)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId  = c.get('userId') as string
      const wishlist = await this.service.createWishlist(clerkId, parsed.data.name)
      return c.json({ wishlist }, 201)
    } catch (err) {
      return handleWishlistError(err, c)
    }
  }

  /** GET /api/v1/users/me/wishlists/check/:listingId — MUST be before /:id */
  async checkListing(c: Context): Promise<Response> {
    try {
      const clerkId   = c.get('userId') as string
      const listingId = c.req.param('listingId') as string
      const result    = await this.service.checkListing(clerkId, listingId)
      return c.json(result)
    } catch (err) {
      return handleWishlistError(err, c)
    }
  }

  /** GET /api/v1/users/me/wishlists/:id */
  async getWishlist(c: Context): Promise<Response> {
    try {
      const clerkId    = c.get('userId') as string
      const wishlistId = c.req.param('id') as string
      const wishlist   = await this.service.getWishlist(wishlistId, clerkId)
      return c.json({ wishlist })
    } catch (err) {
      return handleWishlistError(err, c)
    }
  }

  /** PUT /api/v1/users/me/wishlists/:id */
  async updateWishlist(c: Context): Promise<Response> {
    const schema = z.object({ name: z.string().min(1).max(100) })
    try {
      const parsed = schema.safeParse(await c.req.json() as unknown)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId    = c.get('userId') as string
      const wishlistId = c.req.param('id') as string
      const wishlist   = await this.service.updateWishlist(wishlistId, clerkId, parsed.data.name)
      return c.json({ wishlist })
    } catch (err) {
      return handleWishlistError(err, c)
    }
  }

  /** DELETE /api/v1/users/me/wishlists/:id */
  async deleteWishlist(c: Context): Promise<Response> {
    try {
      const clerkId    = c.get('userId') as string
      const wishlistId = c.req.param('id') as string
      await this.service.deleteWishlist(wishlistId, clerkId)
      return c.json({ ok: true })
    } catch (err) {
      return handleWishlistError(err, c)
    }
  }

  /** POST /api/v1/users/me/wishlists/:id/listings */
  async addListing(c: Context): Promise<Response> {
    const schema = z.object({ listingId: z.string().min(1) })
    try {
      const parsed = schema.safeParse(await c.req.json() as unknown)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId    = c.get('userId') as string
      const wishlistId = c.req.param('id') as string
      const item = await this.service.addListingToWishlist(wishlistId, clerkId, parsed.data.listingId)
      return c.json({ item }, 201)
    } catch (err) {
      return handleWishlistError(err, c)
    }
  }

  /** DELETE /api/v1/users/me/wishlists/:id/listings/:listingId */
  async removeListing(c: Context): Promise<Response> {
    try {
      const clerkId    = c.get('userId') as string
      const wishlistId = c.req.param('id') as string
      const listingId  = c.req.param('listingId') as string
      await this.service.removeListingFromWishlist(wishlistId, clerkId, listingId)
      return c.json({ ok: true })
    } catch (err) {
      return handleWishlistError(err, c)
    }
  }

  /** POST /api/v1/listings/:id/save */
  async quickSave(c: Context): Promise<Response> {
    try {
      const clerkId   = c.get('userId') as string
      const listingId = c.req.param('id') as string
      const item      = await this.service.quickSave(clerkId, listingId)
      return c.json({ item }, 201)
    } catch (err) {
      return handleWishlistError(err, c)
    }
  }
}
