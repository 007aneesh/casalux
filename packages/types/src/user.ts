import type { UserRole } from './enums.js'

export interface User {
  id: string
  clerkId: string
  email: string
  firstName: string
  lastName: string
  profileImageUrl: string | null
  role: UserRole
  verificationStatus: 'unverified' | 'verified'
  isBanned: boolean
  createdAt: string
  updatedAt: string
}

export interface HostProfile {
  id: string
  userId: string
  bio: string | null
  responseRate: number
  avgResponseTimeHours: number
  isSuperhost: boolean
  totalListings: number
  createdAt: string
}

export interface MessageThread {
  id: string
  bookingRequestId: string | null
  bookingId: string | null
  guestId: string
  hostId: string
  lastMessageAt: string
  unreadCountGuest: number
  unreadCountHost: number
}

export interface Message {
  id: string
  threadId: string
  senderId: string
  body: string
  isRead: boolean
  createdAt: string
}
