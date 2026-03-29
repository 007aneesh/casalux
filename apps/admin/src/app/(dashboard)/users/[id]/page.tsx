import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  getUserDetail, banUser, unbanUser, setUserVerification,
  changeUserRole, toggleSuperhost, deleteUser,
} from '@/lib/api'
import UserActions from '@/components/users/UserActions'

// ─── Shared auth context header (server → Clerk) ───────────────────────────
import { auth } from '@clerk/nextjs/server'

const ROLE_BADGE: Record<string, string> = {
  guest:       'bg-gray-100 text-gray-700',
  host:        'bg-blue-100 text-blue-700',
  admin:       'bg-purple-100 text-purple-700',
  super_admin: 'bg-red-100 text-red-700',
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Active',   cls: 'bg-green-100 text-green-700' },
  banned:    { label: 'Banned',   cls: 'bg-red-100 text-red-700' },
  deleted:   { label: 'Deleted',  cls: 'bg-gray-100 text-gray-500' },
}

const BOOKING_STATUS_BADGE: Record<string, string> = {
  confirmed:         'bg-green-100 text-green-700',
  completed:         'bg-blue-100 text-blue-700',
  pending_payment:   'bg-yellow-100 text-yellow-700',
  guest_cancelled:   'bg-gray-100 text-gray-500',
  cancelled_by_host: 'bg-gray-100 text-gray-500',
  cancelled_by_admin:'bg-gray-100 text-gray-500',
  payment_failed:    'bg-red-100 text-red-600',
}

