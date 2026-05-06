/**
 * Public entrypoint of the aivoy tool integration.
 *
 * Mount in app.ts:
 *   import { aivoyRouter } from './aivoy/index.js'
 *   v1.route('/aivoy', aivoyRouter)
 *
 * That gives you:
 *   GET  /api/v1/aivoy                  → introspection (tool list, secret status)
 *   POST /api/v1/aivoy/tools/:name      → the dispatcher every aivoy tool calls
 */

export { aivoyRouter } from './router.js'
export { defineAivoyTool, getTool, listTools } from './registry.js'
export type { AivoyToolContext, AivoyServices } from './context.js'
export type { AivoyToolDefinition, AivoyWebhookPayload } from './types.js'
export type { AivoyListingCard } from './card-formatters.js'
