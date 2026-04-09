/**
 * ListingService — business logic for all listing operations.
 * PRD Sections 7, 9, 10 — caching, ES search, pricing preview, recommendations.
 *
 * Rules:
 * - Always invalidate cache on write
 * - ES indexing is async via BullMQ (never inline)
 * - Pricing is delegated to the pure pricing.ts function
 */
import crypto from 'node:crypto'
import type { CacheService } from '@casalux/services-cache'
import { CacheKeys } from '@casalux/services-cache'
import type { ISearchService } from '@casalux/services-search'
import type { QueueService } from '@casalux/services-queue'
import { calculatePrice, daysUntilCheckIn } from '@casalux/utils'
import type { ListingSearchParams } from '@casalux/types'
import type { ListingStatus, PropertyType, RoomType, CancellationPolicy, Prisma } from '@casalux/db'
import { db } from '@casalux/db'
import { ListingRepository } from '../repositories/listing.repository.js'
import type { ListingWithRelations } from '../repositories/listing.repository.js'

// ─── ES document shape (PRD Section 6.1) ─────────────────────────────────────
export interface ESListingDoc {
  id: string
  title: string
  description: string
  hostId: string
  status: string
  propertyType: string
  roomType: string
  amenities: string[]
  location: { lat: number; lon: number }
  // Stored in ES so search results include full address for the listing card
  address: { street: string; city: string; state: string; country: string; zip: string }
  city: string      // top-level for keyword filtering / autocomplete
  country: string
  // Images stored in ES so listing cards render photos without a second DB fetch
  images: Array<{ publicId: string; url: string; width: number; height: number; isPrimary: boolean; order: number }>
  basePrice: number
  currency: string
  minNights: number
  maxGuests: number
  bedrooms: number
  beds: number
  baths: number
  instantBook: boolean
  avgRating: number
  totalReviews: number
  createdAt: string
  isNewListing: boolean
  quickFilterTags: string[]
}

// ─── Quick filter definitions (PRD Section 7.4) ───────────────────────────────
export const QUICK_FILTERS = [
  { slug: 'trending',      label: 'Trending' },
  { slug: 'beachfront',    label: 'Beachfront' },
  { slug: 'amazing_pools', label: 'Amazing Pools' },
  { slug: 'cabins',        label: 'Cabins' },
  { slug: 'luxe',          label: 'Luxe' },
  { slug: 'new',           label: 'New Listings' },
  { slug: 'instant_book',  label: 'Instant Book' },
  { slug: 'pet_friendly',  label: 'Pet Friendly' },
] as const

// ─── Service ──────────────────────────────────────────────────────────────────
export class ListingService {
  private repo: ListingRepository

  constructor(
    private cache: CacheService,
    private search: ISearchService,
    private queue: QueueService
  ) {
    this.repo = new ListingRepository()
  }

