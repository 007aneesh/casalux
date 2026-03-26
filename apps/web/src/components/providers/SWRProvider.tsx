'use client'

import { SWRConfig } from 'swr'
import { apiRequest } from '@/lib/api-client'

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (path: string) => apiRequest(path),
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        dedupingInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
