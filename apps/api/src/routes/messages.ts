/**
 * Messages router — host ↔ guest messaging.
 * PRD Phase 3 notes real-time (WebSocket/Ably) is a future upgrade.
 * This REST layer is the foundation; real-time wraps these same endpoints.
 *
 * Threads:
 *   GET   /api/v1/messages/threads                     — list caller's threads
 *   POST  /api/v1/messages/threads                     — get or create thread
 *   GET   /api/v1/messages/threads/:threadId           — thread detail
 *   GET   /api/v1/messages/threads/:threadId/messages  — paginated messages
 *   POST  /api/v1/messages/threads/:threadId/messages  — send message
 *   PATCH /api/v1/messages/threads/:threadId/read      — mark thread read
 *   GET   /api/v1/messages/unread-count                — total unread badge count
 */
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { MessageService }    from '../services/message.service.js'
import { MessageController } from '../controllers/message.controller.js'
import { cacheService, queueService } from '../container.js'

const service    = new MessageService(cacheService, queueService)
const controller = new MessageController(service)

export const messagesRouter = new Hono()

messagesRouter.use('*', requireAuth())

// Static routes before :threadId param
messagesRouter.get('/unread-count',               (c) => controller.getUnreadCount(c))
messagesRouter.get('/threads',                    (c) => controller.listThreads(c))
messagesRouter.post('/threads',                   (c) => controller.getOrCreateThread(c))
messagesRouter.get('/threads/:threadId',          (c) => controller.getThread(c))
messagesRouter.get('/threads/:threadId/messages', (c) => controller.getMessages(c))
messagesRouter.post('/threads/:threadId/messages',(c) => controller.sendMessage(c))
messagesRouter.patch('/threads/:threadId/read',   (c) => controller.markRead(c))
