'use client'

import { useEffect, useRef, useState } from 'react'
import { Globe, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LANGUAGES } from '@/lib/i18n'
import { useLanguageStore, useTranslation } from '@/lib/i18n/store'

export function LanguagePicker() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { locale, setLocale } = useLanguageStore()
  const { t } = useTranslation()

  // Rehydrate language store after mount to avoid SSR/client hydration mismatch
  useEffect(() => {
    useLanguageStore.persist.rehydrate()
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const currentLang = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t.nav.language}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'hidden sm:flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
          open
            ? 'bg-surface text-foreground'
            : 'text-muted hover:bg-surface hover:text-foreground'
        )}
      >
        <Globe className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t.nav.language}
          className={cn(
            'absolute top-11 z-50 w-52 rounded-2xl bg-card border border-border shadow-lg',
            'py-1.5 animate-in fade-in-0 zoom-in-95 duration-150',
            // Position: default right-align, but flip for RTL
            'right-0'
          )}
        >
          <p className="px-3 pt-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            {t.nav.language}
          </p>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              role="option"
              aria-selected={locale === lang.code}
              onClick={() => {
                setLocale(lang.code)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors',
                'hover:bg-surface',
                locale === lang.code ? 'text-foreground font-medium' : 'text-muted'
              )}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="flex-1 text-left">{lang.label}</span>
              {locale === lang.code && (
                <Check className="h-3.5 w-3.5 text-gold shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
