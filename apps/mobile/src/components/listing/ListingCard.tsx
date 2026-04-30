import { View, Text, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import type { Listing } from '@casalux/types'
import { formatCurrency } from '@casalux/utils'

interface ListingCardProps {
  listing: Listing
  onToggleSave?: () => void
  saved?: boolean
}

export function ListingCard({ listing, onToggleSave, saved }: ListingCardProps): JSX.Element {
  const router = useRouter()
  const primary =
    listing.images.find((i) => i.isPrimary) ?? listing.images[0]

  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing.id}`)}
      className="mb-6"
    >
      <View className="relative">
        <Image
          source={{ uri: primary?.url }}
          style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16 }}
          contentFit="cover"
          transition={200}
        />
        {onToggleSave && (
          <Pressable
            onPress={onToggleSave}
            hitSlop={8}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 items-center justify-center"
          >
            <Text className="text-lg" style={{ color: saved ? '#EF4444' : '#0E1B32' }}>
              {saved ? '♥' : '♡'}
            </Text>
          </Pressable>
        )}
      </View>

      <View className="flex-row items-start justify-between mt-3">
        <View className="flex-1 pr-2">
          <Text
            numberOfLines={1}
            className="font-display text-lg text-foreground"
          >
            {listing.title}
          </Text>
          <Text numberOfLines={1} className="font-sans text-sm text-muted mt-0.5">
            {listing.address.city}, {listing.address.country}
          </Text>
        </View>
        {listing.totalReviews > 0 && (
          <View className="flex-row items-center">
            <Text className="text-gold text-sm">★</Text>
            <Text className="font-sans-medium text-sm text-foreground ml-1">
              {listing.avgRating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      <Text className="font-sans text-sm text-foreground mt-1">
        <Text className="font-sans-semibold">
          {formatCurrency(listing.basePrice, listing.currency)}
        </Text>{' '}
        / night
      </Text>
    </Pressable>
  )
}
