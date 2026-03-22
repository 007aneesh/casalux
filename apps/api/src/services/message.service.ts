/**
 * MessageService — business logic for host ↔ guest messaging.
 * PRD Phase 3 notes real-time via WebSocket/Ably; this is the REST polling layer.
 * Real-time will wrap these same methods when implemented.
 */
import type { CacheService } from '@casalux/services-cache'
import { CacheKeys } from '@casalux/services-cache'
import type { QueueService } from '@casalux/services-queue'
import { QUEUES } from '@casalux/services-queue'
import { MessageRepository } from '../repositories/message.repository.js'
import { db as prisma } from '@casalux/db'

export class MessageService {
  private readonly repo = new MessageRepository()

  constructor(
    private readonly cache: CacheService,
    private readonly queue: QueueService,
  ) {}

  // ── Thread operations ───────────────────────────────────────────────────────

  async getOrCreateThread(params: {
    callerClerkId:     string
    guestId:           string
    hostId:            string
    bookingId?:        string
    bookingRequestId?: string
  }) {
    // Caller must be one of the participants
    if (
      params.callerClerkId !== params.guestId &&
      params.callerClerkId !== params.hostId
    ) {
      throw new Error('FORBIDDEN')
    }

    return this.repo.findOrCreateThread({
      guestId:          params.guestId,
      hostId:           params.hostId,
      bookingId:        params.bookingId,
      bookingRequestId: params.bookingRequestId,
    })
  }

  async listMyThreads(clerkId: string) {
    // A user can be both a guest and a host — return all threads they participate in
    const [asGuest, asHost] = await Promise.all([
      this.repo.listUserThreads(clerkId, 'guest'),
      this.repo.listUserThreads(clerkId, 'host'),
    ])

    // Merge and de-duplicate by thread id, sort by lastMessageAt desc
    const seen  = new Set<string>()
    const all   = [...asGuest, ...asHost].filter((t) => {
      if (seen.has(t.id)) return false
      seen.add(t.id)
      return true
    })
    return all.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
  }

  async getThread(threadId: string, clerkId: string) {
    const isParticipant = await this.repo.verifyThreadParticipant(threadId, clerkId)
    if (!isParticipant) throw new Error('FORBIDDEN')

    return this.repo.findThreadById(threadId)
  }

  // ── Message operations ──────────────────────────────────────────────────────

  async getMessages(
    threadId: string,
    clerkId:  string,
    cursor?:  string,
    limit     = 50,
  ) {
    const isParticipant = await this.repo.verifyThreadParticipant(threadId, clerkId)
    if (!isParticipant) throw new Error('FORBIDDEN')

    return this.repo.getMessages(threadId, cursor, limit)
  }

  async sendMessage(params: {
    threadId: string
    senderId: string
    body:     string
  }) {
    const { threadId, senderId, body } = params

    if (!body.trim()) throw new Error('Message body cannot be empty')
    if (body.length > 3000) throw new Error('Message exceeds 3000 characters')

    const thread = await this.repo.findThreadById(threadId)
    if (!thread) throw new Error('THREAD_NOT_FOUND')

    const isParticipant =
      thread.guestId === senderId || thread.hostId === senderId
    if (!isParticipant) throw new Error('FORBIDDEN')

    const message = await this.repo.createMessage({ threadId, senderId, body })

    // Increment unread count for the OTHER participant
    const recipientRole = senderId === thread.guestId ? 'host' : 'guest'
    await this.repo.incrementUnreadCount(threadId, recipientRole)

    // Invalidate thread unread cache for recipient
    const recipientClerkId = recipientRole === 'guest' ? thread.guestId : thread.hostId
    await this.cache.del(CacheKeys.threadUnread(recipientClerkId))

    // Enqueue email notification for recipient (non-blocking)
    await this.queue.enqueue(QUEUES.EMAIL, {
      type: 'message.new',
      data: {
        threadId,
        messageId:         message.id,
        senderId,
        recipientClerkId,
      },
    })

    return message
  }

  async markAsRead(threadId: string, clerkId: string) {
    const thread = await this.repo.findThreadById(threadId)
    if (!thread) throw new Error('THREAD_NOT_FOUND')

    const readerRole =
      clerkId === thread.guestId ? 'guest'
      : clerkId === thread.hostId ? 'host'
      : null

    if (!readerRole) throw new Error('FORBIDDEN')

    await this.repo.markThreadRead(threadId, readerRole)
    await this.cache.del(CacheKeys.threadUnread(clerkId))
  }

  async getTotalUnreadCount(clerkId: string): Promise<number> {
    const cacheKey = CacheKeys.threadUnread(clerkId)
    const cachedRaw = await this.cache.get(cacheKey)
    const cached   = cachedRaw !== null ? parseInt(cachedRaw, 10) : null
    if (cached !== null) return cached

    const result = await prisma.messageThread.aggregate({
      where: {
        OR: [
          { guestId: clerkId },
          { hostId:  clerkId },
        ],
      },
      _sum: {
        unreadCountGuest: true,
        unreadCountHost:  true,
      },
    })

    // Sum the correct column based on clerkId role
    const threads = await prisma.messageThread.findMany({
      where: { OR: [{ guestId: clerkId }, { hostId: clerkId }] },
      select: { guestId: true, unreadCountGuest: true, unreadCountHost: true },
    })

    const total = threads.reduce((sum: number, t: { guestId: string; unreadCountGuest: number; unreadCountHost: number }) => {
      return sum + (t.guestId === clerkId ? t.unreadCountGuest : t.unreadCountHost)
    }, 0)

    // Suppress unused variable warning from aggregate above
    void result

    await this.cache.set(cacheKey, String(total), 300)
    return total
  }
}
