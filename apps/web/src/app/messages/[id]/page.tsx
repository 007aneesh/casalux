'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMessageThread, useMessageActions } from '@/lib/hooks/useMessages'
import { Skeleton } from '@casalux/ui'
import { ArrowLeft, Send, Home, Loader2 } from 'lucide-react'

function MessageBubble({ message }: { message: any }) {
  const time = new Date(message.sentAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (message.isMe) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[75%]">
          <div className="bg-navy text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
            {message.content}
          </div>
          <p className="text-right text-xs text-muted mt-1">{time}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 mb-3">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-navy/10 flex-shrink-0 self-end">
        {message.senderImage ? (
          <Image src={message.senderImage} alt={message.senderName} width={32} height={32} className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-navy text-xs font-bold">
            {message.senderName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="max-w-[75%]">
        <div className="bg-gray-100 text-navy rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
        <p className="text-xs text-muted mt-1">{time}</p>
      </div>
    </div>
  )
}

function DateDivider({ date }: { date: string }) {
  const label = (() => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  })()
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-xs text-muted font-medium">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

export default function MessageThreadPage() {
  const params = useParams()
  const threadId = params?.id as string
  const { thread, messages, isLoading, mutate } = useMessageThread(threadId)
  const { sendMessage, markAsRead } = useMessageActions()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages load/update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Mark as read when thread opens
  useEffect(() => {
    if (threadId) markAsRead(threadId)
  }, [threadId])

  async function handleSend() {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')
    try {
      await sendMessage(threadId, content)
      mutate()
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  // Group messages by date
  const grouped: { date: string; items: typeof messages }[] = []
  for (const msg of messages) {
    const date = new Date(msg.sentAt).toDateString()
    const last = grouped[grouped.length - 1]
    if (last && last.date === date) {
      last.items.push(msg)
    } else {
      grouped.push({ date, items: [msg] })
    }
  }

  return (
    <main className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-nav flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/messages" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-navy" />
          </Link>
          {isLoading ? (
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ) : thread ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-navy/10 flex-shrink-0">
                {thread.otherParticipant.imageUrl ? (
                  <Image src={thread.otherParticipant.imageUrl} alt={thread.otherParticipant.name} width={40} height={40} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-navy font-bold">
                    {thread.otherParticipant.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-navy text-sm truncate">{thread.otherParticipant.name}</p>
                <Link
                  href={`/listings/${thread.listingId}`}
                  className="flex items-center gap-1 text-xs text-muted hover:text-gold transition-colors truncate"
                >
                  <Home size={10} />
                  <span className="truncate">{thread.listingTitle}</span>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-muted text-sm">
              No messages yet. Say hello!
            </div>
          ) : (
            grouped.map(group => (
              <div key={group.date}>
                <DateDivider date={group.items[0].sentAt} />
                {group.items.map(msg => <MessageBubble key={msg.id} message={msg} />)}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition max-h-32"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 bg-navy text-white rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-navy/90 transition"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </main>
  )
}
