import type { UserRole } from '@casalux/types'

export interface AuthUser {
  userId:   string   // Clerk user ID (same as clerkId)
  clerkId:  string   // Clerk user ID
  dbUserId: string   // Internal DB User.id (CUID)
  role:     UserRole
  email:    string
}

// Hono context variables type augmentation
declare module 'hono' {
  interface ContextVariableMap {
    userId: string
    authUser: AuthUser
  }
}
