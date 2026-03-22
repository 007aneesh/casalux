/**
 * Date utilities — pure functions, no dependencies.
 */

export function nightsBetween(checkIn: string, checkOut: string): number {
  const inDate = new Date(checkIn)
  const outDate = new Date(checkOut)
  return Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDate(date: string | Date, locale = 'en-IN'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function isDateInRange(date: string, checkIn: string, checkOut: string): boolean {
  const d = new Date(date).getTime()
  return d >= new Date(checkIn).getTime() && d < new Date(checkOut).getTime()
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}
