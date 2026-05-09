/**
 * Typed API client for the CasaLux backend.
 * Used by Next.js Server Components (server-side) and SWR hooks (client-side).
 */
import type { ApiResponse } from '@casalux/types'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}/api/v1${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  // Edge/CDN errors (504, 502, etc.) usually return HTML — never blindly call
  // res.json() on them or we'll surface a confusing SyntaxError instead of the
  // real status. Read as text first, then try to parse as JSON.
  const raw = await res.text()
  const contentType = res.headers.get('content-type') ?? ''
  let body: unknown = null
  if (raw && contentType.includes('application/json')) {
    try {
      body = JSON.parse(raw)
    } catch {
      throw new ApiError(res.status, 'BAD_JSON', `Invalid JSON from ${url}: ${raw.slice(0, 120)}`)
    }
  }

  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error
    throw new ApiError(
      res.status,
      err?.code ?? `HTTP_${res.status}`,
      err?.message ?? `Request failed (${res.status}) at ${path}`,
      err?.details ?? (raw && !body ? raw.slice(0, 200) : undefined),
    )
  }

  if (!body) {
    throw new ApiError(res.status, 'EMPTY_RESPONSE', `Empty response from ${url}`)
  }

  return body as ApiResponse<T>
}