const LISTING_STATUS_BADGE: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  draft:    'bg-gray-100 text-gray-600',
  paused:   'bg-yellow-100 text-yellow-700',
  archived: 'bg-red-100 text-red-600',
  flagged:  'bg-orange-100 text-orange-700',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-800">{value ?? <span className="text-gray-400 italic">—</span>}</dd>
    </div>
  )
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = await params
  const { userId: selfClerkId } = await auth()

  let detail
  try { detail = await getUserDetail(id) } catch { notFound() }
  if (!detail) notFound()

  const { user, stats, recentBookings, recentListings } = detail

  const accountStatus = user.deletedAt ? 'deleted' : user.isBanned ? 'banned' : 'active'
  const isSelf        = user.clerkId === selfClerkId

  const fmtCurrency = (cents: number, currency = 'INR') =>
    (cents / 100).toLocaleString('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 })

  // ── Server actions ──────────────────────────────────────────────────────────
  async function handleBan(reason: string) {
    'use server'
    await banUser(id, reason)
    revalidatePath(`/users/${id}`)
    revalidatePath('/users')
  }
  async function handleUnban() {
    'use server'
    await unbanUser(id)
    revalidatePath(`/users/${id}`)
    revalidatePath('/users')
  }
  async function handleVerify(verified: boolean) {
    'use server'
    await setUserVerification(id, verified)
    revalidatePath(`/users/${id}`)
  }
  async function handleChangeRole(role: string) {
    'use server'
    await changeUserRole(id, role)
    revalidatePath(`/users/${id}`)
    revalidatePath('/users')
  }
  async function handleToggleSuperhost(grant: boolean) {
    'use server'
    await toggleSuperhost(id, grant)
    revalidatePath(`/users/${id}`)
  }
  async function handleDelete() {
    'use server'
    await deleteUser(id)
    revalidatePath(`/users/${id}`)
    revalidatePath('/users')
  }

  return (
    <div className="max-w-6xl">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <Link href="/users" className="text-xs text-gray-400 hover:text-gray-700 inline-flex items-center gap-1 mb-3">
          ← All users
        </Link>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="shrink-0">
            {user.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profileImageUrl} alt="" className="h-16 w-16 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-900 flex items-center justify-center text-white text-xl font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                {user.role.replace('_', ' ')}
              </span>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_MAP[accountStatus].cls}`}>
                {STATUS_MAP[accountStatus].label}
              </span>
              {user.verificationStatus === 'verified' && (
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">✓ Verified</span>
              )}
              {user.hostProfile?.isSuperhost && (
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">⭐ Superhost</span>
              )}
              {isSelf && (
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">You</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}ID: <span className="font-mono">{user.id}</span>
            </p>
          </div>
        </div>

        {/* Ban reason notice */}
        {user.isBanned && user.bannedReason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <span className="text-red-500 shrink-0">⚠</span>
            <div>
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Ban reason</p>
              <p className="text-sm text-red-700 mt-0.5">{user.bannedReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className={`grid gap-4 mb-6 ${stats.host ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        <Stat
          label="Bookings (guest)"
          value={stats.guestBookings.count}
          sub={stats.guestBookings.count > 0 ? `${fmtCurrency(stats.guestBookings.totalSpent)} spent` : undefined}
        />
        <Stat
          label="Reviews given"
          value={stats.reviews.count}
          sub={stats.reviews.count > 0 ? `avg ${stats.reviews.avgRating} ★` : undefined}
        />
        {stats.host && (
          <>
            <Stat label="Total listings" value={stats.host.totalListings} sub={`${stats.host.activeListings} active`} />
            <Stat label="Superhost" value={user.hostProfile?.isSuperhost ? '⭐ Yes' : 'No'} />
          </>
        )}
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Account details */}
          <Section title="Account Details">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Clerk ID" value={<span className="font-mono text-xs">{user.clerkId}</span>} />
              <Field label="Verification" value={user.verificationStatus} />
              <Field label="Role" value={user.role.replace('_', ' ')} />
              <Field label="Status" value={accountStatus} />
              <Field label="Created" value={new Date(user.createdAt).toLocaleString('en-IN')} />
              <Field label="Updated" value={new Date(user.updatedAt).toLocaleString('en-IN')} />
              {user.deletedAt && <Field label="Deleted at" value={new Date(user.deletedAt).toLocaleString('en-IN')} />}
            </dl>
          </Section>

          {/* Host profile */}
          {user.hostProfile && (
            <Section title="Host Profile">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Response rate" value={`${user.hostProfile.responseRate.toFixed(0)}%`} />
                <Field label="Avg response time" value={`${user.hostProfile.avgResponseTimeHours}h`} />
                <Field label="Cancellations" value={user.hostProfile.hostCancellationCount} />
                <Field label="Response window" value={`${user.hostProfile.responseWindowHours}h`} />
                <Field label="Superhost granted" value={user.hostProfile.superhostGrantedAt ? new Date(user.hostProfile.superhostGrantedAt).toLocaleDateString('en-IN') : '—'} />
                {user.hostProfile.bio && (
                  <div className="col-span-2">
                    <Field label="Bio" value={user.hostProfile.bio} />
                  </div>
                )}
              </dl>
            </Section>
          )}

          {/* Host application */}
          {user.hostApplications.length > 0 && (
            <Section title="Host Application">
              {(() => {
                const app = user.hostApplications[0]
                const appBadge: Record<string, string> = {
                  in_progress:   'bg-gray-100 text-gray-600',
                  submitted:     'bg-yellow-100 text-yellow-700',
                  approved:      'bg-green-100 text-green-700',
                  auto_approved: 'bg-green-100 text-green-700',
                  rejected:      'bg-red-100 text-red-700',
                }
                return (
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <dt className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Status</dt>
                      <dd>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${appBadge[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </dd>
                    </div>
                    <Field label="Submitted" value={app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-IN') : 'Not submitted'} />
                    {app.rejectionReason && (
                      <div className="col-span-2">
                        <Field label="Rejection reason" value={app.rejectionReason} />
                      </div>
                    )}
                  </dl>
                )
              })()}
            </Section>
          )}

          {/* Recent bookings (as guest) */}
          <Section title={`Recent Bookings as Guest (${recentBookings.length})`}>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No bookings yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentBookings.map((b) => (
                  <div key={b.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.listing.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(b.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} →{' '}
                        {new Date(b.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{b.nights} nights
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-900">{fmtCurrency(b.totalAmount, b.currency)}</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${BOOKING_STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Recent listings (as host) */}
          {recentListings.length > 0 && (
            <Section title={`Recent Listings (${recentListings.length})`}>
              <div className="divide-y divide-gray-100">
                {recentListings.map((l) => (
                  <div key={l.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={`/listings/${l.id}`} className="text-sm font-medium text-gray-900 hover:underline truncate block">
                        {l.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmtCurrency(l.basePrice, l.currency)} / night
                        {Number(l.avgRating) > 0 && ` · ${Number(l.avgRating).toFixed(1)} ★`}
                      </p>
                    </div>
                    <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${LISTING_STATUS_BADGE[l.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right column (1/3) — sticky actions */}
        <div className="space-y-4">
          <UserActions
            userId={user.id}
            isBanned={user.isBanned}
            bannedReason={user.bannedReason}
            isDeleted={!!user.deletedAt}
            verificationStatus={user.verificationStatus}
            role={user.role}
            isSuperhost={user.hostProfile?.isSuperhost ?? false}
            hasHostProfile={!!user.hostProfile}
            isSelf={isSelf}
            onBan={handleBan}
            onUnban={handleUnban}
            onVerify={handleVerify}
            onChangeRole={handleChangeRole}
            onToggleSuperhost={handleToggleSuperhost}
            onDelete={handleDelete}
          />

          {/* Quick info card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Platform Notes</h2>
            </div>
            <div className="px-5 py-4 space-y-3 text-xs text-gray-500">
              <p>• Role changes sync to Clerk immediately — the user's JWT will reflect the new role on next sign-in.</p>
              <p>• Ban does not revoke active sessions. For immediate lockout, revoke the session in Clerk dashboard.</p>
              <p>• Soft delete preserves all data for compliance. Hard delete requires DB-level action.</p>
              {user.hostProfile && (
                <p>• This user has active listings. Review them before taking drastic actions.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
