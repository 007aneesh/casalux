'use client'

import { useState } from 'react'

interface ExpandableTextProps {
  text: string
  limit?: number
}

export function ExpandableText({ text, limit = 400 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)
  const needsTruncation = text.length > limit
  const display = needsTruncation && !expanded ? text.slice(0, limit).trim() : text

  return (
    <div>
      <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
        {display}{needsTruncation && !expanded && '…'}
      </p>
      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm font-semibold text-foreground underline underline-offset-2 hover:text-navy transition-colors"
        >
          {expanded ? 'Show less ↑' : 'Show more ↓'}
        </button>
      )}
    </div>
  )
}
