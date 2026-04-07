/**
 * CacheService — Redis wrapper (ioredis).
 * PRD Section 3.4 + Section 5 — namespaced keys, explicit TTLs.
 *
 * ALL Redis key constants are defined here to enforce PRD Section 5.1 namespace conventions.
 */
import { Redis } from 'ioredis'

interface CacheConfig {
  url: string
}

export class CacheService {
  private redis: Redis

  constructor(config: CacheConfig) {
    this.redis = new Redis(config.url, { lazyConnect: true })
  }

  // ─── Core Operations ──────────────────────────────────────────────────────
  async get(key: string): Promise<string | null> {
    return this.redis.get(key)
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      await this.redis.setex(key, ttlSeconds, value)
    } else {
      await this.redis.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.redis.expire(key, ttlSeconds)
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key)
  }

  async decr(key: string): Promise<number> {
    return this.redis.decr(key)
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.redis.hget(key, field)
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.redis.hset(key, field, value)
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redis.hgetall(key)
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.redis.lpush(key, ...values)
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    await this.redis.ltrim(key, start, stop)
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.lrange(key, start, stop)
  }

  /** SET NX — acquire distributed lock. Returns true if lock acquired. */
  async setNx(key: string, value: string, ttlMs: number): Promise<boolean> {
    const result = await this.redis.set(key, value, 'PX', ttlMs, 'NX')
    return result === 'OK'
  }

  /** Pattern delete — use with care (SCAN-based batch delete) */
  async delPattern(pattern: string): Promise<void> {
    const stream = this.redis.scanStream({ match: pattern, count: 100 })
    const pipeline = this.redis.pipeline()
    stream.on('data', (keys: string[]) => {
      for (const key of keys) pipeline.del(key)
    })
    await new Promise<void>((resolve, reject) => {
      stream.on('end', () => { void pipeline.exec().then(() => resolve()) })
      stream.on('error', reject)
    })
  }

  /** Publish to a Redis channel (for real-time messaging, PRD Section 8.4) */
  async publish(channel: string, message: string): Promise<void> {
    await this.redis.publish(channel, message)
  }

  getClient(): Redis {
    return this.redis
  }

  async disconnect(): Promise<void> {
    await this.redis.quit()
  }
}

// ─── Redis Key Namespace Constants (PRD Section 5.1) ─────────────────────────
export const CacheKeys = {
  listing: (id: string) => `cache:listing:${id}`,
  listings: (hash: string) => `cache:listings:${hash}`,
  recommend: (userId: string) => `cache:recommend:${userId}`,
  quickFilter: (slug: string) => `cache:qf:${slug}`,
  hostProfile: (userId: string) => `cache:host:${userId}`,
  popularLocations: () => `cache:popular_locations`,
  pricing: (listingId: string, hash: string) => `cache:pricing:${listingId}:${hash}`,
  searchSession: (userId: string) => `session:search:${userId}`,
  rateLimitIp: (ip: string) => `rl:ip:${ip}`,
  rateLimitUser: (userId: string) => `rl:user:${userId}`,
  bookingLock: (listingId: string, checkIn: string, checkOut: string) =>
    `bklock:${listingId}:${checkIn}:${checkOut}`,
  softHold: (listingId: string, checkIn: string) => `sreq:${listingId}:${checkIn}`,
  preApprovalHold: (listingId: string, checkIn: string) => `preq:${listingId}:${checkIn}`,
  webhookIdempotency: (provider: string, eventId: string) => `webhook:${provider}:${eventId}`,
  promoUses: (code: string) => `promo:${code}:uses`,
  uploadJob: (jobId: string) => `job:upload:${jobId}`,
  availability: (listingId: string, yearMonth: string) => `avail:${listingId}:${yearMonth}`,
  threadUnread: (userId: string) => `thread:unread:${userId}`,
  paySession: (orderId: string) => `pay:${orderId}`,
  rtbRemind: (requestId: string, stage: string) => `rtb:remind:${requestId}:${stage}`,
  requestExpireJob: (requestId: string) => `job:req-expire:${requestId}`,
  paymentWindowJob: (requestId: string) => `job:pw-expire:${requestId}`,
} as const
