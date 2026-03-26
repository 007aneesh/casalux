'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMessageThreads } from '@/lib/hooks/useMessages'
import { Skeleton } from '@casalux/ui'
import { MessageCircle, Home } from 'lucide-react'
import { formatDateShort } from '@/lib/utils'

function ThreadCard({ thread }: { thread: any }) {
  const timeAgo = thread.lastMessage?.sentAt
    ? (() => {
        const d = new Date(thread.lastMessage.sentAt)
        const diff = (Date.now() - d.getTime()) / 1000
        if (diff < 60) return 'just now'
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return formatDateShort(thread.lastMessage.sentAt)
      })()
    : null

  return (
    <Link href={`/messages/${thread.id}`} className="flex gap-4 p-4 hover:bg-gray-50 transition-colors rounded-2xl group">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-navy/10">
          {thread.otherParticipant.imageUrl ? (
            <Image
              src={thread.otherParticipant.imageUrl}
              alt={thread.otherParticipant.name}
              width={48}
              height={48}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-navy font-bold text-lg">
              {thread.otherParticipant.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {thread.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gold text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold truncate ${thread.unreadCount > 0 ? 'text-navy' : 'text-gray-700'}`}>
            {thread.otherParticipant.name}
          </p>
          {timeAgo && <span className="text-xs text-muted flex-shrink-0">{timeAgo}</span>}
        </div>
        <p className="text-xs text-muted flex items-center gap-1 mt-0.5 truncate">
          <Home size={10} className="flex-shrink-0" />
          <span className="truncate">{thread.listingTitle}</span>
        </p>
        {thread.lastMessage && (
          <p className={`text-sm mt-1 truncate ${thread.unreadCount > 0 ? 'font-medium text-navy' : 'text-muted'}`}>
            {thread.lastMessage.isMe ? 'You: ' : ''}{thread.lastMessage.content}
          </p>
        )}
      </div>
    </Link>
  )
}

function ThreadSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const { threads, isLoading } = useMessageThreads()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-0 sm:px-4 py-0 sm:py-8">
        <div className="bg-white sm:rounded-2xl sm:shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h1 className="font-display text-xl font-bold text-navy">Messages</h1>
          </div>

          {isLoading ? (
            <div className="divide-y divide-gray-50">
              {[...Array(5)].map((_, i) => <ThreadSkeleton key={i} />)}
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-20 px-6">
              <MessageCircle size={40} className="mx-auto mb-3 text-gold/40" />
              <p className="font-semibold text-navy mb-1">No messages yet</p>
              <p className="text-sm text-muted">
                Messages with hosts will appear here after you make a booking inquiry.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {threads.map((thread: any) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
