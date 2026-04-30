import { useAuth } from '@clerk/expo'
import { useCallback } from 'react'

export function useAuthToken(): () => Promise<string | null> {
  const { getToken } = useAuth()
  return useCallback(async () => {
    try {
      return await getToken()
    } catch {
      return null
    }
  }, [getToken])
}
