import { useState } from 'react'
import { ScrollView, View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { addDays, format } from 'date-fns'

import { ScreenHeader } from '../../../src/components/common/ScreenHeader'
import { Button } from '../../../src/components/ui/Button'
import { PriceBreakdown } from '../../../src/components/booking/PriceBreakdown'
import { LoadingView } from '../../../src/components/common/LoadingView'
import { useListing, usePricingPreview } from '../../../src/api/hooks/useListings'
import { useInitiateBooking } from '../../../src/api/hooks/useBookings'

export default function BookingReviewScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const today = new Date()
  const [checkIn] = useState(format(addDays(today, 7), 'yyyy-MM-dd'))
  const [checkOut] = useState(format(addDays(today, 10), 'yyyy-MM-dd'))
  const [guests, setGuests] = useState(2)
  const [agreedToHouseRules, setAgreed] = useState(false)

  const { data: listing } = useListing(id)
  const { data: pricing } = usePricingPreview(id, {
    checkIn,
    checkOut,
    guests,
  })
  const initiate = useInitiateBooking()

  if (!listing) return <LoadingView />

  const handleConfirm = async (): Promise<void> => {
    if (!agreedToHouseRules) return
    const result = await initiate.mutateAsync({
      listingId: listing.id,
      checkIn,
      checkOut,
      guests,
      agreedToHouseRules: true,
    })
    router.push({ pathname: '/booking/[id]/pay', params: { id: result.bookingId } })
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader title="Confirm and pay" showBack />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text className="font-display text-2xl text-foreground mb-4">
          Your trip
        </Text>

        <Row label="Dates" value={`${format(new Date(checkIn), 'MMM d')} – ${format(new Date(checkOut), 'MMM d')}`} />
        <View className="flex-row items-center justify-between py-3">
          <Text className="font-sans-medium text-foreground">Guests</Text>
          <View className="flex-row items-center gap-3">
            <Stepper
              label="-"
              onPress={() => setGuests((g) => Math.max(1, g - 1))}
              disabled={guests <= 1}
            />
            <Text className="font-sans-medium text-base w-6 text-center">
              {guests}
            </Text>
            <Stepper
              label="+"
              onPress={() => setGuests((g) => Math.min(listing.maxGuests, g + 1))}
              disabled={guests >= listing.maxGuests}
            />
          </View>
        </View>

        <View className="h-px bg-border my-4" />

        <Text className="font-display text-2xl text-foreground mb-3">
          Price details
        </Text>
        {pricing && <PriceBreakdown pricing={pricing} />}

        <View className="h-px bg-border my-6" />

        <Pressable
          onPress={() => setAgreed((v) => !v)}
          className="flex-row items-start"
        >
          <View
            className={[
              'w-6 h-6 rounded border mt-0.5 items-center justify-center',
              agreedToHouseRules ? 'bg-navy border-navy' : 'border-muted',
            ].join(' ')}
          >
            {agreedToHouseRules && <Text className="text-white text-sm">✓</Text>}
          </View>
          <Text className="ml-3 flex-1 font-sans text-sm text-foreground">
            I agree to the house rules and cancellation policy.
          </Text>
        </Pressable>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-5 py-4">
        <Button
          label="Confirm and pay"
          fullWidth
          size="lg"
          loading={initiate.isPending}
          disabled={!agreedToHouseRules || !pricing}
          onPress={handleConfirm}
        />
      </View>
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="font-sans-medium text-foreground">{label}</Text>
      <Text className="font-sans text-foreground">{value}</Text>
    </View>
  )
}

function Stepper({
  label,
  onPress,
  disabled,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
}): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={[
        'w-9 h-9 rounded-full border items-center justify-center',
        disabled ? 'border-border opacity-50' : 'border-navy',
      ].join(' ')}
    >
      <Text className="text-navy font-sans-semibold text-lg">{label}</Text>
    </Pressable>
  )
}
