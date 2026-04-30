import { ScrollView, View, Text, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { formatCurrency } from '@casalux/utils'

import { useListing, useListingReviews } from '../../src/api/hooks/useListings'
import { ImageCarousel } from '../../src/components/listing/ImageCarousel'
import { AmenityList } from '../../src/components/listing/AmenityList'
import { Button } from '../../src/components/ui/Button'
import { Badge } from '../../src/components/ui/Badge'
import { LoadingView } from '../../src/components/common/LoadingView'

export default function ListingDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: listing, isLoading } = useListing(id)
  const { data: reviews } = useListingReviews(id)

  if (isLoading || !listing) return <LoadingView />

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <ImageCarousel images={listing.images} />

        <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0">
          <View className="flex-row justify-between px-5 pt-2">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center"
            >
              <Text className="text-2xl text-navy">‹</Text>
            </Pressable>
          </View>
        </SafeAreaView>

        <View className="px-5 pt-5">
          <Text className="font-display text-3xl text-foreground">
            {listing.title}
          </Text>
          <Text className="font-sans text-base text-muted mt-1">
            {listing.address.city}, {listing.address.country}
          </Text>

          <View className="flex-row items-center mt-3 gap-3">
            {listing.totalReviews > 0 && (
              <Text className="font-sans-medium text-foreground">
                <Text className="text-gold">★</Text> {listing.avgRating.toFixed(1)}
                <Text className="text-muted">  ·  {listing.totalReviews} reviews</Text>
              </Text>
            )}
            {listing.instantBook && <Badge label="Instant book" variant="gold" />}
          </View>

          <View className="h-px bg-border my-6" />

          <Text className="font-sans text-foreground leading-6">
            {listing.description}
          </Text>

          <View className="flex-row gap-6 mt-6">
            <Stat value={listing.maxGuests} label="guests" />
            <Stat value={listing.bedrooms} label="bedrooms" />
            <Stat value={listing.beds} label="beds" />
            <Stat value={listing.baths} label="baths" />
          </View>

          <View className="h-px bg-border my-6" />

          <Text className="font-display text-2xl text-foreground mb-4">
            What this place offers
          </Text>
          <AmenityList amenities={listing.amenities} />

          <View className="h-px bg-border my-6" />

          <Text className="font-display text-2xl text-foreground mb-3">
            Reviews
          </Text>
          {reviews && reviews.items.length > 0 ? (
            reviews.items.slice(0, 3).map((r) => (
              <View key={r.id} className="mb-5">
                <Text className="font-sans-semibold text-foreground">
                  {r.guest.firstName}
                </Text>
                <Text className="font-sans text-sm text-muted mb-1">
                  <Text className="text-gold">★</Text> {r.rating.toFixed(1)}
                </Text>
                <Text className="font-sans text-foreground">{r.comment}</Text>
              </View>
            ))
          ) : (
            <Text className="font-sans text-muted">No reviews yet.</Text>
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-5 py-4 flex-row items-center justify-between">
        <View>
          <Text className="font-sans-semibold text-lg text-foreground">
            {formatCurrency(listing.basePrice, listing.currency)}
          </Text>
          <Text className="font-sans text-sm text-muted">per night</Text>
        </View>
        <Button
          label="Reserve"
          variant="primary"
          size="lg"
          onPress={() => router.push({ pathname: '/booking/[id]/review', params: { id: listing.id } })}
        />
      </View>
    </View>
  )
}

function Stat({ value, label }: { value: number; label: string }): JSX.Element {
  return (
    <View>
      <Text className="font-sans-semibold text-lg text-foreground">{value}</Text>
      <Text className="font-sans text-sm text-muted">{label}</Text>
    </View>
  )
}
