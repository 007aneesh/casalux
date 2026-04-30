import { View, Text } from 'react-native'

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="font-display text-2xl text-foreground text-center mb-2">
        {title}
      </Text>
      {description && (
        <Text className="font-sans text-base text-muted text-center mb-6">
          {description}
        </Text>
      )}
      {action}
    </View>
  )
}
