import type { MiddlewareHandler } from 'hono'
import { cacheService } from '../container.js'

const WINDOW_SECONDS = 60
const MAX_REQUESTS_IP = 100
const MAX_REQUESTS_USER = 200

export const rateLimiter: MiddlewareHandler = async (c, next) => {
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
  const userId = c.get('userId') as string | undefined

  const ipKey = `rl:ip:${ip}`
  const ipCount = await cacheService.incr(ipKey)
  if (ipCount === 1) await cacheService.expire(ipKey, WINDOW_SECONDS)
  if (ipCount > MAX_REQUESTS_IP) {
    return c.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
      429
    )
  }

  if (userId) {
    const userKey = `rl:user:${userId}`
    const userCount = await cacheService.incr(userKey)
    if (userCount === 1) await cacheService.expire(userKey, WINDOW_SECONDS)
    if (userCount > MAX_REQUESTS_USER) {
      return c.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        429
      )
    }
  }

  await next()
}
