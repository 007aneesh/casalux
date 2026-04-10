/**
 * ElasticsearchAdapter — default search provider.
 * PRD Section 6 — casalux_listings index mapping, bool query structure, blue/green re-index.
 *
 * Index naming convention: casalux_{entity}
 * Alias naming convention: casalux_{entity} → casalux_{entity}_v{N}
 */
import { Client } from '@elastic/elasticsearch'
import type {
  ISearchService,
  SearchQuery,
  GeoSearchQuery,
  SearchResult,
  Suggestion,
  IndexDoc,
} from '../ISearchService.js'

interface ESConfig {
  node: string
  auth?: { username: string; password: string }
}

export class ElasticsearchAdapter implements ISearchService {
  private client: Client

  constructor(config: ESConfig) {
    this.client = new Client({
      node: config.node,
      auth: config.auth,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })
  }

  private indexName(entity: string): string {
    return `casalux_${entity}`
  }

  async ensureIndex(entity: string, mapping: Record<string, unknown>): Promise<void> {
    const index = this.indexName(entity)
    const exists = await this.client.indices.exists({ index })
    if (!exists) {
      await this.client.indices.create({ index, mappings: mapping as any })
      console.log(`[ES] Created index: ${index}`)
    }
  }

  async index(entity: string, id: string, doc: Record<string, unknown>): Promise<void> {
    await this.client.index({
      index: this.indexName(entity),
      id,
      document: doc,
    })
  }

  async delete(entity: string, id: string): Promise<void> {
    await this.client.delete({ index: this.indexName(entity), id })
  }

  async search<T = Record<string, unknown>>(
    entity: string,
    query: SearchQuery
  ): Promise<SearchResult<T>> {
    const from = ((query.page ?? 1) - 1) * (query.limit ?? 20)

    const response = await this.client.search<T>({
      index: this.indexName(entity),
      from,
      size: query.limit ?? 20,
      query: query.filters ?? { match_all: {} },
      sort: query.sort?.map((s) => ({ [s.field]: s.order })),
    })

    return {
      hits: response.hits.hits.map((h) => h._source as T),
      total: typeof response.hits.total === 'number' ? response.hits.total : (response.hits.total?.value ?? 0),
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    }
  }

  async geoSearch<T = Record<string, unknown>>(
    entity: string,
    query: GeoSearchQuery
  ): Promise<SearchResult<T>> {
    return this.search<T>(entity, {
      ...query,
      filters: {
        ...query.filters,
        geo_distance: {
          distance: `${query.distanceKm}km`,
          location: { lat: query.lat, lon: query.lng },
        },
      },
    })
  }

  async suggest(entity: string, prefix: string): Promise<Suggestion[]> {
    const response = await this.client.search({
      index: this.indexName(entity),
      suggest: {
        title_suggest: {
          prefix,
          completion: { field: 'title.suggest', size: 5 },
        },
      },
    })

    const suggests = response.suggest?.['title_suggest']
    if (!suggests || !Array.isArray(suggests)) return []

    return suggests.flatMap((s) =>
      (s.options as Array<{ text: string; _score: number }>).map((o) => ({
        text: o.text,
        score: o._score,
      }))
    )
  }

  async bulkIndex(entity: string, docs: IndexDoc[]): Promise<void> {
    if (docs.length === 0) return

    const operations = docs.flatMap(({ id, doc }) => [
      { index: { _index: this.indexName(entity), _id: id } },
      doc,
    ])

    await this.client.bulk({ operations })
  }

  // ─── Blue/Green Re-index (PRD Section 6.3) ────────────────────────────────
  async blueGreenReindex(entity: string, newVersion: number, docs: IndexDoc[]): Promise<void> {
    const alias = this.indexName(entity)
    const newIndex = `${alias}_v${newVersion}`
    const oldIndex = `${alias}_v${newVersion - 1}`

    // 1. Create new index with alias-pending name
    await this.client.indices.create({ index: newIndex })

    // 2. Bulk-index all docs into new index
    if (docs.length > 0) {
      const operations = docs.flatMap(({ id, doc }) => [
        { index: { _index: newIndex, _id: id } },
        doc,
      ])
      await this.client.bulk({ operations })
    }

    // 3. Atomic alias swap
    await this.client.indices.updateAliases({
      actions: [
        { remove: { index: oldIndex, alias } },
        { add: { index: newIndex, alias } },
      ],
    })

    // 4. Delete old index
    try {
      await this.client.indices.delete({ index: oldIndex })
    } catch {
      // Old index may not exist on first run — ignore
    }
  }
}
