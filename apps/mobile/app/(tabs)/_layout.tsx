import { Text } from 'react-native'
import { Tabs } from 'expo-router'

function TabIcon({ label, color }: { label: string; color: string }): JSX.Element {
  return <Text style={{ color, fontSize: 18 }}>{label}</Text>
}

export default function TabsLayout(): JSX.Element {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }: { color: string }) => (
            <TabIcon label="🔍" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }: { color: string }) => (
            <TabIcon label="🗺️" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlists"
        options={{
          title: 'Wishlists',
          tabBarIcon: ({ color }: { color: string }) => (
            <TabIcon label="♡" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => (
            <TabIcon label="👤" color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
