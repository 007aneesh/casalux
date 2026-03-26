'use client'
import { useState, useEffect, useRef } from 'react'
import { apiRequest } from '../api-client'

export interface LocationSuggestion {
  id: string
  label: string
  sublabel?: string
  lat?: number
  lng?: number
  type: 'recent' | 'popular' | 'places_api'
}

export function useLocationAutocomplete() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      // Fetch recent + popular with empty query
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true)
        try {
          const res = await apiRequest<LocationSuggestion[]>(`/locations/autocomplete?q=`)
          setSuggestions(res.data ?? [])
        } finally {
          setIsLoading(false)
        }
      }, 0)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await apiRequest<LocationSuggestion[]>(
          `/locations/autocomplete?q=${encodeURIComponent(query)}`
        )
        setSuggestions(res.data ?? [])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  return { query, setQuery, suggestions, isLoading }
}
