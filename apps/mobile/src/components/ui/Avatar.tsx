import { View, Text } from 'react-native'
import { Image } from 'expo-image'

interface AvatarProps {
  src?: string | null
  name: string
  size?: number
}

export function Avatar({ src, name, size = 40 }: AvatarProps): JSX.Element {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    )
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-navy items-center justify-center"
    >
      <Text
        className="text-white font-sans-semibold"
        style={{ fontSize: size * 0.4 }}
      >
        {initials || '?'}
      </Text>
    </View>
  )
}
