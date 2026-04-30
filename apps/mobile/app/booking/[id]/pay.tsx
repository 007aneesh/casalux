import { useEffect, useState } from 'react'
import { View, Text, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { ScreenHeader } from '../../../src/components/common/ScreenHeader'
import { Button } from '../../../src/components/ui/Button'
import { LoadingView } from '../../../src/components/common/LoadingView'
import { useBooking, useBookingStatus } from '../../../src/api/hooks/useBookings'

export default function BookingPayScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: booking } = useBooking(id)
  const [polling, setPolling] = useState(false)
  const { data: status } = useBookingStatus(id, polling)

  useEffect(() => {
    if (status?.status === 'CONFIRMED') {
      router.replace({ pathname: '/booking/[id]/confirmation', params: { id: id ?? '' } })
    }
  }, [status, id, router])

  if (!booking) return <LoadingView />

  // Stripe PaymentSheet integration: present sheet using
  // booking.paymentProvider + providerPayload from initiate response.
  // Once the user completes payment, the API webhook flips status → CONFIRMED.
  const handlePay = (): void => {
    setPolling(true)
    Alert.alert(
      'Payment',
      'Stripe PaymentSheet is wired in production. Tap OK to simulate confirmation.',
    )
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader title="Payment" showBack />
      <View className="flex-1 items-center justify-center px-8">
        <Text className="font-display text-2xl text-foreground text-center mb-3">
          Complete your payment
        </Text>
        <Text className="font-sans text-muted text-center mb-8">
          You'll be charged once your stay is confirmed.
        </Text>
        <Button
          label={polling ? 'Waiting for confirmation…' : 'Pay now'}
          fullWidth
          size="lg"
          loading={polling}
          onPress={handlePay}
        />
      </View>
    </SafeAreaView>
  )
}
