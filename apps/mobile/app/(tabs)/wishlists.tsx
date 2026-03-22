import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native'
import { useAuth } from '@clerk/expo'
import { useRouter } from 'expo-router'

interface WishlistItem {
  id: string
  name: string
  count: number
}

const MOCK_WISHLISTS: WishlistItem[] = []

export default function WishlistsScreen(): JSX.Element {
  const { isSignedIn } = useAuth()
  const router = useRouter()

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthContainer}>
          <Text style={styles.unauthTitle}>Log in to view wishlists</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wishlists</Text>
      </View>

      <FlatList<WishlistItem>
        data={MOCK_WISHLISTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={MOCK_WISHLISTS.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No wishlists yet</Text>
            <Text style={styles.emptySubtext}>Save listings you love to a wishlist</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={styles.cardImage} />
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardCount}>{item.count} saved</Text>
          </TouchableOpacity>
        )}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#fff' },
  header:          { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title:           { fontSize: 28, fontWeight: '700', color: '#111827' },
  list:            { padding: 12 },
  emptyContainer:  { flex: 1 },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText:       { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtext:    { fontSize: 14, color: '#9ca3af', marginTop: 6 },
  row:             { justifyContent: 'space-between', paddingHorizontal: 8 },
  card:            { width: '48%', marginBottom: 16 },
  cardImage:       { height: 140, borderRadius: 10, backgroundColor: '#f3f4f6', marginBottom: 8 },
  cardName:        { fontSize: 14, fontWeight: '600', color: '#111827' },
  cardCount:       { fontSize: 12, color: '#6b7280', marginTop: 2 },
  unauthContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  unauthTitle:     { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 20 },
  button:          { backgroundColor: '#111827', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32 },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
})
