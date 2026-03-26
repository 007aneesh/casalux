'use client'
import useSWR, { useSWRConfig } from 'swr'
import { useAuth } from '@clerk/nextjs'
import { useAuthedRequest } from './useAuthedRequest'

export interface MessageThread {
  id: string
  listingId: string
  listingTitle: string
  listingImage: string | null
  otherParticipant: {
    id: string
    name: string
    imageUrl: string | null
  }
  lastMessage: {
    content: string
    sentAt: string
    isMe: boolean
  } | null
  unreadCount: number
  bookingId: string | null
}

export interface Message {
  id: string
  threadId: string
  senderId: string
  senderName: string
  senderImage: string | null
  content: string
  sentAt: string
  isMe: boolean
  attachments?: { url: string; type: 'image' | 'document' }[]
}

export function useMessageThreads() {
  const { isSignedIn } = useAuth()
  const authedRequest = useAuthedRequest()
  const { data, isLoading, error, mutate } = useSWR(
    isSignedIn ? '/messages/threads' : null,
    (path: string) => authedRequest<MessageThread[]>(path),
    { refreshInterval: 15000 } // poll every 15s for new messages
  )
  return { threads: data?.data ?? [], isLoading, error, mutate }
}

export function useMessageThread(threadId: string | null) {
  const { isSignedIn } = useAuth()
  const authedRequest = useAuthedRequest()
  const { data, isLoading, error, mutate } = useSWR(
    isSignedIn && threadId ? `/messages/threads/${threadId}` : null,
    (path: string) => authedRequest<{ thread: MessageThread; messages: Message[] }>(path),
    { refreshInterval: 5000 } // poll for new messages in active thread
  )
  return {
    thread: data?.data?.thread ?? null,
    messages: data?.data?.messages ?? [],
    isLoading,
    error,
    mutate,
  }
}

export function useMessageActions() {
  const { mutate } = useSWRConfig()
  const authedRequest = useAuthedRequest()

  async function sendMessage(threadId: string, content: string) {
    const res = await authedRequest<Message>(`/messages/threads/${threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
    mutate(`/messages/threads/${threadId}`)
    mutate('/messages/threads')
    return res
  }

  async function markAsRead(threadId: string) {
    await authedRequest(`/messages/threads/${threadId}/read`, { method: 'POST' })
    mutate('/messages/threads')
  }

  return { sendMessage, markAsRead }
}
