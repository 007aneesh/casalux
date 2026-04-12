import { SearchInteractive } from './_client'
import { apiRequest } from '@/lib/api-client'
import { buildQueryString } from '@/lib/utils'
import type { Listing, ListingSearchParams } from '@casalux/types'

type SP = { [k: string]: string | string[] | undefined }

/** Parse Next.js searchParams into typed ListingSearchParams */
function parseSearchParams(sp: SP): ListingSearchParams {
  const s = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined)
  const n = (k: string) => { const v = s(k); return v ? Number(v) : undefined }
  const b = (k: string) => (s(k) === 'true' ? (true as const) : undefined)

  return {
    location: s('location'),
    checkIn: s('checkIn'),
    checkOut: s('checkOut'),
    guests: n('guests'),
    propertyType: s('type') ? [s('type') as never] : undefined,
    instantBook: b('instantBook'),
    minPrice: n('minPrice'),
    maxPrice: n('maxPrice'),
    minRating: n('minRating'),
    quickFilter: s('quickFilter'),
  }
}

/** Server-side fetch of first page — result becomes the initial SSR HTML */
async function fetchInitialListings(params: ListingSearchParams): Promise<{
  listings: Listing[]
  total: number
}> {
  try {
    const qs = buildQueryString({ ...params, page: 1, limit: 20 })
    const res = await apiRequest<Listing[]>(`/listings${qs}`, {
      next: { revalidate: 30 },
    })
    return {
      listings: res.success ? (res.data ?? []) : [],
      total: res.meta?.total ?? 0,
    }
  } catch {
    return { listings: [], total: 0 }
  }
}

export const metadata = {
  title: 'Search',
  description: 'Browse and filter curated luxury stays — villas, cabins, beachfront retreats, and more.',
}

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const params = parseSearchParams(searchParams)
  const { listings, total } = await fetchInitialListings(params)

  return (
    <SearchInteractive
      initialListings={listings}
      initialTotal={total}
      defaultParams={params}
    />
  )
}
