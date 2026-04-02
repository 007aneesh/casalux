import Link from 'next/link'
import { getAuditLogs } from '@/lib/api'

// ─── Human-readable action labels ─────────────────────────────────────────────
const ACTION_LABEL: Record<string, string> = {
  'booking.cancel_admin':        'Booking cancelled',
  'booking.refund_override':     'Refund overridden',
  'booking.payout_override':     'Payout overridden',
  'booking.dispute_flag':        'Booking flagged as disputed',
  'booking.dispute_resolve':     'Dispute resolved',
  'user.ban':                    'User banned',
  'user.unban':                  'User unbanned',
  'user.verified':               'User verified',
  'user.unverified':             'Verification removed',
  'user.role_change':            'Role changed',
  'user.superhost_grant':        'Superhost granted',
  'user.superhost_revoke':       'Superhost revoked',
  'user.soft_delete':            'Account deleted',
  'listing.flag':                'Listing flagged',
  'listing.status_change':       'Listing status changed',
}

// ─── Colour coding by entity type ─────────────────────────────────────────────
const ENTITY_BADGE: Record<string, string> = {
  booking: 'bg-blue-100 text-blue-700',
  user:    'bg-purple-100 text-purple-700',
  listing: 'bg-orange-100 text-orange-700',
}

// ─── Entity deep-link ─────────────────────────────────────────────────────────
function entityHref(type: string, id: string) {
  if (type === 'booking') return `/bookings/${id}`
  if (type === 'user')    return `/users/${id}`
  if (type === 'listing') return `/listings/${id}`
  return null
}

// ─── Filter options ───────────────────────────────────────────────────────────
const ENTITY_TYPES = ['', 'booking', 'user', 'listing']
const ACTION_PREFIXES = ['', 'booking', 'user', 'listing']

interface PageProps {
  searchParams: Promise<{
    page?:       string
    entityType?: string
    action?:     string
  }>
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function DiffBadge({ before, after }: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }) {
  if (!before && !after) return null

  const changes: { key: string; from: unknown; to: unknown }[] = []
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])

  for (const key of keys) {
    const from = before?.[key]
    const to   = after?.[key]
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes.push({ key, from, to })
    }
  }

  if (changes.length === 0) return null

  return (
    <div className="mt-2 space-y-1">
      {changes.map(({ key, from, to }) => (
        <div key={key} className="flex items-center gap-2 text-xs font-mono">
          <span className="text-gray-400">{key}:</span>
          {from !== undefined && (
            <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 line-through">
              {String(from)}
            </span>
          )}
          {from !== undefined && to !== undefined && <span className="text-gray-300">→</span>}
          {to !== undefined && (
            <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700">
              {String(to)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const { page: pageStr, entityType, action } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))

  let logs: Awaited<ReturnType<typeof getAuditLogs>>['logs'] = []
  let total = 0
  let limit = 50

  try {
    const res = await getAuditLogs({ page, entityType, action })
    logs  = res.logs
    total = res.total
    limit = res.limit
  } catch {}

  const totalPages = Math.ceil(total / limit)

  function buildHref(overrides: Record<string, string | number | undefined>) {
    const params = new URLSearchParams()
    const merged = { page, entityType, action, ...overrides }
    if (merged.page && merged.page !== 1) params.set('page', String(merged.page))
    if (merged.entityType) params.set('entityType', merged.entityType)
    if (merged.action)     params.set('action', merged.action)
    const qs = params.toString()
    return `/audit-log${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {total.toLocaleString()} event{total !== 1 ? 's' : ''} recorded
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Entity type filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</span>
          <div className="flex gap-1">
            {ENTITY_TYPES.map((et) => (
              <Link
                key={et || 'all'}
                href={buildHref({ entityType: et, page: 1 })}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  (entityType ?? '') === et
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {et || 'All'}
              </Link>
            ))}
          </div>
        </div>

        {/* Action filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</span>
          <div className="flex gap-1">
            {ACTION_PREFIXES.map((prefix) => (
              <Link
                key={prefix || 'all'}
                href={buildHref({ action: prefix, page: 1 })}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  (action ?? '') === prefix
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {prefix || 'All'}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Log table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {logs.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">
            No audit events found{entityType || action ? ' for these filters' : ''}.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => {
              const href    = entityHref(log.entityType, log.entityId)
              const label   = ACTION_LABEL[log.action] ?? log.action.replace(/\./g, ' › ')
              const entityBadge = ENTITY_BADGE[log.entityType] ?? 'bg-gray-100 text-gray-700'

              return (
                <div key={log.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: action + diff */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${entityBadge}`}>
                          {log.entityType}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                        {href ? (
                          <Link
                            href={href}
                            className="font-mono text-xs text-blue-600 hover:underline"
                          >
                            {log.entityId.slice(0, 8)}…
                          </Link>
                        ) : (
                          <span className="font-mono text-xs text-gray-400">
                            {log.entityId.slice(0, 8)}…
                          </span>
                        )}
                      </div>

                      {/* Diff view */}
                      <DiffBadge before={log.before} after={log.after} />

                      {/* Actor */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xs text-gray-400">by</span>
                        <Link
                          href={`/users/${log.actor.id}`}
                          className="text-xs font-medium text-gray-700 hover:underline"
                        >
                          {log.actor.firstName} {log.actor.lastName}
                        </Link>
                        <span className="text-xs text-gray-400">({log.actor.email})</span>
                      </div>
                    </div>

                    {/* Right: timestamp + meta */}
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium text-gray-600 whitespace-nowrap">{fmtDate(log.createdAt)}</p>
                      {log.ip && (
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{log.ip}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages} · {total.toLocaleString()} events
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: page - 1 })}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:border-gray-400 transition-colors"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ page: page + 1 })}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:border-gray-400 transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Note */}
      <p className="mt-4 text-xs text-gray-400">
        Audit events are append-only and cannot be deleted. Each entry captures the before/after state, actor identity, IP address, and timestamp.
      </p>
    </div>
  )
}
