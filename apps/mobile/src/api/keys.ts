import type { ListingSearchParams } from '@casalux/types'

export const queryKeys = {
  listings: {
    all: ['listings'] as const,
    list: (params: ListingSearchParams) => ['listings', 'list', params] as const,
    quickFilters: () => ['listings', 'quick-filters'] as const,
    detail: (id: string) => ['listings', 'detail', id] as const,
    availability: (id: string) => ['listings', id, 'availability'] as const,
    pricing: (id: string, params: Record<string, unknown>) =>
      ['listings', id, 'pricing', params] as const,
    reviews: (id: string) => ['listings', id, 'reviews'] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    mine: () => ['bookings', 'mine'] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
    status: (id: string) => ['bookings', id, 'status'] as const,
  },
  wishlists: {
    all: ['wishlists'] as const,
    list: () => ['wishlists', 'list'] as const,
  },
  messages: {
    all: ['messages'] as const,
    threads: () => ['messages', 'threads'] as const,
    thread: (id: string) => ['messages', 'threads', id] as const,
  },
  user: {
    me: () => ['user', 'me'] as const,
  },
} as const
