'use client'

import { useState } from 'react'
import { useHostListings, useHostCalendar } from '@/lib/hooks/useHost'
import { apiRequest } from '@/lib/api-client'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function toDateStr(date: Date) {
  return date.toISOString().slice(0, 10)
}

export default function HostCalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedListing, setSelectedListing] = useState<string | null>(null)
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const { listings, isLoading: listingsLoading } = useHostListings()
  const { calendar, isLoading: calLoading, mutate } = useHostCalendar(selectedListing, year, month)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function toggleDate(dateStr: string) {
    setSelectedDates(prev => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr)
      else next.add(dateStr)
      return next
    })
  }

  async function saveBlockedDates() {
    if (!selectedListing || selectedDates.size === 0) return
    setSaving(true)
    try {
      await apiRequest(`/host/listings/${selectedListing}/blocked-dates`, {
        method: 'POST',
        body: JSON.stringify({ dates: Array.from(selectedDates) }),
      })
      setSaveMessage('Dates saved!')
      setSelectedDates(new Set())
      mutate()
    } catch {
      setSaveMessage('Failed to save. Try again.')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const blockedSet = new Set<string>(calendar?.blockedDates ?? [])
  const bookedDates = new Set<string>()

  for (const booking of calendar?.bookings ?? []) {
    const start = new Date(booking.checkIn)
    const end = new Date(booking.checkOut)
    const curr = new Date(start)
    while (curr <= end) {
      bookedDates.add(toDateStr(curr))
      curr.setDate(curr.getDate() + 1)
    }
  }

  return (
    <div className="px-4 md:px-8 py-6">
      <h1 className="font-display text-2xl font-bold text-navy mb-6">Availability Calendar</h1>

      {/* Listing selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-navy mb-2">Select listing</label>
        {listingsLoading ? (
          <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
        ) : (
          <select
            value={selectedListing ?? ''}
            onChange={e => setSelectedListing(e.target.value || null)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition bg-white"
          >
            <option value="">Choose a listing…</option>
            {listings.map((l: any) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        )}
      </div>

      {selectedListing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {/* Month navigator */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <ChevronLeft size={18} className="text-navy" />
            </button>
            <h2 className="font-display font-semibold text-navy">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <ChevronRight size={18} className="text-navy" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" />Blocked</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />Booked</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gold/20 border border-gold/40" />Selected</span>
          </div>

          {/* Calendar grid */}
          <div className="p-4">
            {calLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Day labels */}
                <div className="grid grid-cols-7 mb-2">
                  {DAYS.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-muted py-1">{d}</div>
                  ))}
                </div>

                {/* Date cells */}
                <div className="grid grid-cols-7 gap-1">
                  {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} />)}
                  {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const isPast = new Date(dateStr) < new Date(toDateStr(today))
                    const isBooked = bookedDates.has(dateStr)
                    const isBlocked = blockedSet.has(dateStr)
                    const isSelected = selectedDates.has(dateStr)
                    const isToday = dateStr === toDateStr(today)

                    let bg = 'hover:bg-gray-100'
                    if (isBooked) bg = 'bg-blue-100 cursor-not-allowed'
                    else if (isBlocked) bg = 'bg-red-100 cursor-pointer'
                    else if (isSelected) bg = 'bg-gold/25 ring-1 ring-gold/50'
                    else if (isPast) bg = 'opacity-30 cursor-not-allowed'

                    return (
                      <button
                        key={day}
                        disabled={isPast || isBooked}
                        onClick={() => toggleDate(dateStr)}
                        className={`aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${bg} ${isToday ? 'ring-2 ring-navy' : ''}`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Save bar */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
            <div className="text-sm text-muted">
              {selectedDates.size > 0
                ? `${selectedDates.size} date${selectedDates.size !== 1 ? 's' : ''} selected to block`
                : 'Click dates to block availability'}
            </div>
            <div className="flex items-center gap-3">
              {saveMessage && <span className="text-sm text-emerald-600">{saveMessage}</span>}
              <button
                onClick={saveBlockedDates}
                disabled={selectedDates.size === 0 || saving}
                className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-navy/90 transition flex items-center gap-1.5"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
