import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native'
import { useAuth, useUser } from '@clerk/expo'
import { useRouter } from 'expo-router'

export default function ProfileScreen(): JSX.Element {
  const { isSignedIn, signOut } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  if (!isSignedIn || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthContainer}>
          <Text style={styles.unauthTitle}>Log in to view your profile</Text>
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

  const profileMenuItems = [
    { label: 'My Bookings',   icon: '📋', onPress: () => { /* TODO: navigate to bookings */ } },
    { label: 'My Listings',   icon: '🏠', onPress: () => { /* TODO: navigate to listings */ } },
    { label: 'Payment info',  icon: '💳', onPress: () => { /* TODO: navigate to payment */ } },
    { label: 'Settings',      icon: '⚙️', onPress: () => { /* TODO: navigate to settings */ } },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.firstName?.charAt(0) ?? user.emailAddresses[0]?.emailAddress.charAt(0) ?? '?').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>
            {[user.firstName, user.lastName].filter(Boolean).join(' ') ||
              user.emailAddresses[0]?.emailAddress}
          </Text>
          <Text style={styles.email}>{user.emailAddresses[0]?.emailAddress}</Text>
        </View>

        <View style={styles.menu}>
          {profileMenuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => signOut()}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#fff' },
  unauthContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  unauthTitle:     { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 20 },
  button:          { backgroundColor: '#111827', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32 },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
  header:          { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  avatar:          { width: 80, height: 80, borderRadius: 40, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:      { color: '#fff', fontSize: 32, fontWeight: '700' },
  name:            { fontSize: 20, fontWeight: '700', color: '#111827' },
  email:           { fontSize: 14, color: '#6b7280', marginTop: 4 },
  menu:            { marginTop: 24, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  menuItem:        {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  menuIcon:        { fontSize: 20, marginRight: 16, width: 28 },
  menuLabel:       { flex: 1, fontSize: 16, color: '#374151' },
  chevron:         { fontSize: 20, color: '#9ca3af' },
  signOutButton:   {
    margin: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText:     { fontSize: 16, color: '#ef4444', fontWeight: '600' },
})
