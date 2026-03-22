import { View, Text, StyleSheet, SafeAreaView } from 'react-native'

export default function ExploreScreen(): JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
      </View>
      <View style={styles.mapPlaceholder}>
        {/* Replace with MapView from react-native-maps once map key is configured */}
        <Text style={styles.mapText}>Map view</Text>
        <Text style={styles.mapSubtext}>Configure EXPO_PUBLIC_GOOGLE_MAPS_KEY to enable</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  header:         { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title:          { fontSize: 28, fontWeight: '700', color: '#111827' },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  mapText:        { fontSize: 18, fontWeight: '600', color: '#374151' },
  mapSubtext:     { fontSize: 13, color: '#9ca3af', marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
})
