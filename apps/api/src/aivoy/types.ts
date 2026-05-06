/**
 * aivoy tool integration — type definitions.
 *
 * Adding a new tool: see ./tools/search-listings.ts for the canonical example,
 * and ./README.md for the full walkthrough.
 */

import type { z, ZodTypeAny } from 'zod'
import type { AivoyToolContext } from './context.js'

/**
 * Definition of one tool. Generic over the schema so the handler receives
 * fully-inferred args without any explicit type annotation. Defaults,
 * optionals, and refinements all flow through naturally.
 */
export interface AivoyToolDefinition<
  TSchema extends ZodTypeAny = ZodTypeAny,
  TResult = unknown,
> {
  /** Identifier the LLM uses. Must match the `name` registered in the aivoy dashboard. */
  name: string

  /** Shown to the LLM. Be specific about *when* to call it. */
  description: string

  /** zod schema for `args`. Validated before the handler runs. */
  schema: TSchema

  /** What the handler returns will be JSON-serialised for the LLM. */
  handler: (args: z.infer<TSchema>, ctx: AivoyToolContext) => Promise<TResult>

  /**
   * If set, aivoy renders the handler's return value as this card type instead
   * of summarising it as text. Built-ins: 'listingCards', 'productCards', 'link'.
   */
  renderAs?: string

  /**
   * If true, the handler will only run when an authenticated user is attached
   * to the context. Tools that read/write user-specific data set this; public
   * catalog tools leave it false.
   *
   * Has no effect today (no user pass-through yet) — included so user-scoped
   * tools can be authored now and start working the day pass-through ships.
   */
  requiresUser?: boolean
}

/**
 * Body shape aivoy POSTs. Matches the cloud's outgoing wire format —
 * see apps/cloud/lib/chat/webhookTool.ts in the aivoy repo.
 */
export interface AivoyWebhookPayload {
  tool: string
  args: unknown
  tenantId: string
  tokenId: string
}
