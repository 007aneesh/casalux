import { View, Text, FlatList, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { formatDistanceToNow, parseISO } from 'date-fns'

import { Avatar } from '../../src/components/ui/Avatar'
import { EmptyState } from '../../src/components/common/EmptyState'
import { LoadingView } from '../../src/components/common/LoadingView'
import { useThreads, type ThreadSummary } from '../../src/api/hooks/useMessages'

export default function InboxScreen(): JSX.Element {
  const router = useRouter()
  const { data, isLoading, refetch, isRefetching } = useThreads()

  if (isLoading) return <LoadingView />

  const items = data?.items ?? []

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-3 pb-2">
        <Text className="font-display text-3xl text-foreground">Inbox</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <ThreadRow
            thread={item}
            onPress={() => router.push(`/messages/${item.id}`)}
          />
        )}
        onRefresh={refetch}
        refreshing={isRefetching}
        ItemSeparatorComponent={() => <View className="h-px bg-border ml-20" />}
        ListEmptyComponent={
          <EmptyState
            title="No messages yet"
            description="When you start booking, your conversations with hosts will appear here."
          />
        }
      />
    </SafeAreaView>
  )
}

function ThreadRow({
  thread,
  onPress,
}: {
  thread: ThreadSummary
  onPress: () => void
}): JSX.Element {
  const name = `${thread.otherUser.firstName} ${thread.otherUser.lastName}`
  const unread = thread.unreadCountGuest > 0
  return (
    <Pressable onPress={onPress} className="flex-row items-center px-5 py-4">
      <Avatar src={thread.otherUser.profileImageUrl} name={name} size={48} />
      <View className="flex-1 ml-4">
        <View className="flex-row justify-between items-center">
          <Text
            className={[
              'text-base text-foreground',
              unread ? 'font-sans-semibold' : 'font-sans-medium',
            ].join(' ')}
          >
            {name}
          </Text>
          {thread.lastMessage && (
            <Text className="font-sans text-xs text-muted">
              {formatDistanceToNow(parseISO(thread.lastMessage.createdAt), {
                addSuffix: false,
              })}
            </Text>
          )}
        </View>
        <Text
          numberOfLines={1}
          className={[
            'text-sm mt-0.5',
            unread ? 'font-sans-medium text-foreground' : 'font-sans text-muted',
          ].join(' ')}
        >
          {thread.lastMessage?.body ?? 'No messages yet'}
        </Text>
      </View>
      {unread && <View className="w-2 h-2 rounded-full bg-gold ml-2" />}
    </Pressable>
  )
}
