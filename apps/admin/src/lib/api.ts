import { auth } from '@clerk/nextjs/server'

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

async function getAuthHeader(): Promise<Record<string, string>> {
  const { getToken } = await auth()
  const token = await getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch<T>(prefix: string, path: string, init?: RequestInit): Promise<T> {
  const authHeader = await getAuthHeader()

  const res = await fetch(`${API_BASE}/api/v1/${prefix}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
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

// Admin-prefix routes  (e.g. GET /api/v1/admin/listings)
function adminFetch<T>(path: string, init?: RequestInit) {
  return apiFetch<T>('admin', path, init)
}

// Host-prefix routes — admin token bypasses ownership check on the backend
// Used for single-listing GET and full-listing PUT, which have no admin counterpart
function hostFetch<T>(path: string, init?: RequestInit) {
  return apiFetch<T>('host', path, init)
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export interface AdminStats {
  activeListings:   number
  totalBookings:    number
  totalUsers:       number
  pendingApps:      number
  flaggedListings:  number
  disputedBookings: number
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

export interface AdminListingDetail extends Omit<AdminListing, 'host'> {
  host: {
    user: { id: string; firstName: string; lastName: string; email: string; profileImageUrl: string | null }
    isSuperhost:          boolean
    responseRate:         number
    avgResponseTimeHours: number
  }
  description:             string
  propertyType:            string
  roomType:                string
  lat:                     number
  lng:                     number
  amenities:               string[]
  images:                  { url: string; publicId: string; isPrimary: boolean; order: number }[]
  cleaningFee:             number
  minNights:               number
  maxNights:               number | null
  maxGuests:               number
  bedrooms:                number
  beds:                    number
  baths:                   number
  instantBook:             boolean
  checkInTime:             string
  checkOutTime:            string
  cancellationPolicy:      string
  avgRating:               number
  totalReviews:            number
  requireVerifiedId:       boolean
  requireProfilePhoto:     boolean
  requirePositiveReviews:  boolean
  updatedAt:               string
}

export type UpdateListingPayload = Partial<Omit<AdminListingDetail, 'id' | 'host' | 'avgRating' | 'totalReviews' | 'createdAt' | 'updatedAt'>>

export function getListings(page = 1, status?: string) {
  const qs = new URLSearchParams({ page: String(page) })
  if (status) qs.set('status', status)
  return adminFetch<{ listings: AdminListing[]; total: number; page: number; limit: number }>(`/listings?${qs}`)
}

// GET /api/v1/host/listings/:id  — admin token bypasses ownership check
export async function getListing(id: string) {
  const res = await hostFetch<{ success: boolean; data: AdminListingDetail }>(`/listings/${id}`)
  return res.data
}

// PUT /api/v1/host/listings/:id  — admin token bypasses ownership check
export async function updateListing(id: string, data: UpdateListingPayload) {
  const res = await hostFetch<{ success: boolean; data: AdminListingDetail }>(`/listings/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(data),
  })
  return res.data
}

// PATCH /api/v1/admin/listings/:id/status  — dedicated admin endpoint, exists
export function updateListingStatus(id: string, status: string) {
  return adminFetch(`/listings/${id}/status`, {
    method: 'PATCH',
    body:   JSON.stringify({ status }),
  })
}

// DELETE /api/v1/host/listings/:id  — admin token bypasses ownership check
export function deleteListing(id: string) {
  return hostFetch(`/listings/${id}`, { method: 'DELETE' })
}

