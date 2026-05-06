/**
 * HMAC verification for incoming aivoy webhook calls.
 *
 * Signature scheme (mirror of what the aivoy cloud emits):
 *   header  = X-Aivoy-Signature: t={unixSeconds},v1={hexHmacSha256}
 *   message = `${unixSeconds}.${rawBody}`
 *   key     = the tenant's signing secret, shown ONCE in the aivoy dashboard
 *             (Tools page → Webhook signing secret panel)
 *
 * Stored in a single env var: AIVOY_WEBHOOK_SECRET. One secret signs every
 * tool — adding a new tool requires zero new env vars.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

const MAX_TIMESTAMP_SKEW_S = 300 // ±5 min — replays older than this are rejected
const SIG_RE = /^t=(\d+),v1=([0-9a-f]+)$/

export class AivoyVerifyError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'AivoyVerifyError'
  }
}

export function lookupAivoySecret(): string | null {
  const v = process.env['AIVOY_WEBHOOK_SECRET']
  return v && v.length > 0 ? v : null
}

/**
 * Verifies the X-Aivoy-Signature header. Throws AivoyVerifyError with the
 * correct HTTP status on any failure; caller should map to a JSON response.
 */
export function verifyAivoySignature(args: {
  header: string | null
  rawBody: string
  secret: string
}): void {
  const { header, rawBody, secret } = args
  if (!header) throw new AivoyVerifyError(401, 'missing X-Aivoy-Signature')

  const m = SIG_RE.exec(header.trim())
  if (!m) throw new AivoyVerifyError(401, 'malformed X-Aivoy-Signature')
  // The regex captured both groups (it matched), but TS doesn't narrow tuple
  // elements through the !m guard. Index-and-assert is clearer than reshaping.
  const ts = m[1]!
  const sig = m[2]!

  // Replay guard. Must come BEFORE the constant-time compare so an attacker
  // can't waste CPU rapidly with stale replays.
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - Number(ts)) > MAX_TIMESTAMP_SKEW_S) {
    throw new AivoyVerifyError(401, 'X-Aivoy-Signature timestamp out of window')
  }

  const expected = createHmac('sha256', secret)
    .update(`${ts}.${rawBody}`)
    .digest('hex')

  if (sig.length !== expected.length) {
    throw new AivoyVerifyError(401, 'X-Aivoy-Signature mismatch')
  }
  const sigBuf = Buffer.from(sig, 'utf8')
  const expBuf = Buffer.from(expected, 'utf8')
  if (!timingSafeEqual(sigBuf, expBuf)) {
    throw new AivoyVerifyError(401, 'X-Aivoy-Signature mismatch')
  }
}
