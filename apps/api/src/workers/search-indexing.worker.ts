/**
 * Search Indexing Worker — BullMQ worker for the search-indexing queue.
 * PRD Section 5.3 + Section 6.3
 *
 * Jobs handled:
 *   - index-listing      → upsert single listing into ES
 *   - delete-listing     → remove listing from ES index
 *   - bulk-reindex       → re-index all active listings (blue/green, PRD 6.3)
 *
 * Concurrency: 5 (set in QueueService)
 * Retry: 3x exponential backoff
 */
import type { Job } from 'bullmq'
import { ListingRepository }  from '../repositories/listing.repository.js'
import { ListingService }     from '../services/listing.service.js'
import { cacheService, searchService, queueService } from '../container.js'
import { QUEUES } from '@casalux/services-queue'

const repo    = new ListingRepository()
const service = new ListingService(cacheService, searchService, queueService)

// ─── Worker handler ───────────────────────────────────────────────────────────
export async function searchIndexingHandler(job: Job): Promise<void> {
  const { type, data } = job.data as { type: string; data: Record<string, unknown> }

  switch (type) {
    // ── index-listing ──────────────────────────────────────────────────────
    case 'index-listing': {
      const { listingId } = data as { listingId: string }

      const listing = await repo.findById(listingId)
      if (!listing) {
        console.warn(`[search-indexing] listing ${listingId} not found — skipping`)
        return
      }

      const doc = service.buildESDoc(listing)
      await searchService.index('listings', listingId, doc as unknown as Record<string, unknown>)
      console.log(`[search-indexing] indexed listing ${listingId}`)
      break
    }

    // ── delete-listing ─────────────────────────────────────────────────────
    case 'delete-listing': {
      const { listingId } = data as { listingId: string }

      try {
        await searchService.delete('listings', listingId)
        console.log(`[search-indexing] deleted listing ${listingId} from ES`)
      } catch (err) {
        // 404 from ES means it was never indexed — not an error
        if ((err as { statusCode?: number }).statusCode === 404) {
          console.log(`[search-indexing] listing ${listingId} not in ES — skipping delete`)
          return
        }
        throw err
      }
      break
    }

    // ── bulk-reindex ───────────────────────────────────────────────────────
    // PRD Section 6.3 — triggered by POST /api/v1/admin/search/reindex
    case 'bulk-reindex': {
      const { version } = data as { version?: number }
      console.log('[search-indexing] starting blue/green bulk reindex...')

      const allListings = await repo.findAllActive()
      const docs = allListings.map((l: any) => ({
        id:  l.id,
        doc: service.buildESDoc(l) as unknown as Record<string, unknown>,
      }))

      const newVersion = version ?? Date.now()

      // Cast to ElasticsearchAdapter which has blueGreenReindex
      const esAdapter = searchService as unknown as {
        blueGreenReindex(entity: string, version: number, docs: Array<{ id: string; doc: Record<string, unknown> }>): Promise<void>
      }

      await esAdapter.blueGreenReindex('listings', newVersion, docs)

      console.log(`[search-indexing] bulk reindex complete — ${docs.length} listings, version ${newVersion}`)
      break
    }

    default:
      console.warn(`[search-indexing] unknown job type: ${type}`)
  }
}

// ─── Start worker ─────────────────────────────────────────────────────────────
export function startSearchIndexingWorker() {
  const worker = queueService.process(QUEUES.SEARCH_INDEXING, searchIndexingHandler)

  worker.on('completed', (job) => {
    console.log(`[search-indexing] job ${job.id} completed (${job.data.type})`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[search-indexing] job ${job?.id} failed:`, err.message)
  })

  console.log('[search-indexing] worker started')
  return worker
}
