'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import { Skeleton } from '@casalux/ui'
import {
  User, Mail, Phone, Globe, Shield, Bell, CreditCard,
  ChevronRight, Star, Home, BookOpen, Heart
} from 'lucide-react'
import Link from 'next/link'

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden mb-4">
      <div className="px-5 py-3.5 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function ProfileRow({ icon: Icon, label, value, href }: {
  icon: React.ElementType
  label: string
  value?: string
  href?: string
}) {
  const content = (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
      <div className="w-9 h-9 rounded-xl bg-navy/5 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-navy" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-navy truncate">{value ?? '—'}</p>
      </div>
      {href && <ChevronRight size={16} className="text-muted group-hover:text-gold transition-colors flex-shrink-0" />}
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function StatBadge({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1 py-4 border-r border-gray-100 last:border-0">
      <Icon size={18} className="text-gold" />
      <p className="text-lg font-bold text-navy">{value}</p>
      <p className="text-xs text-muted text-center">{label}</p>
    </div>
  )
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </main>
    )
  }

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Guest'
  const email = user?.primaryEmailAddress?.emailAddress
  const phone = user?.primaryPhoneNumber?.phoneNumber

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-4 flex items-center gap-4">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-16 h-16',
              }
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-display text-xl font-bold text-navy truncate">{fullName}</p>
            <p className="text-sm text-muted truncate">{email}</p>
            <p className="text-xs text-gold mt-0.5 font-medium">CasaLux Member</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card flex mb-4">
          <StatBadge icon={BookOpen} label="Trips" value={0} />
          <StatBadge icon={Heart} label="Saved" value={0} />
          <StatBadge icon={Star} label="Reviews" value={0} />
        </div>

        {/* Personal info */}
        <ProfileSection title="Personal Information">
          <ProfileRow icon={User} label="Full name" value={fullName} />
          <ProfileRow icon={Mail} label="Email" value={email} />
          <ProfileRow icon={Phone} label="Phone" value={phone ?? 'Not added'} />
        </ProfileSection>

        {/* Account */}
        <ProfileSection title="Account">
          <ProfileRow icon={Shield} label="Privacy & safety" href="/profile/privacy" />
          <ProfileRow icon={Bell} label="Notifications" href="/profile/notifications" />
          <ProfileRow icon={CreditCard} label="Payments & payouts" href="/profile/payments" />
          <ProfileRow icon={Globe} label="Language & currency" value="English · INR" />
        </ProfileSection>

        {/* Hosting */}
        <ProfileSection title="Hosting">
          <ProfileRow icon={Home} label="Host dashboard" href="/host/dashboard" />
          <ProfileRow icon={BookOpen} label="My listings" href="/host/listings" />
        </ProfileSection>

        {/* Sign out handled by Clerk UserButton */}
        <p className="text-center text-xs text-muted mt-6">
          Tap your avatar above to sign out or manage your account.
        </p>
      </div>
    </main>
  )
}
