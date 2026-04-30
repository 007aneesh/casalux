import { View, Text, ScrollView, Pressable, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth, useUser } from '@clerk/expo'
import { useRouter } from 'expo-router'

import { Avatar } from '../../src/components/ui/Avatar'
import { Button } from '../../src/components/ui/Button'

export default function ProfileScreen(): JSX.Element {
  const { isSignedIn, signOut } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  if (!isSignedIn || !user) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-display text-2xl text-foreground mb-6 text-center">
            Sign in to view your profile
          </Text>
          <Button
            label="Sign in"
            fullWidth
            onPress={() => router.push('/(auth)/sign-in')}
          />
        </View>
      </SafeAreaView>
    )
  }

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.emailAddresses[0]?.emailAddress ||
    'Guest'

  const items: { label: string; icon: string; onPress: () => void }[] = [
    {
      label: 'Trips',
      icon: '✈',
      onPress: () => router.push('/(tabs)/trips'),
    },
    {
      label: 'Wishlists',
      icon: '♡',
      onPress: () => router.push('/(tabs)/wishlists'),
    },
    {
      label: 'Inbox',
      icon: '✉',
      onPress: () => router.push('/(tabs)/inbox'),
    },
    {
      label: 'Become a host',
      icon: '🏠',
      onPress: () => Linking.openURL('https://casalux.com/become-a-host'),
    },
    {
      label: 'Help',
      icon: '?',
      onPress: () => Linking.openURL('https://casalux.com/help'),
    },
  ]

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5 pt-3 pb-2">
          <Text className="font-display text-3xl text-foreground">Profile</Text>
        </View>

        <View className="items-center px-5 py-8">
          <Avatar src={user.imageUrl} name={fullName} size={88} />
          <Text className="font-display text-2xl text-foreground mt-4">
            {fullName}
          </Text>
          <Text className="font-sans text-muted mt-1">
            {user.emailAddresses[0]?.emailAddress}
          </Text>
        </View>

        <View className="border-t border-border">
          {items.map((item) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              className="flex-row items-center px-5 py-4 border-b border-border"
            >
              <Text className="text-xl w-8">{item.icon}</Text>
              <Text className="flex-1 font-sans text-base text-foreground ml-2">
                {item.label}
              </Text>
              <Text className="text-2xl text-mutedLight">›</Text>
            </Pressable>
          ))}
        </View>

        <View className="px-5 mt-8">
          <Button
            label="Sign out"
            variant="outline"
            fullWidth
            onPress={() => signOut()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
