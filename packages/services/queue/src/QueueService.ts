/**
 * QueueService — BullMQ wrapper.
 * PRD Section 5.3 — all external side effects dispatched via queues, never inline.
 *
 * CRITICAL: payment-events queue MUST have concurrency: 1 (serial processing).
 * This is intentional — see PRD Section 5.3 warning.
 */
import { Queue, Worker, type JobsOptions, type Processor } from 'bullmq'
import IORedis from 'ioredis'

interface QueueConfig {
  redisUrl: string
}

// ─── Queue Name Constants (PRD Section 5.3) ──────────────────────────────────
export const QUEUES = {
  SEARCH_INDEXING: 'search-indexing',
  MEDIA_PROCESSING: 'media-processing',
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  PAYMENT_EVENTS: 'payment-events',   // concurrency: 1 — DO NOT CHANGE
  ANALYTICS: 'analytics',
  HOST_COMPUTE: 'host-compute',
  BOOKING_REQUESTS: 'booking-requests',
  BOOKINGS: 'bookings',
} as const

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES]

// ─── Concurrency map (PRD Section 5.3) ───────────────────────────────────────
const CONCURRENCY: Record<QueueName, number> = {
  [QUEUES.SEARCH_INDEXING]: 5,
  [QUEUES.MEDIA_PROCESSING]: 3,
  [QUEUES.EMAIL]: 10,
  [QUEUES.NOTIFICATIONS]: 10,
  [QUEUES.PAYMENT_EVENTS]: 1,   // INTENTIONAL — serial, no race conditions
  [QUEUES.ANALYTICS]: 20,
  [QUEUES.HOST_COMPUTE]: 2,
  [QUEUES.BOOKING_REQUESTS]: 5,
  [QUEUES.BOOKINGS]: 5,
}

// ─── Retry config ─────────────────────────────────────────────────────────────
const RETRY: Record<QueueName, number> = {
  [QUEUES.SEARCH_INDEXING]: 3,
  [QUEUES.MEDIA_PROCESSING]: 3,
  [QUEUES.EMAIL]: 5,
  [QUEUES.NOTIFICATIONS]: 2,
  [QUEUES.PAYMENT_EVENTS]: 5,
  [QUEUES.ANALYTICS]: 1,
  [QUEUES.HOST_COMPUTE]: 2,
  [QUEUES.BOOKING_REQUESTS]: 3,
  [QUEUES.BOOKINGS]: 3,
}

export interface JobPayload {
  type: string
  data: Record<string, unknown>
}

export class QueueService {
  private connection: IORedis
  private queues: Map<string, Queue> = new Map()

  constructor(config: QueueConfig) {
    this.connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null })
  }

  private getQueue(name: QueueName): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(
        name,
        new Queue(name, {
          connection: this.connection,
          defaultJobOptions: {
            attempts: RETRY[name],
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { count: 1000 },
            removeOnFail: { count: 5000 },
          },
        })
      )
    }
    return this.queues.get(name)!
  }

  async enqueue(
    queue: QueueName,
    job: JobPayload,
    opts?: JobsOptions
  ): Promise<string> {
    const q = this.getQueue(queue)
    const result = await q.add(job.type, job.data, opts)
    return result.id ?? ''
  }

  async enqueueDelayed(
    queue: QueueName,
    job: JobPayload,
    delayMs: number
  ): Promise<string> {
    return this.enqueue(queue, job, { delay: delayMs })
  }

  process(
    queue: QueueName,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: Processor<any, any, string>
  ): Worker {
    return new Worker(queue, handler, {
      connection: this.connection,
      concurrency: CONCURRENCY[queue],
    })
  }

  async removeJob(queue: QueueName, jobId: string): Promise<void> {
    const q = this.getQueue(queue)
    const job = await q.getJob(jobId)
    if (job) await job.remove()
  }

  async disconnect(): Promise<void> {
    for (const q of this.queues.values()) await q.close()
    await this.connection.quit()
  }
}
