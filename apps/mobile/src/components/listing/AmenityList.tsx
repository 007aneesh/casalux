import { View, Text } from 'react-native'

interface AmenityListProps {
  amenities: string[]
}

const AMENITY_LABELS: Record<string, { label: string; icon: string }> = {
  wifi: { label: 'Wifi', icon: '📶' },
  kitchen: { label: 'Kitchen', icon: '🍳' },
  pool: { label: 'Pool', icon: '🏊' },
  parking: { label: 'Free parking', icon: '🅿️' },
  ac: { label: 'Air conditioning', icon: '❄️' },
  washer: { label: 'Washer', icon: '🧺' },
  tv: { label: 'TV', icon: '📺' },
  workspace: { label: 'Workspace', icon: '💼' },
  pets: { label: 'Pets allowed', icon: '🐾' },
  hotTub: { label: 'Hot tub', icon: '🛁' },
  gym: { label: 'Gym', icon: '🏋️' },
  beachfront: { label: 'Beachfront', icon: '🏖️' },
}

export function AmenityList({ amenities }: AmenityListProps): JSX.Element {
  return (
    <View className="flex-row flex-wrap -mx-2">
      {amenities.map((a) => {
        const meta = AMENITY_LABELS[a] ?? { label: a, icon: '✓' }
        return (
          <View key={a} className="w-1/2 flex-row items-center px-2 py-2">
            <Text className="text-xl mr-3">{meta.icon}</Text>
            <Text className="font-sans text-base text-foreground flex-1">
              {meta.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
