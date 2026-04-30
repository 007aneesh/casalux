import { useState } from 'react'
import { View, Text, Dimensions, FlatList } from 'react-native'
import { Image } from 'expo-image'
import type { ListingImage } from '@casalux/types'

interface ImageCarouselProps {
  images: ListingImage[]
  height?: number
}

export function ImageCarousel({ images, height = 320 }: ImageCarouselProps): JSX.Element {
  const [index, setIndex] = useState(0)
  const width = Dimensions.get('window').width

  return (
    <View>
      <FlatList
        data={images}
        keyExtractor={(item) => item.publicId}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width)
          setIndex(i)
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.url }}
            style={{ width, height }}
            contentFit="cover"
          />
        )}
      />
      {images.length > 1 && (
        <View className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/50">
          <Text className="text-white text-xs font-sans-medium">
            {index + 1} / {images.length}
          </Text>
        </View>
      )}
    </View>
  )
}
