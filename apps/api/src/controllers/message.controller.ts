/**
 * MessageController — HTTP layer for host ↔ guest messaging.
 */
import type { Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { MessageService } from '../services/message.service.js'

function handleMessageError(err: unknown, c: Context) {
  const msg = err instanceof Error ? err.message : 'Unknown error'
  if (msg === 'FORBIDDEN')           return c.json({ error: 'Forbidden' }, 403)
  if (msg === 'THREAD_NOT_FOUND')    return c.json({ error: 'Thread not found' }, 404)
  console.error('[MessageController]', err)
  return c.json({ error: 'Internal server error' }, 500)
}

export class MessageController {
  constructor(private readonly service: MessageService) {}

  /** GET /api/v1/messages/threads — list all threads for the caller */
  async listThreads(c: Context): Promise<Response> {
    try {
      const clerkId = c.get('clerkId') as string
      const threads = await this.service.listMyThreads(clerkId)
      return c.json({ threads })
    } catch (err) {
      return handleMessageError(err, c)
    }
  }

  /** POST /api/v1/messages/threads — get or create a thread */
  async getOrCreateThread(c: Context): Promise<Response> {
    const schema = z.object({
      guestId:           z.string().min(1),
      hostId:            z.string().min(1),
      bookingId:         z.string().optional(),
      bookingRequestId:  z.string().optional(),
    })
    try {
      const body        = await c.req.json() as unknown
      const parsed      = schema.safeParse(body)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId = c.get('clerkId') as string
      const thread  = await this.service.getOrCreateThread({
        callerClerkId:    clerkId,
        ...parsed.data,
      })
      return c.json({ thread }, 201)
    } catch (err) {
      return handleMessageError(err, c)
    }
  }

  /** GET /api/v1/messages/threads/:threadId — thread detail + messages */
  async getThread(c: Context): Promise<Response> {
    try {
      const clerkId  = c.get('clerkId') as string
      const threadId = c.req.param('threadId') as string
      const thread   = await this.service.getThread(threadId, clerkId)
      if (!thread) return c.json({ error: 'Thread not found' }, 404)
      return c.json({ thread })
    } catch (err) {
      return handleMessageError(err, c)
    }
  }

  /** GET /api/v1/messages/threads/:threadId/messages — paginated messages */
  async getMessages(c: Context): Promise<Response> {
    try {
      const clerkId  = c.get('clerkId') as string
      const threadId = c.req.param('threadId') as string
      const cursor   = c.req.query('cursor')
      const limit    = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 100)

      const messages = await this.service.getMessages(threadId, clerkId, cursor, limit)
      const nextCursor = messages.length === limit ? messages[messages.length - 1]?.id : undefined
      return c.json({ messages, nextCursor })
    } catch (err) {
      return handleMessageError(err, c)
    }
  }

  /** POST /api/v1/messages/threads/:threadId/messages — send a message */
  async sendMessage(c: Context): Promise<Response> {
    const schema = z.object({
      body: z.string().min(1).max(3000),
    })
    try {
      const body     = await c.req.json() as unknown
      const parsed   = schema.safeParse(body)
      if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 422)

      const clerkId  = c.get('clerkId') as string
      const threadId = c.req.param('threadId') as string

      const message = await this.service.sendMessage({
        threadId,
        senderId: clerkId,
        body:     parsed.data.body,
      })
      return c.json({ message }, 201)
    } catch (err) {
      return handleMessageError(err, c)
    }
  }

  /** PATCH /api/v1/messages/threads/:threadId/read — mark thread as read */
  async markRead(c: Context): Promise<Response> {
    try {
      const clerkId  = c.get('clerkId') as string
      const threadId = c.req.param('threadId') as string
      await this.service.markAsRead(threadId, clerkId)
      return c.json({ ok: true })
    } catch (err) {
      return handleMessageError(err, c)
    }
  }

  /** GET /api/v1/messages/unread-count — total unread across all threads */
  async getUnreadCount(c: Context): Promise<Response> {
    try {
      const clerkId = c.get('clerkId') as string
      const count   = await this.service.getTotalUnreadCount(clerkId)
      return c.json({ unreadCount: count })
    } catch (err) {
      return handleMessageError(err, c)
    }
  }
}
