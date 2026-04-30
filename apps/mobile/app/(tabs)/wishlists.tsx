import { View, Text, FlatList, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import type { Listing } from '@casalux/types'

import { Card } from '../../src/components/ui/Card'
import { EmptyState } from '../../src/components/common/EmptyState'
import { LoadingView } from '../../src/components/common/LoadingView'
import { useWishlists, type Wishlist } from '../../src/api/hooks/useWishlists'

export default function WishlistsScreen(): JSX.Element {
  const router = useRouter()
  const { data, isLoading, refetch, isRefetching } = useWishlists()

  if (isLoading) return <LoadingView />

  const items = data?.items ?? []

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-3 pb-2">
        <Text className="font-display text-3xl text-foreground">Wishlists</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(w) => w.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24, gap: 12 }}
        renderItem={({ item }) => (
          <WishlistTile
            wishlist={item}
            onPress={() => {
              const first = item.listings[0]
              if (first) router.push(`/listing/${first.id}`)
            }}
          />
        )}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            title="No saved stays yet"
            description="Tap the heart on any listing to save it for later."
          />
        }
      />
    </SafeAreaView>
  )
}

function WishlistTile({
  wishlist,
  onPress,
}: {
  wishlist: Wishlist
  onPress: () => void
}): JSX.Element {
  const cover = pickCover(wishlist.listings)
  return (
    <Pressable onPress={onPress} className="flex-1">
      <Card className="overflow-hidden">
        <View style={{ aspectRatio: 1, backgroundColor: '#E5E3DE' }}>
          {cover && (
            <Image
              source={{ uri: cover }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          )}
        </View>
        <View className="p-3">
          <Text className="font-sans-semibold text-foreground" numberOfLines={1}>
            {wishlist.name}
          </Text>
          <Text className="font-sans text-sm text-muted">
            {wishlist.listings.length} saved
          </Text>
        </View>
      </Card>
    </Pressable>
  )
}

function pickCover(listings: Listing[]): string | undefined {
  for (const l of listings) {
    const img = l.images.find((i) => i.isPrimary) ?? l.images[0]
    if (img?.url) return img.url
  }
  return undefined
}
