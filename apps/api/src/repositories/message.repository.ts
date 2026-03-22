/**
 * MessageRepository — all DB queries for MessageThread + Message.
 * PRD Phase 3 mentions real-time (Ably/WebSocket); for now polling via REST.
 */
import { db as prisma } from '@casalux/db'

// ─── Inferred types ───────────────────────────────────────────────────────────
type ThreadWithMessages = Awaited<ReturnType<typeof MessageRepository.prototype.findThreadById>>
type ThreadSummary      = Awaited<ReturnType<typeof MessageRepository.prototype.listUserThreads>>

export type { ThreadWithMessages, ThreadSummary }

export class MessageRepository {
  // ── Thread queries ──────────────────────────────────────────────────────────

  async findThreadById(threadId: string) {
    return prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        guest:    { select: { id: true, clerkId: true, firstName: true, lastName: true, profileImageUrl: true } },
        host:     { select: { id: true, clerkId: true, firstName: true, lastName: true, profileImageUrl: true } },
        booking:  { select: { id: true, status: true, checkIn: true, checkOut: true } },
        bookingRequest: { select: { id: true, status: true, checkIn: true, checkOut: true } },
      },
    })
  }

  async findThreadByBookingId(bookingId: string) {
    return prisma.messageThread.findUnique({
      where: { bookingId },
    })
  }

  async findThreadByRequestId(bookingRequestId: string) {
    return prisma.messageThread.findUnique({
      where: { bookingRequestId },
    })
  }

  async findOrCreateThread(params: {
    guestId:          string
    hostId:           string
    bookingId?:       string
    bookingRequestId?: string
  }) {
    // Try find by booking/request first
    if (params.bookingId) {
      const existing = await this.findThreadByBookingId(params.bookingId)
      if (existing) return existing
    }
    if (params.bookingRequestId) {
      const existing = await this.findThreadByRequestId(params.bookingRequestId)
      if (existing) return existing
    }

    return prisma.messageThread.create({
      data: {
        guestId:          params.guestId,
        hostId:           params.hostId,
        bookingId:        params.bookingId,
        bookingRequestId: params.bookingRequestId,
        lastMessageAt:    new Date(),
      },
    })
  }

  async listUserThreads(clerkId: string, role: 'guest' | 'host') {
    const where = role === 'guest'
      ? { guestId: clerkId }
      : { hostId:  clerkId }

    return prisma.messageThread.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        guest: { select: { id: true, clerkId: true, firstName: true, lastName: true, profileImageUrl: true } },
        host:  { select: { id: true, clerkId: true, firstName: true, lastName: true, profileImageUrl: true } },
        booking:        { select: { id: true, status: true, checkIn: true, checkOut: true } },
        bookingRequest: { select: { id: true, status: true, checkIn: true, checkOut: true } },
      },
    })
  }

  // ── Message queries ─────────────────────────────────────────────────────────

  async getMessages(threadId: string, cursor?: string, limit = 50) {
    return prisma.message.findMany({
      where:   { threadId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
  }

  async createMessage(data: {
    threadId: string
    senderId: string
    body:     string
  }) {
    const [message] = await prisma.$transaction([
      prisma.message.create({ data }),
      prisma.messageThread.update({
        where: { id: data.threadId },
        data:  { lastMessageAt: new Date(), updatedAt: new Date() },
      }),
    ])
    return message
  }

  async markThreadRead(threadId: string, readerRole: 'guest' | 'host') {
    const field = readerRole === 'guest' ? 'unreadCountGuest' : 'unreadCountHost'
    await prisma.$transaction([
      prisma.messageThread.update({
        where: { id: threadId },
        data:  { [field]: 0 },
      }),
      prisma.message.updateMany({
        where:  { threadId, isRead: false },
        data:   { isRead: true },
      }),
    ])
  }

  async incrementUnreadCount(threadId: string, recipientRole: 'guest' | 'host') {
    const field = recipientRole === 'guest' ? 'unreadCountGuest' : 'unreadCountHost'
    await prisma.messageThread.update({
      where: { id: threadId },
      data:  { [field]: { increment: 1 } },
    })
  }

  async verifyThreadParticipant(threadId: string, clerkId: string): Promise<boolean> {
    const thread = await prisma.messageThread.findUnique({
      where:  { id: threadId },
      select: { guestId: true, hostId: true },
    })
    if (!thread) return false
    return thread.guestId === clerkId || thread.hostId === clerkId
  }
}
