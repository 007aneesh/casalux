import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Text as RNText } from 'react-native'

interface ScreenHeaderProps {
  title: string
  showBack?: boolean
  right?: React.ReactNode
}

export function ScreenHeader({ title, showBack, right }: ScreenHeaderProps): JSX.Element {
  const router = useRouter()
  return (
    <View className="flex-row items-center justify-between px-5 pt-2 pb-3 bg-background border-b border-border">
      <View className="w-10">
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-10 h-10 items-center justify-center"
          >
            <RNText className="text-2xl text-navy">‹</RNText>
          </Pressable>
        )}
      </View>
      <Text className="flex-1 text-center font-display text-xl text-foreground">
        {title}
      </Text>
      <View className="w-10 items-end">{right}</View>
    </View>
  )
}
