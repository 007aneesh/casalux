import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { useUser } from '@clerk/expo'
import { format, parseISO } from 'date-fns'
import type { Message } from '@casalux/types'

import { ScreenHeader } from '../../src/components/common/ScreenHeader'
import { LoadingView } from '../../src/components/common/LoadingView'
import { useThread, useSendMessage } from '../../src/api/hooks/useMessages'
import { colors } from '../../src/theme/tokens'

export default function ThreadScreen(): JSX.Element {
  const { threadId } = useLocalSearchParams<{ threadId: string }>()
  const { user } = useUser()
  const { data, isLoading } = useThread(threadId)
  const sendMessage = useSendMessage(threadId ?? '')
  const [draft, setDraft] = useState('')
  const listRef = useRef<FlatList<Message>>(null)

  useEffect(() => {
    if (data?.messages.length) {
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: false }),
      )
    }
  }, [data?.messages.length])

  if (isLoading || !data) return <LoadingView />

  const handleSend = async (): Promise<void> => {
    const body = draft.trim()
    if (!body) return
    setDraft('')
    await sendMessage.mutateAsync(body)
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader
        title={`${data.thread.otherUser.firstName} ${data.thread.otherUser.lastName}`}
        showBack
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <FlatList
          ref={listRef}
          data={data.messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isMine={item.senderId === user?.id}
            />
          )}
        />

        <View className="flex-row items-center border-t border-border bg-card px-3 py-2 gap-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={colors.mutedLight}
            className="flex-1 bg-background rounded-full px-4 h-11 font-sans text-base text-foreground"
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || sendMessage.isPending}
            className={[
              'w-11 h-11 rounded-full items-center justify-center',
              draft.trim() ? 'bg-navy' : 'bg-border',
            ].join(' ')}
          >
            <Text className="text-white text-lg">↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function MessageBubble({
  message,
  isMine,
}: {
  message: Message
  isMine: boolean
}): JSX.Element {
  return (
    <View
      className={[
        'max-w-[78%] px-4 py-2 rounded-2xl',
        isMine ? 'bg-navy self-end' : 'bg-card border border-border self-start',
      ].join(' ')}
    >
      <Text
        className={[
          'font-sans text-base',
          isMine ? 'text-white' : 'text-foreground',
        ].join(' ')}
      >
        {message.body}
      </Text>
      <Text
        className={[
          'font-sans text-[10px] mt-1',
          isMine ? 'text-white/70' : 'text-muted',
        ].join(' ')}
      >
        {format(parseISO(message.createdAt), 'h:mm a')}
      </Text>
    </View>
  )
}
