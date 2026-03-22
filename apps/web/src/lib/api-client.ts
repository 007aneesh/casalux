/**
 * Typed API client for the CasaLux backend.
 * Used by Next.js Server Components (server-side) and SWR hooks (client-side).
 */
import type { ApiResponse } from '@casalux/types'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  return res.json() as Promise<ApiResponse<T>>
}
