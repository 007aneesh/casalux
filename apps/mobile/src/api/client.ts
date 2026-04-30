import type { ApiResponse, ApiErrorResponse } from '@casalux/types'

const API_BASE_URL =
  process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export class ApiError extends Error {
  code: string
  status: number
  details?: unknown

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export type TokenGetter = () => Promise<string | null>

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  getToken?: TokenGetter
  signal?: AbortSignal
}

function buildQuery(query?: ApiFetchOptions['query']): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    params.append(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, query, getToken, headers, ...rest } = options

  const url = `${API_BASE_URL}${path}${buildQuery(query)}`
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  }

  if (getToken) {
    const token = await getToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let payload: ApiResponse<T> | ApiErrorResponse | null = null
  try {
    payload = (await response.json()) as ApiResponse<T> | ApiErrorResponse
  } catch {
    throw new ApiError(
      `Invalid JSON response (${response.status})`,
      'INVALID_RESPONSE',
      response.status,
    )
  }

  if (!response.ok || !payload || payload.success === false) {
    const err = payload && payload.success === false ? payload.error : null
    throw new ApiError(
      err?.message ?? `Request failed (${response.status})`,
      err?.code ?? 'UNKNOWN_ERROR',
      response.status,
      err?.details,
    )
  }

  return payload.data
}
