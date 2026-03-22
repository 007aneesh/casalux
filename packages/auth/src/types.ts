import type { UserRole } from '@casalux/types'

export interface AuthUser {
  userId: string
  clerkId: string
  role: UserRole
  email: string
}

// Hono context variables type augmentation
declare module 'hono' {
  interface ContextVariableMap {
    userId: string
    authUser: AuthUser
  }
}
