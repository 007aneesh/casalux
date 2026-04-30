import { ScrollView, Pressable, Text } from 'react-native'

interface QuickFiltersProps {
  filters: { key: string; label: string }[]
  active: string | null
  onChange: (key: string | null) => void
}

export function QuickFilters({ filters, active, onChange }: QuickFiltersProps): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      className="py-3"
    >
      {filters.map((f) => {
        const isActive = active === f.key
        return (
          <Pressable
            key={f.key}
            onPress={() => onChange(isActive ? null : f.key)}
            className={[
              'px-4 h-9 rounded-full border items-center justify-center',
              isActive
                ? 'bg-navy border-navy'
                : 'bg-card border-border',
            ].join(' ')}
          >
            <Text
              className={[
                'text-sm font-sans-medium',
                isActive ? 'text-white' : 'text-foreground',
              ].join(' ')}
            >
              {f.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
