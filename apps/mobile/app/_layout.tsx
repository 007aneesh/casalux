import { ClerkProvider, useAuth } from '@clerk/expo'
import * as SecureStore from 'expo-secure-store'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'

interface TokenCache {
  getToken(key: string): Promise<string | null | undefined>
  saveToken(key: string, token: string): Promise<void>
  clearToken?: (key: string) => void | Promise<void>
}

const tokenCache: TokenCache = {
  async getToken(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key)
  },
  async saveToken(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value)
  },
}

const CLERK_PUBLISHABLE_KEY = process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] ?? ''

function AuthGuard(): JSX.Element {
  const { isSignedIn, isLoaded } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in')
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [isSignedIn, isLoaded, segments, router])

  return <Slot />
}

export default function RootLayout(): JSX.Element {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <AuthGuard />
    </ClerkProvider>
  )
}
