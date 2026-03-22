/**
 * LocationService — autocomplete + search history.
 * PRD Section 10.
 *
 * Autocomplete response blends three sources (PRD 10.2):
 *  1. Recent (auth user) — last 3 matching from Redis session:search:{userId}
 *  2. Popular            — from Redis cache:popular_locations (cached 1h)
 *  3. Google Places API  — max 4 results
 *
 * Search history is saved to Postgres + Redis on every search.
 */
import type { CacheService } from '@casalux/services-cache'
import { CacheKeys } from '@casalux/services-cache'
import { SearchHistoryRepository } from '../repositories/search-history.repository.js'
import type { SearchHistoryEntry } from '../repositories/search-history.repository.js'

const GOOGLE_PLACES_URL  = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
const POPULAR_CACHE_TTL  = 3600    // 1 hour
const RECENT_LIST_SIZE   = 20      // Redis LPUSH cap

export interface AutocompleteItem {
  type:        'recent' | 'popular' | 'places_api'
  description: string
  placeId?:    string
  lat?:        number
  lng?:        number
}

export class LocationService {
  private readonly historyRepo = new SearchHistoryRepository()
  private readonly googleKey   = process.env['GOOGLE_MAPS_API_KEY'] ?? ''

  constructor(private readonly cache: CacheService) {}

  // ── Autocomplete ────────────────────────────────────────────────────────────

  async autocomplete(params: {
    q:        string
    clerkId?: string   // optional — enriches with recent history
  }): Promise<AutocompleteItem[]> {
    const { q, clerkId } = params
    const results: AutocompleteItem[] = []

    await Promise.all([
      // 1. Recent searches for auth user
      clerkId ? this.getRecent(clerkId, q).then((items) => results.push(...items)) : Promise.resolve(),

      // 2. Popular destinations
      this.getPopular(q).then((items) => results.push(...items)),

      // 3. Google Places
      this.getPlaces(q).then((items) => results.push(...items)),
    ])

    return results
  }

  private async getRecent(clerkId: string, q: string): Promise<AutocompleteItem[]> {
    const key    = CacheKeys.searchSession(clerkId)
    const prefix = q.toLowerCase()

    // Redis list of past search queries (stored as JSON strings)
    const raw = await this.cache.lrange(key, 0, RECENT_LIST_SIZE - 1)
    return raw
      .filter((item) => item.toLowerCase().startsWith(prefix))
      .slice(0, 3)
      .map((description) => ({ type: 'recent' as const, description }))
  }

  private async getPopular(q: string): Promise<AutocompleteItem[]> {
    const key    = CacheKeys.popularLocations()
    const prefix = q.toLowerCase()

    const raw = await this.cache.get(key)
    const popular = raw ? (JSON.parse(raw) as string[]) : null
    if (!popular) return []

    return popular
      .filter((loc) => loc.toLowerCase().startsWith(prefix))
      .slice(0, 3)
      .map((description) => ({ type: 'popular' as const, description }))
  }

  private async getPlaces(q: string): Promise<AutocompleteItem[]> {
    if (!this.googleKey || q.length < 2) return []

    try {
      const url    = new URL(GOOGLE_PLACES_URL)
      url.searchParams.set('input',    q)
      url.searchParams.set('key',      this.googleKey)
      url.searchParams.set('types',    '(cities)')
      url.searchParams.set('language', 'en')

      const res  = await fetch(url.toString())
      if (!res.ok) return []

      const data = await res.json() as {
        status:      string
        predictions: Array<{ description: string; place_id: string }>
      }

      if (data.status !== 'OK') return []

      return data.predictions.slice(0, 4).map((p) => ({
        type:        'places_api' as const,
        description: p.description,
        placeId:     p.place_id,
      }))
    } catch {
      return []
    }
  }

  // ── Search history ──────────────────────────────────────────────────────────

  async saveSearch(params: {
    clerkId?:   string
    sessionId?: string
    entry:      SearchHistoryEntry
  }) {
    const { clerkId, sessionId, entry } = params

    // Persist to Postgres for auth users
    if (clerkId) {
      await this.historyRepo.save({ userId: clerkId, entry })

      // Also push to Redis session list and cap at RECENT_LIST_SIZE
      const key = CacheKeys.searchSession(clerkId)
      await this.cache.lpush(key, entry.location ?? entry.query)
      await this.cache.ltrim(key, 0, RECENT_LIST_SIZE - 1)
      await this.cache.expire(key, 30 * 24 * 3600) // 30 day TTL
    } else if (sessionId) {
      // Anonymous: Redis only, 7-day TTL
      const key = `session:anon:search:${sessionId}`
      await this.cache.lpush(key, entry.location ?? entry.query)
      await this.cache.ltrim(key, 0, RECENT_LIST_SIZE - 1)
      await this.cache.expire(key, 7 * 24 * 3600)
    }
  }

  async listHistory(clerkId: string, limit = 20) {
    return this.historyRepo.listByUser(clerkId, limit)
  }

  async deleteHistoryItem(id: string, clerkId: string) {
    const deleted = await this.historyRepo.deleteById(id, clerkId)
    if (!deleted) throw new Error('HISTORY_NOT_FOUND')
  }

  async clearHistory(clerkId: string) {
    return this.historyRepo.clearAll(clerkId)
  }
}
