import { create } from 'zustand'
import type { ListingSearchParams } from '@casalux/types'

interface SearchState {
  params: ListingSearchParams
  setParams: (p: Partial<ListingSearchParams>) => void
  resetParams: () => void
  activeQuickFilter: string | null
  setActiveQuickFilter: (slug: string | null) => void
}

const defaults: ListingSearchParams = {
  page: 1,
  limit: 20,
}

export const useSearchStore = create<SearchState>((set) => ({
  params: defaults,
  setParams: (p) => set((s) => ({ params: { ...s.params, ...p, page: 1 } })),
  resetParams: () => set({ params: defaults }),
  activeQuickFilter: null,
  setActiveQuickFilter: (slug) =>
    set((s) => ({
      activeQuickFilter: slug,
      params: { ...defaults, quickFilter: slug ?? undefined },
    })),
}))
