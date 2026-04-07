/**
 * One-time script: bulk-index all active listings from Postgres into Elasticsearch.
 *
 * Run after first-time setup or whenever the ES index needs to be rebuilt:
 *   pnpm --filter @casalux/api es:sync
 */
import 'dotenv/config'
import { db } from '@casalux/db'
import { ElasticsearchAdapter } from '@casalux/services-search'
import { ensureESIndices } from '../utils/es-init.js'
import { ListingService } from '../services/listing.service.js'

const search = new ElasticsearchAdapter({ node: process.env['ELASTICSEARCH_URL']! })

async function main() {
  console.log('[es-sync] Ensuring indices...')
  await ensureESIndices(search)

  console.log('[es-sync] Fetching listings from DB...')
  const listings = await db.listing.findMany({
    where: { status: 'active' },
    include: {
      amenities: { include: { amenity: true } },
      host: { include: { user: true } },
    },
  })

  if (listings.length === 0) {
    console.log('[es-sync] No active listings found — nothing to index.')
    process.exit(0)
  }

  console.log(`[es-sync] Indexing ${listings.length} listings...`)

  // Reuse ESListingDoc builder from service (no cache/queue needed here)
  const svc = new ListingService(
    { get: async () => null, set: async () => {}, del: async () => {}, delPattern: async () => {} } as any,
    search,
    { enqueue: async () => {} } as any
  )

  const docs = listings.map((listing: any) => ({
    id: listing.id,
    doc: svc.buildESDoc(listing) as unknown as Record<string, unknown>,
  }))

  await search.bulkIndex('listings', docs)
  console.log(`[es-sync] Done. Indexed ${docs.length} listings into casalux_listings.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('[es-sync] Error:', err)
  process.exit(1)
})
