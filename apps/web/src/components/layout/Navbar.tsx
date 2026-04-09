'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs'
import {
  Menu,
  Home,
  Heart,
  CalendarDays,
  MessageSquare,
  Building2,
} from 'lucide-react'
import { Button } from '@casalux/ui'
import { cn } from '@/lib/utils'
import { SearchBar } from './SearchBar'
import { LanguagePicker } from './LanguagePicker'
import { useTranslation } from '@/lib/i18n/store'

function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => setHasMounted(true), [])
  return hasMounted
}

const Logo = () => (
  <Link href="/" className="flex items-center gap-2 shrink-0">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy">
      <Home className="h-4 w-4 text-gold" />
    </div>
    <span className="font-display text-xl font-semibold text-navy hidden sm:block">
      CasaLux
    </span>
  </Link>
)

export function Navbar() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [menuOpen, setMenuOpen] = useState(false)
  const hasMounted = useHasMounted()
  const { user } = useUser()
  // Only derive isHost after mount to avoid SSR/client Clerk state mismatch
  const role = hasMounted ? user?.publicMetadata?.role as string | undefined : undefined
  const isHost = role === 'host' || role === 'admin'
  const { t } = useTranslation()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full bg-card/95 backdrop-blur-md border-b border-border',
        'transition-shadow duration-200',
        isHome ? 'shadow-none' : 'shadow-nav'
      )}
    >
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Logo />

          {/* Search bar — centered, expands on desktop */}
          <div className="flex-1 max-w-2xl mx-auto hidden md:block">
            <SearchBar compact />
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Host Dashboard — only for host/admin */}
            {isHost && (
              <Link
                href="/host/dashboard"
                className="hidden lg:flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-surface transition-colors"
              >
                <Building2 className="h-4 w-4" />
                {t.nav.host}
              </Link>
            )}

            {/* Become a Host — for guests (signed in or out) */}
            {!isHost && (
              <Link
                href="/become-a-host"
                className="hidden lg:flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-surface transition-colors"
              >
                <Building2 className="h-4 w-4" />
                {t.nav.become_a_host}
              </Link>
            )}

            {/* Language */}
            <LanguagePicker />

            {/* Auth */}
            <SignedOut>
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">{t.nav.sign_in}</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="gold" size="sm">{t.nav.sign_up}</Button>
                </SignUpButton>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-1">
                <Link href="/wishlists">
                  <button className="h-9 w-9 flex items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-foreground transition-colors">
                    <Heart className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/bookings">
                  <button className="h-9 w-9 flex items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-foreground transition-colors">
                    <CalendarDays className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/messages">
                  <button className="h-9 w-9 flex items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-foreground transition-colors">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </Link>
                <div className="ml-1">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: 'h-8 w-8 ring-2 ring-border hover:ring-gold transition-all',
                      },
                    }}
                  />
                </div>
              </div>
            </SignedIn>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl hover:bg-surface transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Mobile search row */}
        <div className="pb-3 md:hidden">
          <SearchBar compact />
        </div>

        {/* Mobile nav menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            <Link href="/bookings" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface text-sm font-medium" onClick={() => setMenuOpen(false)}>
              <CalendarDays className="h-4 w-4 text-muted" /> {t.nav.my_bookings}
            </Link>
            <Link href="/wishlists" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface text-sm font-medium" onClick={() => setMenuOpen(false)}>
              <Heart className="h-4 w-4 text-muted" /> {t.nav.wishlists}
            </Link>
            <Link href="/messages" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface text-sm font-medium" onClick={() => setMenuOpen(false)}>
              <MessageSquare className="h-4 w-4 text-muted" /> {t.nav.messages}
            </Link>
            {isHost ? (
              <Link href="/host/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface text-sm font-medium" onClick={() => setMenuOpen(false)}>
                <Building2 className="h-4 w-4 text-muted" /> {t.nav.host_dashboard}
              </Link>
            ) : (
              <Link href="/become-a-host" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface text-sm font-medium" onClick={() => setMenuOpen(false)}>
                <Building2 className="h-4 w-4 text-muted" /> {t.nav.become_a_host}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
