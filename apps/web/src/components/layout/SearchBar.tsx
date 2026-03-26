'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, CalendarDays, Users, X, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocationAutocomplete } from '@/lib/hooks/useLocationAutocomplete'
import { useSearchStore } from '@/lib/store/search'
import { buildQueryString } from '@/lib/utils'

interface SearchBarProps {
  compact?: boolean
}

export function SearchBar({ compact = false }: SearchBarProps) {
  const router = useRouter()
  const { setParams } = useSearchStore()
  const [open, setOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<'location' | 'dates' | 'guests' | null>(null)
  const [selectedLocation, setSelectedLocation] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const { query, setQuery, suggestions, isLoading } = useLocationAutocomplete()

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActivePanel(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = () => {
    const params: Record<string, unknown> = {}
    if (selectedLocation) params.location = selectedLocation
    if (checkIn) params.checkIn = checkIn
    if (checkOut) params.checkOut = checkOut
    if (guests > 1) params.guests = guests
    setParams(params)
    setOpen(false)
    setActivePanel(null)
    router.push(`/search${buildQueryString(params)}`)
  }

  if (compact) {
    return (
      <div ref={containerRef} className="relative">
        <button
          onClick={() => { setOpen(true); setActivePanel('location') }}
          className={cn(
            'flex items-center gap-3 w-full rounded-2xl border border-border bg-card px-4 py-2.5',
            'shadow-card hover:shadow-card-hover transition-shadow duration-200',
            'text-left text-sm'
          )}
        >
          <Search className="h-4 w-4 text-muted shrink-0" />
          <span className="flex-1 truncate">
            {selectedLocation || <span className="text-muted">Where to?</span>}
          </span>
          {(checkIn || checkOut) && (
            <span className="text-muted shrink-0">{checkIn} – {checkOut}</span>
          )}
          {guests > 1 && (
            <span className="text-muted shrink-0">{guests} guests</span>
          )}
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl border border-border shadow-search-hover z-50 overflow-hidden">
            <LocationPanel
              query={query}
              setQuery={setQuery}
              suggestions={suggestions}
              isLoading={isLoading}
              onSelect={(loc) => {
                setSelectedLocation(loc)
                setQuery(loc)
                setActivePanel('dates')
              }}
            />
            <div className="border-t border-border p-4 flex items-center justify-end">
              <button
                onClick={handleSearch}
                className="flex items-center gap-2 bg-navy text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-navy-800 transition-colors"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Full expanded search bar (hero)
  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto">
      <div className={cn(
        'flex flex-col sm:flex-row items-stretch rounded-2xl border border-border bg-card shadow-search',
        'hover:shadow-search-hover transition-shadow duration-300',
        open && 'shadow-search-hover'
      )}>
        {/* Location */}
        <button
          onClick={() => { setOpen(true); setActivePanel('location') }}
          className={cn(
            'flex-1 flex flex-col items-start px-5 py-3.5 rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none text-left transition-colors',
            activePanel === 'location' ? 'bg-surface' : 'hover:bg-surface/50'
          )}
        >
          <span className="text-xs font-semibold text-foreground mb-0.5">Where</span>
          <span className="text-sm text-muted truncate w-full">
            {selectedLocation || 'Search destinations'}
          </span>
        </button>

        <div className="h-px sm:h-auto sm:w-px bg-border w-full sm:self-stretch sm:my-3" />

        {/* Check-in */}
        <button
          onClick={() => { setOpen(true); setActivePanel('dates') }}
          className={cn(
            'flex flex-col items-start px-5 py-3.5 transition-colors',
            activePanel === 'dates' ? 'bg-surface' : 'hover:bg-surface/50'
          )}
        >
          <span className="text-xs font-semibold text-foreground mb-0.5">Check in</span>
          <span className="text-sm text-muted whitespace-nowrap">{checkIn || 'Add dates'}</span>
        </button>

        <div className="h-px sm:h-auto sm:w-px bg-border w-full sm:self-stretch sm:my-3" />

        {/* Check-out */}
        <button
          onClick={() => { setOpen(true); setActivePanel('dates') }}
          className={cn(
            'flex flex-col items-start px-5 py-3.5 transition-colors',
            activePanel === 'dates' ? 'bg-surface' : 'hover:bg-surface/50'
          )}
        >
          <span className="text-xs font-semibold text-foreground mb-0.5">Check out</span>
          <span className="text-sm text-muted whitespace-nowrap">{checkOut || 'Add dates'}</span>
        </button>

        <div className="h-px sm:h-auto sm:w-px bg-border w-full sm:self-stretch sm:my-3" />

        {/* Guests + Search */}
        <div className="flex items-center gap-2 px-3 py-3 sm:py-2">
          <button
            onClick={() => { setOpen(true); setActivePanel('guests') }}
            className={cn(
              'flex-1 sm:flex-none flex flex-col items-start px-3 py-1.5 rounded-xl transition-colors',
              activePanel === 'guests' ? 'bg-surface' : 'hover:bg-surface/50'
            )}
          >
            <span className="text-xs font-semibold text-foreground mb-0.5">Who</span>
            <span className="text-sm text-muted whitespace-nowrap">
              {guests > 1 ? `${guests} guests` : 'Add guests'}
            </span>
          </button>

          <button
            onClick={handleSearch}
            className="flex items-center gap-2 bg-navy text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-navy-800 transition-colors shadow-sm"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Dropdown panels */}
      {open && activePanel === 'location' && (
        <div className="mt-2 bg-card rounded-2xl border border-border shadow-search-hover z-50 overflow-hidden">
          <LocationPanel
            query={query}
            setQuery={setQuery}
            suggestions={suggestions}
            isLoading={isLoading}
            onSelect={(loc) => {
              setSelectedLocation(loc)
              setQuery(loc)
              setActivePanel('dates')
            }}
          />
        </div>
      )}

      {open && activePanel === 'guests' && (
        <div className="mt-2 bg-card rounded-2xl border border-border shadow-search-hover p-6 z-50">
          <GuestsPanel guests={guests} setGuests={setGuests} />
        </div>
      )}
    </div>
  )
}

function LocationPanel({
  query, setQuery, suggestions, isLoading, onSelect
}: {
  query: string
  setQuery: (q: string) => void
  suggestions: Array<{ id: string; label: string; sublabel?: string; type: string }>
  isLoading: boolean
  onSelect: (loc: string) => void
}) {
  return (
    <div className="p-4">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search destinations"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold placeholder:text-muted"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted" />
          </button>
        )}
      </div>
      <div className="space-y-0.5 max-h-64 overflow-y-auto">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.label)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-surface text-left transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface">
              {s.type === 'recent' ? (
                <Clock className="h-3.5 w-3.5 text-muted" />
              ) : s.type === 'popular' ? (
                <TrendingUp className="h-3.5 w-3.5 text-muted" />
              ) : (
                <MapPin className="h-3.5 w-3.5 text-muted" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{s.label}</p>
              {s.sublabel && <p className="text-xs text-muted">{s.sublabel}</p>}
            </div>
          </button>
        ))}
        {!isLoading && suggestions.length === 0 && query && (
          <p className="text-sm text-muted text-center py-4">No results found</p>
        )}
      </div>
    </div>
  )
}

function GuestsPanel({
  guests, setGuests
}: { guests: number; setGuests: (n: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Guests</p>
          <p className="text-xs text-muted">How many guests?</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGuests(Math.max(1, guests - 1))}
            className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-lg font-medium hover:border-foreground transition-colors disabled:opacity-30"
            disabled={guests <= 1}
          >−</button>
          <span className="w-6 text-center text-sm font-semibold">{guests}</span>
          <button
            onClick={() => setGuests(Math.min(16, guests + 1))}
            className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-lg font-medium hover:border-foreground transition-colors"
          >+</button>
        </div>
      </div>
    </div>
  )
}
