/**
 * Single Hono dispatcher for every aivoy tool.
 *
 *   POST /api/v1/aivoy/tools/:name        ← only public route in this module
 *
 * Despite the single in-code route, each tool is configured in the aivoy
 * dashboard with its own URL (just with the tool name in the path), giving
 * per-tool metrics and per-tool secrets without forcing N route registrations
 * here. Adding a tool = create a file in ./tools and export it from
 * ./tools/index.ts. No changes needed in this file.
 */

import { Hono } from 'hono'
import { getTool, listTools } from './registry.js'
import { aivoyServices, type AivoyToolContext } from './context.js'
import { lookupAivoySecret, verifyAivoySignature, AivoyVerifyError } from './verify.js'
import type { AivoyWebhookPayload } from './types.js'

// Force registration of every tool by importing the barrel — side effects
// register them with the registry on module load.
import './tools/index.js'

export const aivoyRouter = new Hono()

// Health / introspection — useful for quickly seeing what tools are wired.
// Returns names only, no secrets.
aivoyRouter.get('/', (c) => {
  const hasSecret = lookupAivoySecret() != null
  return c.json({
    hasSecret,
    tools: listTools().map((t) => ({
      name: t.name,
      description: t.description,
      renderAs: t.renderAs ?? null,
      requiresUser: t.requiresUser ?? false,
    })),
  })
})

aivoyRouter.post('/tools/:name', async (c) => {
  const name = c.req.param('name')
  const tool = getTool(name)
  if (!tool) {
    return c.json({ error: `unknown tool: ${name}` }, 404)
  }

  const secret = lookupAivoySecret()
  if (!secret) {
    console.warn('[aivoy] AIVOY_WEBHOOK_SECRET is not set on this server')
    return c.json(
      {
        error: 'aivoy is not configured on this server (missing AIVOY_WEBHOOK_SECRET)',
      },
      503,
    )
  }

  // We need the RAW body to verify the signature. Hono exposes it via .text();
  // we then parse to JSON ourselves.
  const rawBody = await c.req.text()

  try {
    verifyAivoySignature({
      header: c.req.header('x-aivoy-signature') ?? null,
      rawBody,
      secret,
    })
  } catch (e) {
    if (e instanceof AivoyVerifyError) {
      return c.json({ error: e.message }, e.status as 401 | 403)
    }
    throw e
  }

  let payload: AivoyWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return c.json({ error: 'invalid JSON body' }, 400)
  }

  // Defense in depth: the URL says one tool, the body says another. Refuse.
  if (payload.tool !== name) {
    return c.json(
      { error: `tool name in body (${payload.tool}) does not match URL (${name})` },
      400,
    )
  }

  // Validate args against the tool's zod schema.
  const parsed = tool.schema.safeParse(payload.args)
  if (!parsed.success) {
    return c.json(
      { error: `invalid args for ${name}: ${parsed.error.message}` },
      400,
    )
  }

  const ctx: AivoyToolContext = {
    services: aivoyServices,
    user: null, // populated once the aivoy user-token pass-through ships
    source: { tenantId: payload.tenantId, tokenId: payload.tokenId },
  }

  // `requiresUser: true` is a hard gate — for tools that MUST NOT run
  // without identity (e.g. write operations like `addToWishlist`). Tools
  // that simply *prefer* a user but degrade gracefully (e.g.
  // `recommendBasedOnHistory`) leave it false and check `ctx.user` inside
  // the handler.
  if (tool.requiresUser && !ctx.user) {
    return c.json(
      { error: `tool "${name}" requires an authenticated user` },
      401,
    )
  }

  try {
    const result = await tool.handler(parsed.data, ctx)
    return c.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[aivoy] tool "${name}" handler threw:`, msg)
    return c.json({ error: msg }, 500)
  }
})
