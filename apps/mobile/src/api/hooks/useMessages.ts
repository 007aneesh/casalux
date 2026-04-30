import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Message, MessageThread } from '@casalux/types'
import { apiFetch } from '../client'
import { queryKeys } from '../keys'
import { useAuthToken } from '../../lib/auth'

export interface ThreadSummary extends MessageThread {
  lastMessage: Pick<Message, 'body' | 'createdAt' | 'senderId'> | null
  otherUser: {
    id: string
    firstName: string
    lastName: string
    profileImageUrl: string | null
  }
}

export function useThreads() {
  const getToken = useAuthToken()
  return useQuery({
    queryKey: queryKeys.messages.threads(),
    queryFn: () =>
      apiFetch<{ items: ThreadSummary[] }>('/api/v1/messages/threads', {
        getToken,
      }),
  })
}

export function useThread(id: string | undefined) {
  const getToken = useAuthToken()
  return useQuery({
    queryKey: queryKeys.messages.thread(id ?? ''),
    queryFn: () =>
      apiFetch<{ thread: ThreadSummary; messages: Message[] }>(
        `/api/v1/messages/threads/${id}`,
        { getToken },
      ),
    enabled: !!id,
    refetchInterval: 5000,
  })
}

export function useSendMessage(threadId: string) {
  const getToken = useAuthToken()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) =>
      apiFetch<Message>(
        `/api/v1/messages/threads/${threadId}/messages`,
        { method: 'POST', body: { body }, getToken },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.messages.thread(threadId) })
      void qc.invalidateQueries({ queryKey: queryKeys.messages.threads() })
    },
  })
}
