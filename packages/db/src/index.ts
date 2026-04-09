import { PrismaClient } from '../generated/prisma-client/index.js'

// Singleton pattern — one PrismaClient per process
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env['NODE_ENV'] !== 'production') globalForPrisma.prisma = db

export { Prisma } from '../generated/prisma-client/index.js'
export type { PrismaClient } from '../generated/prisma-client/index.js'

// ─── Enum types — single source of truth lives in @casalux/types ─────────────
// Re-exported here so DB-layer code can import from one place (@casalux/db)
// rather than mixing @casalux/types and @casalux/db imports.
export type {
  UserRole,
  VerificationStatus,
  PropertyType,
  RoomType,
  ListingStatus,
  CancellationPolicy,
  BookingStatus,
  BookingRequestStatus,
  PayoutStatus,
  RefundStatus,
  DiscountType,
  AvailabilityRuleType,
  HostApplicationStatus,
  DeclineReason,
  PaymentProvider,
} from '@casalux/types'
