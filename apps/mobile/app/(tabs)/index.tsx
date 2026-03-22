import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native'
import { useState } from 'react'

interface SearchResult {
  id: string
  title: string
  city: string
  pricePerNight: number
  rating: number
}

// Placeholder data — will be replaced with real API calls
const MOCK_RESULTS: SearchResult[] = []

export default function SearchScreen(): JSX.Element {
  const [query, setQuery] = useState('')

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Where to?</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search destinations…"
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList<SearchResult>
        data={MOCK_RESULTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          MOCK_RESULTS.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Search for a destination to get started</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={styles.cardImage} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardCity}>{item.city}</Text>
              <Text style={styles.cardPrice}>
                <Text style={styles.cardPriceBold}>${item.pricePerNight}</Text> / night
              </Text>
              <Text style={styles.cardRating}>★ {item.rating.toFixed(1)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#fff' },
  header:          { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title:           { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 12 },
  searchInput:     {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
  },
  list:            { padding: 16, gap: 16 },
  emptyContainer:  { flex: 1 },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText:       { color: '#9ca3af', fontSize: 16, textAlign: 'center' },
  card:            {
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  cardImage:       { height: 180, borderRadius: 12, backgroundColor: '#f3f4f6', marginBottom: 8 },
  cardBody:        { padding: 12 },
  cardTitle:       { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardCity:        { fontSize: 14, color: '#6b7280', marginTop: 2 },
  cardPrice:       { fontSize: 14, color: '#374151', marginTop: 6 },
  cardPriceBold:   { fontWeight: '700' },
  cardRating:      { fontSize: 14, color: '#f59e0b', marginTop: 2 },
})
