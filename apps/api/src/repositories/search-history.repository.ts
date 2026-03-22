/**
 * SearchHistoryRepository — DB + Redis ops for search history.
 * PRD Section 10.1.
 *
 * Storage:
 * - Auth users: PostgreSQL (persistent) + Redis LPUSH (session cache, cap 20)
 * - Anonymous:  Redis only, keyed by sessionId, TTL 7 days
 */
import { db as prisma } from '@casalux/db'

export interface SearchHistoryEntry {
  query:       string
  location?:   string
  lat?:        number
  lng?:        number
  resultCount: number
}

export class SearchHistoryRepository {
  async save(params: {
    userId?:     string   // Clerk userId (clerkId) — null for anonymous
    sessionId?:  string
    entry:       SearchHistoryEntry
  }) {
    if (!params.userId && !params.sessionId) return null

    return prisma.searchHistory.create({
      data: {
        userId:      params.userId ? undefined : undefined,
        user:        params.userId ? { connect: { clerkId: params.userId } } : undefined,
        sessionId:   params.sessionId,
        query:       params.entry.query,
        location:    params.entry.location,
        lat:         params.entry.lat,
        lng:         params.entry.lng,
        resultCount: params.entry.resultCount,
      },
    })
  }

  async listByUser(clerkId: string, limit = 20) {
    return prisma.searchHistory.findMany({
      where:   { user: { clerkId } },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    })
  }

  async deleteById(id: string, clerkId: string): Promise<boolean> {
    const record = await prisma.searchHistory.findFirst({
      where: { id, user: { clerkId } },
    })
    if (!record) return false

    await prisma.searchHistory.delete({ where: { id } })
    return true
  }

  async clearAll(clerkId: string): Promise<number> {
    const result = await prisma.searchHistory.deleteMany({
      where: { user: { clerkId } },
    })
    return result.count
  }
}
