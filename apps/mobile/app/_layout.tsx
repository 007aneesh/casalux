import '../global.css'

import { ClerkProvider, useAuth } from '@clerk/expo'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as SecureStore from 'expo-secure-store'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'

import { useAppFonts } from '../src/theme/typography'
import { colors } from '../src/theme/tokens'

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key)
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value)
  },
}

const CLERK_PUBLISHABLE_KEY =
  process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] ?? ''

// QueryClient is module-level so it's created once
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AuthGate(): JSX.Element {
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

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    )
  }

  return <Slot />
}

export default function RootLayout(): JSX.Element {
  // Load fonts in the background — screens render immediately with system fallbacks
  useAppFonts()

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider
          publishableKey={CLERK_PUBLISHABLE_KEY}
          tokenCache={tokenCache}
        >
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <StatusBar style="dark" />
              <AuthGate />
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
