import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { format } from 'date-fns'

import { Button } from '../../../src/components/ui/Button'
import { Card } from '../../../src/components/ui/Card'
import { LoadingView } from '../../../src/components/common/LoadingView'
import { useBooking } from '../../../src/api/hooks/useBookings'
import { useListing } from '../../../src/api/hooks/useListings'
import { formatCurrency } from '@casalux/utils'

export default function ConfirmationScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: booking } = useBooking(id)
  const { data: listing } = useListing(booking?.listingId)

  if (!booking || !listing) return <LoadingView />

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <View className="flex-1 px-5 pt-12">
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-full bg-success/20 items-center justify-center mb-4">
            <Text className="text-3xl text-success">✓</Text>
          </View>
          <Text className="font-display text-3xl text-foreground text-center">
            You're going to{'\n'}
            {listing.address.city}!
          </Text>
        </View>

        <Card className="p-5">
          <Text className="font-sans-semibold text-foreground text-lg mb-1">
            {listing.title}
          </Text>
          <Text className="font-sans text-muted mb-4">
            {format(new Date(booking.checkIn), 'MMM d')} –{' '}
            {format(new Date(booking.checkOut), 'MMM d, yyyy')} ·{' '}
            {booking.guests} guest{booking.guests > 1 ? 's' : ''}
          </Text>
          <View className="h-px bg-border mb-4" />
          <View className="flex-row justify-between">
            <Text className="font-sans-medium text-foreground">Total paid</Text>
            <Text className="font-sans-semibold text-foreground">
              {formatCurrency(booking.totalAmount, listing.currency)}
            </Text>
          </View>
        </Card>

        <View className="flex-1 justify-end pb-8 gap-3">
          <Button
            label="View in Trips"
            fullWidth
            size="lg"
            onPress={() => router.replace('/(tabs)/trips')}
          />
          <Button
            label="Back to home"
            variant="ghost"
            fullWidth
            onPress={() => router.replace('/(tabs)')}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}
