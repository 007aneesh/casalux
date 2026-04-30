import { View, Text } from 'react-native'

type BadgeVariant = 'neutral' | 'gold' | 'navy' | 'success' | 'danger'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

const variantClass: Record<BadgeVariant, { bg: string; text: string }> = {
  neutral: { bg: 'bg-border', text: 'text-foreground' },
  gold: { bg: 'bg-gold/20', text: 'text-gold-600' },
  navy: { bg: 'bg-navy', text: 'text-white' },
  success: { bg: 'bg-success/15', text: 'text-success' },
  danger: { bg: 'bg-danger/15', text: 'text-danger' },
}

export function Badge({ label, variant = 'neutral' }: BadgeProps): JSX.Element {
  const v = variantClass[variant]
  return (
    <View className={`self-start px-2.5 py-1 rounded-full ${v.bg}`}>
      <Text className={`text-xs font-sans-medium ${v.text}`}>{label}</Text>
    </View>
  )
}
