import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format price from cents to locale string.
 * e.g. formatPrice(150000, 'INR') → '₹1,500'
 */
export function formatPrice(cents: number, currency = 'INR'): string {
  const amount = cents / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a date string to a readable short format.
 * e.g. '2024-12-25' → 'Dec 25'
 */
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Get initials from a name for avatar fallback.
 */
export function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
}

/**
 * Pluralize a word based on count.
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trim()}…`
}

/**
 * Build a query string from an object, skipping null/undefined values.
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, String(v)))
    } else {
      qs.set(key, String(value))
    }
  }
  const str = qs.toString()
  return str ? `?${str}` : ''
}
