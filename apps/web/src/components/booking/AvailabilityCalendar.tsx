'use client'

import { useState, useEffect } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format, parseISO, isAfter, isBefore, startOfToday } from 'date-fns'
import { useAvailability } from '@/lib/hooks/useListings'
import { cn } from '@/lib/utils'

interface AvailabilityCalendarProps {
  listingId: string
  minNights?: number
  onRangeChange?: (checkIn: string | null, checkOut: string | null) => void
  inline?: boolean
}

export function AvailabilityCalendar({
  listingId,
  minNights = 1,
  onRangeChange,
  inline = false,
}: AvailabilityCalendarProps) {
  const now = new Date()
  const [displayMonth, setDisplayMonth] = useState(now)
  const { availability, isLoading } = useAvailability(
    listingId,
    displayMonth.getFullYear(),
    displayMonth.getMonth() + 1
  )
  const [range, setRange] = useState<DateRange | undefined>()
  const today = startOfToday()

  // Parse blocked dates from API
  const blockedDates: Date[] = (availability?.blockedDates ?? []).map((d) => parseISO(d))

  // Disable: past dates, blocked dates
  const isDisabled = (date: Date) =>
    isBefore(date, today) || blockedDates.some((b) => format(b, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))

  useEffect(() => {
    const checkIn = range?.from ? format(range.from, 'yyyy-MM-dd') : null
    const checkOut = range?.to ? format(range.to, 'yyyy-MM-dd') : null
    onRangeChange?.(checkIn, checkOut)
  }, [range, onRangeChange])

  return (
    <div className={cn(inline ? '' : 'rounded-2xl border border-border p-4 bg-card')}>
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      ) : (
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          onMonthChange={setDisplayMonth}
          disabled={isDisabled}
          numberOfMonths={inline ? 1 : 2}
          fromDate={today}
          modifiersClassNames={{
            selected: 'rdp-selected',
            range_start: 'rdp-range_start',
            range_end: 'rdp-range_end',
            range_middle: 'rdp-range_middle',
            disabled: 'rdp-disabled',
          }}
          classNames={{
            months: 'flex flex-col sm:flex-row gap-6',
            month: 'space-y-3',
            caption: 'flex justify-center relative items-center',
            caption_label: 'text-sm font-semibold text-foreground',
            nav: 'flex items-center gap-1',
            nav_button: 'h-7 w-7 rounded-lg flex items-center justify-center hover:bg-surface transition-colors text-muted',
            table: 'w-full border-collapse',
            head_row: 'flex',
            head_cell: 'text-muted text-[0.8rem] font-medium w-9 text-center',
            row: 'flex w-full mt-1',
            cell: 'h-9 w-9 text-center text-sm relative',
            day: 'h-9 w-9 p-0 font-normal rounded-lg hover:bg-surface text-foreground transition-colors',
            day_selected: '!bg-navy !text-white hover:!bg-navy-800',
            day_range_start: '!bg-navy !text-white rounded-r-none',
            day_range_end: '!bg-navy !text-white rounded-l-none',
            day_range_middle: '!bg-surface !text-foreground !rounded-none',
            day_today: 'font-bold text-gold',
            day_disabled: 'text-muted opacity-40 cursor-not-allowed hover:bg-transparent',
            day_outside: 'opacity-30',
          }}
        />
      )}

      {range?.from && !range?.to && (
        <p className="text-xs text-muted text-center mt-3">
          Minimum {minNights} night{minNights > 1 ? 's' : ''} — select your check-out date
        </p>
      )}
    </div>
  )
}
