/**
 * WishlistRepository — all DB queries for Wishlist + WishlistItem.
 * PRD Section 11 — Wishlist API.
 *
 * NOTE: Auth middleware sets context `userId` = Clerk sub (= clerkId).
 * Wishlist.userId is a FK to User.id (CUID), NOT clerkId.
 * Therefore all queries here use nested Prisma where { user: { clerkId } }
 * for lookups, and { user: { connect: { clerkId } } } for creation.
 */
import { db as prisma } from '@casalux/db'

const LISTING_PREVIEW = {
  id:           true,
  title:        true,
  images:       true,
  basePrice:    true,
  currency:     true,
  avgRating:    true,
  totalReviews: true,
  address:      true,
} as const

export class WishlistRepository {
  // ── Wishlist CRUD ───────────────────────────────────────────────────────────

  async findByClerkId(clerkId: string) {
    return prisma.wishlist.findMany({
      where:   { user: { clerkId } },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          take:    1,
          include: { listing: { select: LISTING_PREVIEW } },
        },
        _count: { select: { items: true } },
      },
    })
  }

  async findByIdForUser(wishlistId: string, clerkId: string) {
    return prisma.wishlist.findFirst({
      where: { id: wishlistId, user: { clerkId } },
      include: {
        items: {
          orderBy: { addedAt: 'desc' },
          include: { listing: { select: LISTING_PREVIEW } },
        },
        _count: { select: { items: true } },
      },
    })
  }

  async create(clerkId: string, name: string) {
    return prisma.wishlist.create({
      data: {
        name,
        user: { connect: { clerkId } },
      },
      include: { _count: { select: { items: true } } },
    })
  }

  async update(wishlistId: string, clerkId: string, name: string) {
    const existing = await prisma.wishlist.findFirst({
      where: { id: wishlistId, user: { clerkId } },
    })
    if (!existing) return null

    return prisma.wishlist.update({
      where: { id: wishlistId },
      data:  { name },
    })
  }

  async delete(wishlistId: string, clerkId: string): Promise<boolean> {
    const existing = await prisma.wishlist.findFirst({
      where: { id: wishlistId, user: { clerkId } },
    })
    if (!existing) return false

    await prisma.wishlist.delete({ where: { id: wishlistId } })
    return true
  }

  // ── Item operations ─────────────────────────────────────────────────────────

  async addListing(wishlistId: string, clerkId: string, listingId: string) {
    const wishlist = await prisma.wishlist.findFirst({
      where: { id: wishlistId, user: { clerkId } },
    })
    if (!wishlist) return null

    return prisma.wishlistItem.upsert({
      where:  { wishlistId_listingId: { wishlistId, listingId } },
      update: {},
      create: { wishlistId, listingId },
    })
  }

  async removeListing(wishlistId: string, clerkId: string, listingId: string): Promise<boolean> {
    const wishlist = await prisma.wishlist.findFirst({
      where: { id: wishlistId, user: { clerkId } },
    })
    if (!wishlist) return false

    await prisma.wishlistItem.deleteMany({
      where: { wishlistId, listingId },
    })
    return true
  }

  /** Quick-save: adds to the user's first wishlist (or creates "Saved") */
  async quickSave(clerkId: string, listingId: string) {
    let wishlist = await prisma.wishlist.findFirst({
      where:   { user: { clerkId } },
      orderBy: { createdAt: 'asc' },
    })

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { name: 'Saved', user: { connect: { clerkId } } },
      })
    }

    return prisma.wishlistItem.upsert({
      where:  { wishlistId_listingId: { wishlistId: wishlist.id, listingId } },
      update: {},
      create: { wishlistId: wishlist.id, listingId },
    })
  }

  async checkListing(clerkId: string, listingId: string) {
    const items = await prisma.wishlistItem.findMany({
      where:  { listingId, wishlist: { user: { clerkId } } },
      select: { wishlistId: true },
    })
    return {
      isSaved:     items.length > 0,
      wishlistIds: items.map((i: { wishlistId: string }) => i.wishlistId),
    }
  }
}
