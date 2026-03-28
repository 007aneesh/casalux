import { auth } from '@clerk/nextjs/server'

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { getToken } = await auth()
  const token = await getToken()

  const res = await fetch(`${API_BASE}/api/v1/admin${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export interface AdminStats {
  activeListings: number
  totalBookings:  number
  totalUsers:     number
  pendingApps:    number
}

export function getStats() {
  return adminFetch<AdminStats>('/stats')
}

// ─── Listings ─────────────────────────────────────────────────────────────────
export interface AdminListing {
  id:           string
  title:        string
  status:       string
  basePrice:    number
  currency:     string
  createdAt:    string
  address:      Record<string, string>
  host: {
    user: { firstName: string; lastName: string; email: string }
  }
}

export function getListings(page = 1, status?: string) {
  const qs = new URLSearchParams({ page: String(page) })
  if (status) qs.set('status', status)
  return adminFetch<{ listings: AdminListing[]; total: number; page: number; limit: number }>(`/listings?${qs}`)
}

export function updateListingStatus(id: string, status: string) {
  return adminFetch(`/listings/${id}/status`, {
    method: 'PATCH',
    body:   JSON.stringify({ status }),
  })
}

// ─── Bookings ─────────────────────────────────────────────────────────────────
export interface AdminBooking {
  id:          string
  status:      string
  checkIn:     string
  checkOut:    string
  totalAmount: number
  currency:    string
  createdAt:   string
  guest:   { firstName: string; lastName: string; email: string }
  listing: { title: string; address: Record<string, string> }
}

export function getBookings(page = 1) {
  return adminFetch<{ bookings: AdminBooking[]; total: number; page: number; limit: number }>(`/bookings?page=${page}`)
}

// ─── Users ────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id:                 string
  clerkId:            string
  email:              string
  firstName:          string
  lastName:           string
  role:               string
  verificationStatus: string
  isBanned:           boolean
  createdAt:          string
}

export function getUsers(page = 1, role?: string) {
  const qs = new URLSearchParams({ page: String(page) })
  if (role) qs.set('role', role)
  return adminFetch<{ users: AdminUser[]; total: number; page: number; limit: number }>(`/users?${qs}`)
}

// ─── Host applications ────────────────────────────────────────────────────────
export interface AdminHostApplication {
  id:          string
  status:      string
  submittedAt: string | null
  user: { firstName: string; lastName: string; email: string }
}

export function getHostApplications() {
  return adminFetch<{ applications: AdminHostApplication[] }>('/host-applications')
}

export function approveHostApplication(sessionId: string) {
  return adminFetch(`/host-applications/${sessionId}/approve`, { method: 'POST' })
}

export function rejectHostApplication(sessionId: string, reason: string) {
  return adminFetch(`/host-applications/${sessionId}/reject`, {
    method: 'POST',
    body:   JSON.stringify({ reason }),
  })
}