  // ─── Public: search / feed ────────────────────────────────────────────────
  async getListings(params: ListingSearchParams) {
    const page  = params.page  ?? 1
    const limit = Math.min(params.limit ?? 20, 50)

    // Cache by hash of params
    const hash     = this.hashParams(params)
    const cacheKey = CacheKeys.listings(hash)
    const cached   = await this.cache.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const esQuery = this.buildESQuery(params)
    const result  = await this.search.search<ESListingDoc>('listings', {
      filters: esQuery,
      sort:    this.buildESSort(params.sortBy),
      page,
      limit,
    })

    const response = {
      success: true,
      data: result.hits,
      meta: {
        page,
        limit,
        total:      result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    }

    await this.cache.set(cacheKey, JSON.stringify(response), 300) // 5 min TTL
    return response
  }

  // ─── Public: single listing detail ────────────────────────────────────────
  async getListingById(id: any) {
    const cacheKey = CacheKeys.listing(id)
    const cached   = await this.cache.get(cacheKey)
    if (cached) return JSON.parse(cached)


    const listing = await this.repo.findById(id)
    if (!listing) return null

    // Only serve active listings publicly
    if (listing.status !== 'active') return null

    const shaped = this.shapeListing(listing)
    await this.cache.set(cacheKey, JSON.stringify(shaped), 600) // 10 min TTL
    return shaped
  }

  // ─── Public: availability calendar ───────────────────────────────────────
  async getAvailability(listingId: any, year: number, month: number) {
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`
    const cacheKey  = CacheKeys.availability(listingId, yearMonth)
    const cached    = await this.cache.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const from = new Date(year, month - 1, 1)
    const to   = new Date(year, month, 0) // last day of month

    const [rules, bookings] = await Promise.all([
      this.repo.getAvailabilityRules(listingId, from, to),
      this.repo.getConfirmedBookingDates(listingId, from, to),
    ])

    const listing = await this.repo.findById(listingId)
    if (!listing) return null

    const blockedDates = new Set<string>()

    // Blocked availability rules
    for (const rule of rules) {
      if (rule.type === 'blocked') {
        for (const d of this.dateRange(rule.startDate, rule.endDate)) {
          blockedDates.add(d)
        }
      }
    }

    // Confirmed bookings
    for (const booking of bookings) {
      for (const d of this.dateRange(booking.checkIn, booking.checkOut)) {
        blockedDates.add(d)
      }
    }

    // Build available dates for the month
    const allDates      = this.dateRange(from, to)
    const availableDates = allDates.filter((d) => !blockedDates.has(d))

    // Advance notice
    const advanceRule = rules.find((r: any) => r.type === 'advance_notice')
    const advanceNoticeDays = advanceRule?.value ?? 0

    const result = {
      availableDates,
      blockedDates: Array.from(blockedDates).sort(),
      minNights:        Number(listing.minNights),
      advanceNoticeDays,
    }

    await this.cache.set(cacheKey, JSON.stringify(result), 300) // 5 min
    return result
  }

  // ─── Public: pricing preview ──────────────────────────────────────────────
  async getPricingPreview(
    listingId: any,
    checkIn: string,
    checkOut: string,
    guests: number,
    promoCode?: string
  ) {
    const hash     = this.hashParams({ listingId, checkIn, checkOut, guests, promoCode })
    const cacheKey = CacheKeys.pricing(listingId, hash)
    const cached   = await this.cache.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const listing = await this.repo.findById(listingId)
    if (!listing) return null

    const checkInDate  = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const nights       = Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (nights < 1) throw new Error('INVALID_DATES')
    if (guests > listing.maxGuests) throw new Error('TOO_MANY_GUESTS')

    const dbDiscounts = await this.repo.getActiveDiscounts(listingId)
    const daysAdvance = daysUntilCheckIn(checkIn)

    const activeDiscounts = dbDiscounts.filter((d: any) => {
      if (d.type === 'weekly_discount'  && nights < (d.minNights ?? 7))   return false
      if (d.type === 'monthly_discount' && nights < (d.minNights ?? 28))  return false
      if (d.type === 'early_bird'       && daysAdvance < (d.daysInAdvance ?? 0)) return false
      if (d.type === 'last_minute'      && daysAdvance > (d.daysUntilCheckIn ?? 0)) return false
      return true
    }).map((d: any) => ({
      type:     d.type,
      label:    d.label,
      priority: d.priority,
      value:    d.value,
      isPercent: d.isPercent,
    }))

    // Platform service fee from env
    const serviceFeePercent = parseFloat(process.env['PLATFORM_SERVICE_FEE_PERCENT'] ?? '12')

    const breakdown = calculatePrice({
      basePrice:       Number(listing.basePrice),
      nights,
      cleaningFee:     Number(listing.cleaningFee),
      serviceFeePercent,
      taxRules:        [{ percent: 18, label: 'GST' }], // TODO: per-country from config
      discounts:       activeDiscounts,
    })

    const result = { ...breakdown, currency: listing.currency }
    await this.cache.set(cacheKey, JSON.stringify(result), 120) // 2 min TTL
    return result
  }

  // ─── Public: reviews ─────────────────────────────────────────────────────
  async getReviews(listingId: any, page = 1, limit = 10) {
    const { reviews, total } = await this.repo.getReviews(listingId, page, Math.min(limit, 50))
    return {
      data:  reviews,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  // ─── Public: quick filters ────────────────────────────────────────────────
  async getQuickFilters() {
    const results = await Promise.all(
      QUICK_FILTERS.map(async (qf) => {
        const cacheKey = CacheKeys.quickFilter(qf.slug)
        const cached   = await this.cache.get(cacheKey)
        if (cached) return JSON.parse(cached)

        const esQuery = this.buildQuickFilterQuery(qf.slug)
        const result  = await this.search.search('listings', {
          filters: esQuery,
          page: 1,
          limit: 0, // count only
        })

        const item = { slug: qf.slug, label: qf.label, count: result.total }
        await this.cache.set(cacheKey, JSON.stringify(item), 600) // 10 min
        return item
      })
    )
    return results
  }

  // ─── Public: recommendations ──────────────────────────────────────────────
  async getRecommended(
    userId: string,
    lat?: number,
    lng?: number,
    limit = 20,
    type?: string
  ) {
    // Cache key varies by type so each rail gets its own cache slot
    const cacheKey = type
      ? `${CacheKeys.recommend(userId)}:type:${type}`
      : CacheKeys.recommend(userId)
    const cached = await this.cache.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const PROPERTY_TYPES = new Set(['apartment', 'house', 'villa', 'cabin', 'unique', 'hotel'])

    const mustClauses: Record<string, unknown>[] = [{ term: { status: 'active' } }]

    if (type) {
      if (PROPERTY_TYPES.has(type)) {
        mustClauses.push({ term: { propertyType: type } })
      } else {
        // treat as a quickFilterTag (beachfront, trending, luxe, etc.)
        mustClauses.push({ term: { quickFilterTags: type } })
      }
    }

    const esQuery: Record<string, unknown> = {
      bool: {
        must: mustClauses,
        ...(lat !== undefined && lng !== undefined
          ? { filter: [{ geo_distance: { distance: '50km', location: { lat, lon: lng } } }] }
          : {}),
      },
    }

    const result = await this.search.search<ESListingDoc>('listings', {
      filters: esQuery,
      sort:    [{ field: 'avgRating', order: 'desc' }],
      page:    1,
      limit:   Math.min(limit, 20),
    })

    await this.cache.set(cacheKey, JSON.stringify(result.hits), 900) // 15 min
    return result.hits
  }

  // ─── Resolve HostProfile.id from the DB user id ──────────────────────────
  // Upserts the HostProfile so hosts approved before the profile-creation fix
  // automatically get a profile on first access.
  async resolveHostProfileId(dbUserId: string): Promise<string> {
    const profile = await db.hostProfile.upsert({
      where:  { userId: dbUserId },
      update: {},
      create: { userId: dbUserId },
      select: { id: true },
    })
    return profile.id
  }

  // ─── Host: create listing ─────────────────────────────────────────────────
  async createListing(dbUserId: string, data: CreateListingInput): Promise<ListingWithRelations> {
    // Resolve the HostProfile primary-key id from the DB user id
    const hostProfileId = await this.resolveHostProfileId(dbUserId)

    // Geocode address if lat/lng not provided
    let { lat, lng } = data
    if (!lat || !lng) {
      const geocoded = await this.geocodeAddress(data.address)
      lat = geocoded.lat
      lng = geocoded.lng
    }

    const listing = await this.repo.create({
      hostId:      hostProfileId,
      title:       data.title,
      description: data.description,
      propertyType: data.propertyType as PropertyType,
      roomType:     data.roomType     as RoomType,
      status:       'draft',
      address:      data.address,
      lat:          lat.toString(),
      lng:          lng.toString(),
      images:       [],
      basePrice:    data.basePrice,
      currency:     data.currency ?? 'INR',
      cleaningFee:  data.cleaningFee ?? 0,
      minNights:    data.minNights ?? 1,
      maxNights:    data.maxNights,
      maxGuests:    data.maxGuests,
      bedrooms:     data.bedrooms ?? 0,
      beds:         data.beds ?? 0,
      baths:        data.baths ?? 0,
      instantBook:  data.instantBook ?? false,
      checkInTime:  data.checkInTime  ?? '15:00',
      checkOutTime: data.checkOutTime ?? '11:00',
      cancellationPolicy: (data.cancellationPolicy ?? 'flexible') as CancellationPolicy,
      requireVerifiedId:      data.requireVerifiedId      ?? false,
      requireProfilePhoto:    data.requireProfilePhoto    ?? false,
      requirePositiveReviews: data.requirePositiveReviews ?? false,
    })

    // Set amenities separately
    if (data.amenities?.length) {
      await this.repo.setAmenities(listing.id, data.amenities)
    }

    // Re-fetch with amenities
    return (await this.repo.findById(listing.id))!
  }

  // ─── Host: update listing ─────────────────────────────────────────────────
  async updateListing(
    id: any,
    hostId: string,
    data: UpdateListingInput
  ): Promise<ListingWithRelations> {
    const listing = await this.repo.findByIdForHost(id, hostId)
    if (!listing) throw new Error('NOT_FOUND')

    // Re-geocode if address changed
    let lat = data.lat
    let lng = data.lng
    if (data.address && (!lat || !lng)) {
      const geocoded = await this.geocodeAddress(data.address)
      lat = geocoded.lat
      lng = geocoded.lng
    }

    const { amenities, ...listingFields } = data
    const updated = await this.repo.update(id, {
      ...listingFields,
      ...(lat ? { lat: lat.toString() } : {}),
      ...(lng ? { lng: lng.toString() } : {}),
    })

    // Update amenities if provided
    if (amenities) {
      await this.repo.setAmenities(id, amenities)
    }

    // Invalidate cache + reindex ES (sync for immediate searchability, async for reliability)
    await this.cache.del(CacheKeys.listing(id))
    await this.cache.delPattern('cache:listings:*')

    const refreshed = await this.repo.findById(id)
    if (refreshed?.status === 'active') {
      const doc = this.buildESDoc(refreshed)
      await this.search.index('listings', id, doc as unknown as Record<string, unknown>).catch(() => {})
    }

    return refreshed!
  }

  // ─── Host: update status ──────────────────────────────────────────────────
  async updateStatus(id: any, hostId: string, status: ListingStatus): Promise<void> {
    const listing = await this.repo.findByIdForHost(id, hostId)
    if (!listing) throw new Error('NOT_FOUND')

    await this.repo.updateStatus(id, status)
    await this.cache.del(CacheKeys.listing(id))
    await this.cache.delPattern('cache:listings:*')

    if (status === 'active') {
      // Index inline so it's immediately searchable
      const fresh = await this.repo.findById(id)
      if (fresh) {
        const doc = this.buildESDoc(fresh)
        await this.search.index('listings', id, doc as unknown as Record<string, unknown>).catch(() => {})
      }
    } else {
      // Remove from ES index when paused/archived/flagged
      await this.search.delete('listings', id).catch(() => {})
    }
  }

  // ─── Host: update availability ────────────────────────────────────────────
  async updateAvailability(
    listingId: any,
    hostId: string,
    rules: Array<{
      type: string
      startDate: string
      endDate: string
      value?: number
      notes?: string
    }>
  ): Promise<void> {
    const listing = await this.repo.findByIdForHost(listingId, hostId)
    if (!listing) throw new Error('NOT_FOUND')

    await this.repo.upsertAvailabilityRules(
      listingId,
      rules.map((r: any) => ({
        ...r,
        startDate: new Date(r.startDate),
        endDate:   new Date(r.endDate),
      }))
    )

    // Invalidate availability cache for all months in range
    await this.cache.delPattern(`avail:${listingId}:*`)
  }

  // ─── ES doc builder (PRD Section 6.1) ────────────────────────────────────
  buildESDoc(listing: ListingWithRelations): ESListingDoc {
    const addr = listing.address as { street?: string; city?: string; state?: string; country?: string; zip?: string }
    const amenitySlugs = listing.amenities.map((a: any) => a.amenity.slug)
    const isNewListing = (Date.now() - listing.createdAt.getTime()) < 30 * 24 * 60 * 60 * 1000

    // Prefer quickFilterTags stored on the listing (set by seed / host flow).
    // Fall back to computing from amenities/price for listings without them.
    let quickFilterTags: string[] = listing.quickFilterTags ?? []
    if (quickFilterTags.length === 0) {
      if (amenitySlugs.includes('beachfront'))   quickFilterTags.push('beachfront')
      if (amenitySlugs.includes('pool') && Number(listing.avgRating) >= 4.7) quickFilterTags.push('amazing_pools')
      if (listing.propertyType === 'cabin')      quickFilterTags.push('cabins')
      if (Number(listing.basePrice) >= 2000000 && Number(listing.avgRating) >= 4.8) quickFilterTags.push('luxe')
      if (isNewListing)                          quickFilterTags.push('new')
      if (listing.instantBook)                   quickFilterTags.push('instant_book')
      if (amenitySlugs.includes('pets_allowed')) quickFilterTags.push('pet_friendly')
    }

    const images = (listing.images ?? []) as Array<{
      publicId: string; url: string; width: number; height: number; isPrimary: boolean; order: number
    }>

    return {
      id:           listing.id,
      title:        listing.title,
      description:  listing.description,
      hostId:       listing.hostId,
      status:       listing.status,
      propertyType: listing.propertyType,
      roomType:     listing.roomType,
      amenities:    amenitySlugs,
      location:     { lat: Number(listing.lat), lon: Number(listing.lng) },
      address: {
        street:  addr.street  ?? '',
        city:    addr.city    ?? '',
        state:   addr.state   ?? '',
        country: addr.country ?? '',
        zip:     addr.zip     ?? '',
      },
      city:         addr.city    ?? '',
      country:      addr.country ?? '',
      images,
      basePrice:    Number(listing.basePrice),
      currency:     listing.currency,
      minNights:    listing.minNights,
      maxGuests:    listing.maxGuests,
      bedrooms:     listing.bedrooms,
      beds:         listing.beds,
      baths:        listing.baths,
      instantBook:  listing.instantBook,
      avgRating:    Number(listing.avgRating),
      totalReviews: listing.totalReviews,
      createdAt:    listing.createdAt.toISOString(),
      isNewListing,
      quickFilterTags,
    }
  }

  // ─── Shape for public API response ────────────────────────────────────────
  shapeListing(listing: ListingWithRelations) {
    return {
      ...listing,
      lat:         Number(listing.lat),
      lng:         Number(listing.lng),
      basePrice:   Number(listing.basePrice),
      cleaningFee: Number(listing.cleaningFee),
      avgRating:   Number(listing.avgRating),
      // Return slug strings — matches Listing.amenities: string[] and what AmenityGrid expects
      amenities:   listing.amenities.map((a: any) => a.amenity.slug as string),
      host: {
        user: {
          id:             listing.host.user.id,
          firstName:      listing.host.user.firstName,
          lastName:       listing.host.user.lastName,
          email:          (listing.host.user as any).email ?? '',
          profileImageUrl: listing.host.user.profileImageUrl,
        },
        isSuperhost:          listing.host.isSuperhost,
        responseRate:         listing.host.responseRate,
        avgResponseTimeHours: listing.host.avgResponseTimeHours,
      },
    }
  }

  // ─── Private: ES query builder (PRD Section 6.2) ─────────────────────────
  private buildESQuery(params: ListingSearchParams): Record<string, unknown> {
    const must:   unknown[] = [{ term: { status: 'active' } }]
    const filter: unknown[] = []

    if (params.minPrice || params.maxPrice) {
      const range: Record<string, number> = {}
      if (params.minPrice) range['gte'] = params.minPrice
      if (params.maxPrice) range['lte'] = params.maxPrice
      must.push({ range: { basePrice: range } })
    }

    if (params.guests) {
      must.push({ range: { maxGuests: { gte: params.guests } } })
    }

    if (params.propertyType?.length) {
      must.push({ terms: { propertyType: params.propertyType } })
    }

    if (params.roomType?.length) {
      must.push({ terms: { roomType: params.roomType } })
    }

    if (params.amenities?.length) {
      // AND logic — listing must have ALL amenities
      must.push({
        terms_set: {
          amenities: {
            terms: params.amenities,
            minimum_should_match_script: {
              source: 'params.count',
              params: { count: params.amenities.length },
            },
          },
        },
      })
    }

    if (params.minBedrooms)  must.push({ range: { bedrooms: { gte: params.minBedrooms } } })
    if (params.minBeds)      must.push({ range: { beds:     { gte: params.minBeds } } })
    if (params.minBaths)     must.push({ range: { baths:    { gte: params.minBaths } } })
    if (params.instantBook)  must.push({ term:  { instantBook: true } })
    if (params.minRating)    must.push({ range: { avgRating: { gte: params.minRating } } })

    if (params.cancellationPolicy) {
      must.push({ term: { cancellationPolicy: params.cancellationPolicy } })
    }

    if (params.quickFilter) {
      must.push({ term: { quickFilterTags: params.quickFilter } })
    }

    // Shortcut amenity aliases
    if (params.petFriendly) {
      must.push({ term: { amenities: 'pets_allowed' } })
    }

    // Geo filter
    if (params.lat !== undefined && params.lng !== undefined) {
      filter.push({
        geo_distance: {
          distance: `${params.radius ?? 40}km`,
          location: { lat: params.lat, lon: params.lng },
        },
      })
    }

    return { bool: { must, filter } }
  }

  private buildESSort(sortBy?: string): Array<{ field: string; order: 'asc' | 'desc' }> {
    switch (sortBy) {
      case 'price_asc':  return [{ field: 'basePrice',   order: 'asc'  }]
      case 'price_desc': return [{ field: 'basePrice',   order: 'desc' }]
      case 'rating':     return [{ field: 'avgRating',   order: 'desc' }]
      case 'newest':     return [{ field: 'createdAt',   order: 'desc' }]
      case 'distance':   return [{ field: '_geo_distance', order: 'asc' }]
      default:           return [{ field: 'avgRating', order: 'desc' }]
    }
  }

  private buildQuickFilterQuery(slug: string): Record<string, unknown> {
    const base = { bool: { must: [{ term: { status: 'active' } }] as unknown[] } }
    switch (slug) {
      case 'beachfront':    base.bool.must.push({ term: { amenities: 'beachfront' } }); break
      case 'amazing_pools': base.bool.must.push({ term: { amenities: 'pool' } }, { range: { avgRating: { gte: 4.7 } } }); break
      case 'cabins':        base.bool.must.push({ term: { propertyType: 'cabin' } }); break
      case 'luxe':          base.bool.must.push({ range: { basePrice: { gte: 2000000 } } }, { range: { avgRating: { gte: 4.8 } } }); break
      case 'new':           base.bool.must.push({ term: { isNewListing: true } }); break
      case 'instant_book':  base.bool.must.push({ term: { instantBook: true } }); break
      case 'pet_friendly':  base.bool.must.push({ term: { amenities: 'pets_allowed' } }); break
      case 'trending':      base.bool.must.push({ term: { quickFilterTags: 'trending' } }); break
    }
    return base
  }

  // ─── Private: helpers ─────────────────────────────────────────────────────
  private hashParams(params: object): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(params))
      .digest('hex')
      .slice(0, 16)
  }

  private dateRange(from: Date, to: Date): string[] {
    const dates: string[] = []
    const current = new Date(from)
    current.setHours(0, 0, 0, 0)
    const end = new Date(to)
    end.setHours(0, 0, 0, 0)

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]!)
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  private async geocodeAddress(address: object): Promise<{ lat: number; lng: number }> {
    // Google Maps geocoding — best-effort, defaults to 0,0 if not configured
    const apiKey = process.env['GOOGLE_MAPS_API_KEY']
    if (!apiKey) return { lat: 0, lng: 0 }

    try {
      const addr  = address as Record<string, string>
      const query = encodeURIComponent(`${addr['street']}, ${addr['city']}, ${addr['country']}`)
      const resp  = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${apiKey}`
      )
      const data  = await resp.json() as { results: Array<{ geometry: { location: { lat: number; lng: number } } }>; status: string }
      if (data.status === 'OK' && data.results[0]) {
        return data.results[0].geometry.location
      }
    } catch { /* fall through */ }

