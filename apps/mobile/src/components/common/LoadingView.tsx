import { View, ActivityIndicator } from 'react-native'
import { colors } from '../../theme/tokens'

export function LoadingView(): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  )
}
