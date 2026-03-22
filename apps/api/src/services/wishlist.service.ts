/**
 * WishlistService — business logic for wishlists.
 * PRD Section 11.
 * All methods accept clerkId (the Clerk sub, available from auth context).
 */
import type { CacheService } from '@casalux/services-cache'
import { CacheKeys } from '@casalux/services-cache'
import { WishlistRepository } from '../repositories/wishlist.repository.js'

export class WishlistService {
  private readonly repo = new WishlistRepository()

  constructor(private readonly cache: CacheService) {}

  private async invalidateRecommend(clerkId: string) {
    await this.cache.del(CacheKeys.recommend(clerkId))
  }

  async listWishlists(clerkId: string) {
    return this.repo.findByClerkId(clerkId)
  }

  async getWishlist(wishlistId: string, clerkId: string) {
    const wishlist = await this.repo.findByIdForUser(wishlistId, clerkId)
    if (!wishlist) throw new Error('WISHLIST_NOT_FOUND')
    return wishlist
  }

  async createWishlist(clerkId: string, name: string) {
    if (!name.trim()) throw new Error('Wishlist name cannot be empty')
    if (name.length > 100) throw new Error('Wishlist name exceeds 100 characters')
    return this.repo.create(clerkId, name)
  }

  async updateWishlist(wishlistId: string, clerkId: string, name: string) {
    if (!name.trim()) throw new Error('Wishlist name cannot be empty')
    const result = await this.repo.update(wishlistId, clerkId, name)
    if (!result) throw new Error('WISHLIST_NOT_FOUND')
    return result
  }

  async deleteWishlist(wishlistId: string, clerkId: string) {
    const deleted = await this.repo.delete(wishlistId, clerkId)
    if (!deleted) throw new Error('WISHLIST_NOT_FOUND')
    await this.invalidateRecommend(clerkId)
  }

  async addListingToWishlist(wishlistId: string, clerkId: string, listingId: string) {
    const item = await this.repo.addListing(wishlistId, clerkId, listingId)
    if (!item) throw new Error('WISHLIST_NOT_FOUND')
    await this.invalidateRecommend(clerkId)
    return item
  }

  async removeListingFromWishlist(wishlistId: string, clerkId: string, listingId: string) {
    const removed = await this.repo.removeListing(wishlistId, clerkId, listingId)
    if (!removed) throw new Error('WISHLIST_NOT_FOUND')
    await this.invalidateRecommend(clerkId)
  }

  async quickSave(clerkId: string, listingId: string) {
    const item = await this.repo.quickSave(clerkId, listingId)
    await this.invalidateRecommend(clerkId)
    return item
  }

  async checkListing(clerkId: string, listingId: string) {
    return this.repo.checkListing(clerkId, listingId)
  }
}
