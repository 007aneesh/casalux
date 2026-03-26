/**
 * ISearchService — Service Bus Interface for search.
 * PRD Section 3.3 — PostgreSQL is source of truth; ES is always derived and eventually-consistent.
 */

export interface SearchQuery {
  text?: string
  filters?: Record<string, unknown>
  geoFilter?: { lat: number; lng: number; distanceKm: number }
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>
  page?: number
  limit?: number
}

export interface GeoSearchQuery extends SearchQuery {
  lat: number
  lng: number
  distanceKm: number
}

export interface SearchResult<T = Record<string, unknown>> {
  hits: T[]
  total: number
  page: number
  limit: number
}

export interface Suggestion {
  text: string
  score: number
}

export interface IndexDoc {
  id: string
  doc: Record<string, unknown>
}

export interface ISearchService {
  ensureIndex(entity: string, mapping: Record<string, unknown>): Promise<void>
  index(entity: string, id: string, doc: Record<string, unknown>): Promise<void>
  delete(entity: string, id: string): Promise<void>
  search<T = Record<string, unknown>>(entity: string, query: SearchQuery): Promise<SearchResult<T>>
  geoSearch<T = Record<string, unknown>>(entity: string, query: GeoSearchQuery): Promise<SearchResult<T>>
  suggest(entity: string, prefix: string): Promise<Suggestion[]>
  bulkIndex(entity: string, docs: IndexDoc[]): Promise<void>
}
