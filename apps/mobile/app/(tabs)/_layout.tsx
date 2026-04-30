import { Text } from 'react-native'
import { Tabs } from 'expo-router'
import { colors } from '../../src/theme/tokens'

function TabIcon({ label, color }: { label: string; color: string }): JSX.Element {
  return <Text style={{ color, fontSize: 20 }}>{label}</Text>
}

export default function TabsLayout(): JSX.Element {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.mutedLight,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 84,
          paddingTop: 6,
          paddingBottom: 24,
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'Inter_500Medium' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <TabIcon label="🔍" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlists"
        options={{
          title: 'Wishlists',
          tabBarIcon: ({ color }) => <TabIcon label="♡" color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color }) => <TabIcon label="✈" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => <TabIcon label="✉" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon label="👤" color={color} />,
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  )
}
