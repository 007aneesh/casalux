import { useState } from 'react'
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Input } from '../../src/components/ui/Input'
import { ListingCard } from '../../src/components/listing/ListingCard'
import { QuickFilters } from '../../src/components/listing/QuickFilters'
import { EmptyState } from '../../src/components/common/EmptyState'
import { useListings, useQuickFilters } from '../../src/api/hooks/useListings'
import { colors } from '../../src/theme/tokens'

export default function SearchScreen(): JSX.Element {
  const [location, setLocation] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const { data: filtersData } = useQuickFilters()
  const { data, isLoading, isError, refetch, isRefetching } = useListings({
    location: location || undefined,
    quickFilter: activeFilter ?? undefined,
    limit: 20,
    page: 1,
  })

  const filters = filtersData ?? []
  const items = data?.items ?? []

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-3 pb-2">
        <Text className="font-display text-3xl text-foreground mb-3">
          Where to?
        </Text>
        <Input
          placeholder="Search destinations…"
          value={location}
          onChangeText={setLocation}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {filters.length > 0 && (
        <QuickFilters
          filters={filters}
          active={activeFilter}
          onChange={setActiveFilter}
        />
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
          renderItem={({ item }) => <ListingCard listing={item} />}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <EmptyState
              title={isError ? 'Something went wrong' : 'No stays found'}
              description={
                isError
                  ? 'Pull to retry.'
                  : 'Try a different destination or remove filters.'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  )
}
