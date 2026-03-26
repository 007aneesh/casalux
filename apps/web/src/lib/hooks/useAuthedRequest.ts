'use client'
import { useAuth } from '@clerk/nextjs'
import { apiRequest } from '../api-client'
import type { ApiResponse } from '@casalux/types'

/**
 * Returns an apiRequest wrapper that automatically attaches
 * the Clerk JWT as a Bearer token on every call.
 */
export function useAuthedRequest() {
  const { getToken } = useAuth()

  return async function authedRequest<T>(
    path: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const token = await getToken()
    return apiRequest<T>(path, {
      ...options,
      headers: {
        ...options?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  }
}
