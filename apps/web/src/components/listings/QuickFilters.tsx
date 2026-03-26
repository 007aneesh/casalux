'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Waves, Sparkles, Trees, Flame, Zap, Star, PawPrint, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearchStore } from '@/lib/store/search'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  beachfront: Waves,
  amazing_pools: Sparkles,
  cabins: Trees,
  trending: Flame,
  instant_book: Zap,
  luxe: Star,
  pet_friendly: PawPrint,
  new: Home,
}

const DEFAULT_FILTERS = [
  { slug: 'trending',     label: 'Trending' },
  { slug: 'beachfront',   label: 'Beachfront' },
  { slug: 'amazing_pools',label: 'Amazing Pools' },
  { slug: 'luxe',         label: 'Luxe' },
  { slug: 'cabins',       label: 'Cabins' },
  { slug: 'instant_book', label: 'Instant Book' },
  { slug: 'pet_friendly', label: 'Pet Friendly' },
  { slug: 'new',          label: 'New' },
]

interface QuickFiltersProps {
  onFilterChange?: (slug: string | null) => void
}

export function QuickFilters({ onFilterChange }: QuickFiltersProps) {
  const { activeQuickFilter, setActiveQuickFilter } = useSearchStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' })
  }

  const handleSelect = (slug: string) => {
    const next = activeQuickFilter === slug ? null : slug
    setActiveQuickFilter(next)
    onFilterChange?.(next)
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Left scroll */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-card border border-border shadow-card hover:shadow-card-hover transition-shadow"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
      )}

      {/* Scrollable chips */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {DEFAULT_FILTERS.map(({ slug, label }) => {
          const Icon = ICON_MAP[slug]
          const isActive = activeQuickFilter === slug
          return (
            <button
              key={slug}
              onClick={() => handleSelect(slug)}
              className={cn(
                'flex items-center gap-2 shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200',
                'hover:border-foreground hover:text-foreground',
                isActive
                  ? 'border-navy bg-navy text-white shadow-sm'
                  : 'border-border bg-card text-muted'
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {label}
            </button>
          )
        })}
      </div>

      {/* Right scroll */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-card border border-border shadow-card hover:shadow-card-hover transition-shadow"
        >
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
      )}
    </div>
  )
}