// POST /api/v1/admin/listings/:id/amenities  — create & attach a custom amenity
export function addCustomAmenity(listingId: string, name: string) {
  return adminFetch<{ success: boolean; data: { slug: string; name: string; category: string } }>(
    `/listings/${listingId}/amenities`,
    { method: 'POST', body: JSON.stringify({ name }) }
  )
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

export interface AdminBookingDetail extends AdminBooking {
  nights:                   number
  guests:                   number
  agreedToHouseRules:       boolean
  guestVerifiedAtBooking:   boolean
  hostId:                   string
  baseSubtotal:        number
  discountAmount:      number
  cleaningFee:         number
  platformServiceFee:  number
  taxes:               number
  hostPayout:          number
  paymentProvider:     string
  paymentOrderId:      string
  paymentId:           string | null
  payoutId:            string | null
  payoutStatus:        string
  refundAmount:        number | null
  refundStatus:        string | null
  cancellationReason:  string | null
  cancelledBy:         string | null
  hostCancellationPenalty: number | null
  updatedAt:           string
  guest: {
    id: string; clerkId: string; firstName: string; lastName: string
    email: string; profileImageUrl: string | null; verificationStatus: string
  }
  listing: { id: string; title: string; address: Record<string, string>; basePrice: number; currency: string }
  hostProfile: {
    id: string; isSuperhost: boolean
    user: { id: string; firstName: string; lastName: string; email: string; profileImageUrl: string | null }
  } | null
  review: {
    id: string; rating: number; comment: string | null
    cleanliness: number | null; accuracy: number | null; location: number | null
    checkIn: number | null; value: number | null; createdAt: string
  } | null
  hostEarning: {
    id: string; amount: number; currency: string
    payoutStatus: string; payoutId: string | null; payoutDate: string | null
  } | null
  paymentEvents: {
    id: string; provider: string; eventType: string; status: string; createdAt: string
  }[]
}

export function getBookings(page = 1, status?: string, from?: string, to?: string) {
  const qs = new URLSearchParams({ page: String(page) })
  if (status) qs.set('status', status)
  if (from)   qs.set('from', from)
  if (to)     qs.set('to', to)
  return adminFetch<{ bookings: AdminBooking[]; total: number; page: number; limit: number }>(`/bookings?${qs}`)
}

export async function getBookingDetail(id: string) {
  const res = await adminFetch<{ success: boolean; data: AdminBookingDetail }>(`/bookings/${id}`)
  return res.data
}

export function cancelBooking(id: string, reason?: string, refundAmount?: number) {
  return adminFetch<{ success: boolean }>(`/bookings/${id}/cancel`, {
    method: 'PATCH',
    body:   JSON.stringify({ reason, refundAmount }),
  })
}

export function overrideBookingRefund(id: string, refundAmount: number, refundStatus: string) {
  return adminFetch<{ success: boolean }>(`/bookings/${id}/refund`, {
    method: 'PATCH',
    body:   JSON.stringify({ refundAmount, refundStatus }),
  })
}

export function overrideBookingPayout(id: string, payoutStatus: string) {
  return adminFetch<{ success: boolean }>(`/bookings/${id}/payout`, {
    method: 'PATCH',
    body:   JSON.stringify({ payoutStatus }),
  })
}

export function overrideBookingStatus(id: string, status: string, reason?: string) {
  return adminFetch<{ success: boolean }>(`/bookings/${id}/status`, {
    method: 'PATCH',
    body:   JSON.stringify({ status, reason }),
  })
}

export function setBookingDispute(id: string, disputed: boolean, reason?: string) {
  return adminFetch<{ success: boolean }>(`/bookings/${id}/dispute`, {
    method: 'PATCH',
    body:   JSON.stringify({ disputed, reason }),
  })
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
  deletedAt:          string | null
  createdAt:          string
}

export interface AdminUserDetail extends AdminUser {
  profileImageUrl: string | null
  bannedReason:    string | null
  updatedAt:       string
  hostProfile: {
    id:                   string
    bio:                  string | null
    isSuperhost:          boolean
    superhostGrantedAt:   string | null
    responseRate:         number
    avgResponseTimeHours: number
    totalListings:        number
    hostCancellationCount: number
    createdAt:            string
  } | null
  hostApplications: {
    id:             string
    status:         string
    submittedAt:    string | null
    rejectionReason: string | null
    createdAt:      string
  }[]
}

export interface UserDetailResponse {
  user: AdminUserDetail
  stats: {
    guestBookings: { count: number; totalSpent: number }
    reviews:       { count: number; avgRating: string }
    host:          { totalListings: number; activeListings: number } | null
  }
  recentBookings: {
    id:          string
    status:      string
    checkIn:     string
    checkOut:    string
    nights:      number
    totalAmount: number
    currency:    string
    createdAt:   string
    listing:     { id: string; title: string }
  }[]
  recentListings: {
    id:         string
    title:      string
    status:     string
    basePrice:  number
    currency:   string
    avgRating:  number
  }[]
}

export function getUsers(page = 1, role?: string) {
  const qs = new URLSearchParams({ page: String(page) })
  if (role) qs.set('role', role)
  return adminFetch<{ users: AdminUser[]; total: number; page: number; limit: number }>(`/users?${qs}`)
}

export async function getUserDetail(id: string) {
  const res = await adminFetch<{ success: boolean; data: UserDetailResponse }>(`/users/${id}`)
  return res.data
}

export function banUser(id: string, reason?: string) {
  return adminFetch<{ success: boolean }>(`/users/${id}/ban`, { method: 'PATCH', body: JSON.stringify({ reason }) })
}

export function unbanUser(id: string) {
  return adminFetch<{ success: boolean }>(`/users/${id}/unban`, { method: 'PATCH', body: JSON.stringify({}) })
}

export function setUserVerification(id: string, verified: boolean) {
  return adminFetch<{ success: boolean }>(`/users/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ verified }) })
}

export function changeUserRole(id: string, role: string) {
  return adminFetch<{ success: boolean }>(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) })
}

export function toggleSuperhost(id: string, grant: boolean) {
  return adminFetch<{ success: boolean }>(`/users/${id}/superhost`, { method: 'PATCH', body: JSON.stringify({ grant }) })
}

export function deleteUser(id: string) {
  return adminFetch<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' })
}

// ─── Host applications ────────────────────────────────────────────────────────
export interface AdminHostApplication {
  id:          string
  status:      string
  submittedAt: string | null
  user: { id: string; firstName: string; lastName: string; email: string }
}

export interface AdminHostApplicationDetail {
  id:              string
  status:          string
  submittedAt:     string | null
  reviewedAt:      string | null
  reviewedBy:      string | null
  rejectionReason: string | null
  createdAt:       string
  sessionData: {
    // Space
    propertyType?: string
    roomType?:     string
    maxGuests?:    number
    bedrooms?:     number
    beds?:         number
    baths?:        number
    address?:      Record<string, string>
    // Amenities
    amenities?: string[]
    // Photos
    photos?: Array<{ publicId: string; url: string; isPrimary: boolean }>
    // Details
    title?:       string
    description?: string
    // Pricing
    basePrice?:          number
    currency?:           string
    cleaningFee?:        number
    cancellationPolicy?: string
    // Availability
    instantBook?:  boolean
    checkInTime?:  string
    checkOutTime?: string
    minNights?:    number
    maxNights?:    number
  }
  user: {
    id:              string
    clerkId:         string
    firstName:       string
    lastName:        string
    email:           string
    profileImageUrl: string | null
    createdAt:       string
  }
}

export function getHostApplications(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  return adminFetch<{ applications: AdminHostApplication[] }>(`/host-applications${qs}`)
}

export async function getHostApplication(sessionId: string) {
  const res = await adminFetch<{ success: boolean; data: AdminHostApplicationDetail }>(
    `/host-applications/${sessionId}`
  )
  return res.data
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

// ─── Audit logs ───────────────────────────────────────────────────────────────
export interface AuditLog {
  id:         string
  action:     string
  entityType: string
  entityId:   string
  before:     Record<string, unknown> | null
  after:      Record<string, unknown> | null
  ip:         string | null
  userAgent:  string | null
  createdAt:  string
  actor: {
    id:        string
    clerkId:   string
    firstName: string
    lastName:  string
    email:     string
  }
}

export function getAuditLogs(opts: {
  page?:       number
  entityType?: string
  action?:     string
  actorId?:    string
}) {
  const qs = new URLSearchParams({ page: String(opts.page ?? 1) })
  if (opts.entityType) qs.set('entityType', opts.entityType)
  if (opts.action)     qs.set('action', opts.action)
  if (opts.actorId)    qs.set('actorId', opts.actorId)
  return adminFetch<{ logs: AuditLog[]; total: number; page: number; limit: number }>(`/audit-logs?${qs}`)
}
