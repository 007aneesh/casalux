/**
 * LocationController — autocomplete + search history HTTP layer.
 * PRD Section 10.
 */
import type { Context } from 'hono'
import { z } from 'zod'
import type { LocationService } from '../services/location.service.js'

function handleLocationError(err: unknown, c: Context) {
  const msg = err instanceof Error ? err.message : ''
  if (msg === 'HISTORY_NOT_FOUND') return c.json({ error: 'Search history entry not found' }, 404)
  console.error('[LocationController]', err)
  return c.json({ error: 'Internal server error' }, 500)
}

export class LocationController {
  constructor(private readonly service: LocationService) {}

  /** GET /api/v1/locations/autocomplete?q= */
  async autocomplete(c: Context): Promise<Response> {
    try {
      const q = c.req.query('q') ?? ''

      const authUser = c.get('authUser') as { userId?: string } | undefined
      const raw  = await this.service.autocomplete({
        q,
        clerkId: authUser?.userId,
      })

      // Map internal AutocompleteItem to the LocationSuggestion shape the frontend expects
      const data = raw.map((item, i) => ({
        id:       item.placeId ?? `${item.type}-${i}`,
        label:    item.description,
        type:     item.type,
      }))

      return c.json({ success: true, data })
    } catch (err) {
      return handleLocationError(err, c)
    }
  }

  /** POST /api/v1/search/history — save a search (called automatically on search) */
  async saveSearch(c: Context): Promise<Response> {
    const schema = z.object({
      query:       z.string().min(1).max(200),
      location:    z.string().max(200).optional(),
      lat:         z.number().optional(),
      lng:         z.number().optional(),
      resultCount: z.number().int().min(0).default(0),
      sessionId:   z.string().optional(),
    })
    try {
      const body   = await c.req.json() as unknown
      const parsed = schema.safeParse(body)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const authUser = c.get('authUser') as { userId?: string } | undefined
      await this.service.saveSearch({
        clerkId:   authUser?.userId,
        sessionId: parsed.data.sessionId,
        entry: {
          query:       parsed.data.query,
          location:    parsed.data.location,
          lat:         parsed.data.lat,
          lng:         parsed.data.lng,
          resultCount: parsed.data.resultCount,
        },
      })
      return c.json({ ok: true })
    } catch (err) {
      return handleLocationError(err, c)
    }
  }

  /** GET /api/v1/users/me/search-history */
  async listHistory(c: Context): Promise<Response> {
    try {
      const clerkId = c.get('userId') as string
      const limit   = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 50)
      const history = await this.service.listHistory(clerkId, limit)
      return c.json({ history })
    } catch (err) {
      return handleLocationError(err, c)
    }
  }

  /** DELETE /api/v1/users/me/search-history/:id */
  async deleteHistoryItem(c: Context): Promise<Response> {
    try {
      const clerkId = c.get('userId') as string
      const id      = c.req.param('id') as string
      await this.service.deleteHistoryItem(id, clerkId)
      return c.json({ ok: true })
    } catch (err) {
      return handleLocationError(err, c)
    }
  }

  /** DELETE /api/v1/users/me/search-history — clear all */
  async clearHistory(c: Context): Promise<Response> {
    try {
      const clerkId = c.get('userId') as string
      const count   = await this.service.clearHistory(clerkId)
      return c.json({ deleted: count })
    } catch (err) {
      return handleLocationError(err, c)
    }
  }
}
