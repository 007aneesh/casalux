import { useMemo, useState } from 'react'
import { View, Text, FlatList, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { format, isAfter, parseISO } from 'date-fns'
import type { Booking } from '@casalux/types'
import { formatCurrency } from '@casalux/utils'

import { Card } from '../../src/components/ui/Card'
import { Badge } from '../../src/components/ui/Badge'
import { EmptyState } from '../../src/components/common/EmptyState'
import { LoadingView } from '../../src/components/common/LoadingView'
import { useMyBookings } from '../../src/api/hooks/useBookings'

type Tab = 'upcoming' | 'past'

export default function TripsScreen(): JSX.Element {
  const [tab, setTab] = useState<Tab>('upcoming')
  const router = useRouter()
  const { data, isLoading, refetch, isRefetching } = useMyBookings()

  const items = useMemo(() => {
    const all = data?.items ?? []
    const now = new Date()
    return all.filter((b) => {
      const isUpcoming = isAfter(parseISO(b.checkOut), now)
      return tab === 'upcoming' ? isUpcoming : !isUpcoming
    })
  }, [data, tab])

  if (isLoading) return <LoadingView />

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-3 pb-4">
        <Text className="font-display text-3xl text-foreground mb-4">Trips</Text>
        <View className="flex-row bg-border/50 rounded-full p-1">
          {(['upcoming', 'past'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={[
                'flex-1 h-10 items-center justify-center rounded-full',
                tab === t ? 'bg-card' : '',
              ].join(' ')}
            >
              <Text
                className={[
                  'font-sans-medium capitalize',
                  tab === t ? 'text-navy' : 'text-muted',
                ].join(' ')}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 20, paddingTop: 4 }}
        renderItem={({ item }) => (
          <TripCard
            booking={item}
            onPress={() => router.push(`/listing/${item.listingId}`)}
          />
        )}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            title={tab === 'upcoming' ? 'No upcoming trips' : 'No past trips'}
            description={
              tab === 'upcoming'
                ? 'When you book a stay, it will show up here.'
                : 'Your trip history will appear here.'
            }
          />
        }
      />
    </SafeAreaView>
  )
}

function badgeVariantFor(status: Booking['status']): 'success' | 'danger' | 'gold' {
  if (status === 'confirmed' || status === 'completed') return 'success'
  if (status.includes('cancelled') || status.includes('declined') || status.includes('expired') || status === 'payment_failed') {
    return 'danger'
  }
  return 'gold'
}

function TripCard({
  booking,
  onPress,
}: {
  booking: Booking
  onPress: () => void
}): JSX.Element {
  return (
    <Pressable onPress={onPress} className="mb-4">
      <Card className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="font-sans-semibold text-foreground flex-1 pr-3">
            Booking #{booking.id.slice(-6).toUpperCase()}
          </Text>
          <Badge label={booking.status} variant={badgeVariantFor(booking.status)} />
        </View>
        <Text className="font-sans text-muted">
          {format(parseISO(booking.checkIn), 'MMM d')} –{' '}
          {format(parseISO(booking.checkOut), 'MMM d, yyyy')}
        </Text>
        <Text className="font-sans text-muted mt-1">
          {booking.guests} guest{booking.guests > 1 ? 's' : ''} · {booking.nights} night
          {booking.nights > 1 ? 's' : ''}
        </Text>
        <View className="h-px bg-border my-3" />
        <View className="flex-row justify-between">
          <Text className="font-sans-medium text-foreground">Total</Text>
          <Text className="font-sans-semibold text-foreground">
            {formatCurrency(booking.totalAmount)}
          </Text>
        </View>
      </Card>
    </Pressable>
  )
}