    return { lat: 0, lng: 0 }
  }
}

// ─── Input types ──────────────────────────────────────────────────────────────
export interface CreateListingInput {
  title: string
  description: string
  propertyType: string
  roomType: string
  address: object
  lat?: number
  lng?: number
  amenities?: string[]
  basePrice: number
  currency?: string
  cleaningFee?: number
  minNights?: number
  maxNights?: number
  maxGuests: number
  bedrooms?: number
  beds?: number
  baths?: number
  instantBook?: boolean
  checkInTime?: string
  checkOutTime?: string
  cancellationPolicy?: string
  requireVerifiedId?: boolean
  requireProfilePhoto?: boolean
  requirePositiveReviews?: boolean
}

export interface UpdateListingInput {
  title?: string
  description?: string
  propertyType?: string
  roomType?: string
  address?: object
  lat?: number
  lng?: number
  amenities?: string[]
  basePrice?: number
  cleaningFee?: number
  minNights?: number
  maxNights?: number | null
  maxGuests?: number
  bedrooms?: number
  beds?: number
  baths?: number
  instantBook?: boolean
  checkInTime?: string
  checkOutTime?: string
  cancellationPolicy?: string
  requireVerifiedId?: boolean
  requireProfilePhoto?: boolean
  requirePositiveReviews?: boolean
}
