# `aivoy/` — Casalux ⇄ aivoy tool integration

Self-contained module that handles every webhook the aivoy concierge sends to
us. Tools are declarative; adding one is a single new file plus one line in
`tools/index.ts`.

## How it fits

```
aivoy cloud (api.aivoy.dev)
   │  POST {tool, args, tenantId, tokenId}
   │  X-Aivoy-Signature: t=<unix>,v1=<hmac-sha256>     ← signed with tenant secret
   ▼
api.casalux.com /api/v1/aivoy/tools/:name              ← single dispatcher
   │  verify HMAC against AIVOY_WEBHOOK_SECRET         ← ONE env var, all tools
   │  validate args against tool's zod schema
   │  invoke handler with {services, user, source}
   ▼
JSON ← what the LLM sees / what aivoy renders as a card
```

## Layout

```
aivoy/
├── README.md              ← this file
├── index.ts               ← public exports (one for app.ts)
├── router.ts              ← single Hono dispatcher
├── registry.ts            ← `defineAivoyTool` + lookup
├── types.ts               ← tool definition shape, webhook payload
├── verify.ts              ← HMAC signature middleware
├── context.ts             ← per-request DI (services, user, source)
├── card-formatters.ts     ← domain model → card schema
└── tools/
    ├── index.ts                  ← side-effecting registry import
    ├── search-listings.ts
    ├── get-listing-details.ts
    └── get-destination-guide.ts
```

## Adding a new tool

Three steps. Total ~15 lines.

1. **Create the file** `tools/your-tool.ts`:

   ```ts
   import { z } from 'zod'
   import { defineAivoyTool } from '../registry.js'

   const Schema = z.object({
     someArg: z.string(),
   })

   export const yourTool = defineAivoyTool({
     name: 'yourTool',
     description: 'When the LLM should use this. Be specific.',
     schema: Schema,
     // renderAs: 'listingCards',         // optional — turns result into cards
     // requiresUser: true,                // optional — guards on auth pass-through
     handler: async (args, ctx) => {
       // call ctx.services.* and return JSON
       return { hello: args.someArg }
     },
   })
   ```

2. **Register it** by adding one line to `tools/index.ts`:

   ```ts
   export { yourTool } from './your-tool.js'
   ```

3. **In the aivoy dashboard**:
   - Tools → Add tool → name `yourTool`, paste the same description, paste the
     JSON Schema (zod doesn't translate verbatim — `z.object({...})` →
     `{"type":"object","properties":{...}}`).
   - Webhook URL: `https://api.casalux.com/api/v1/aivoy/tools/yourTool`

That's it. Adding new tools requires **no new env vars** — the existing
`AIVOY_WEBHOOK_SECRET` signs every tool's webhook. Restart the API and the
new tool is live.

## Environment variables

ONE secret signs every webhook. Copy it from the aivoy dashboard's
"Webhook signing secret" panel on the Tools page (visible once, with a
rotate button):

```bash
AIVOY_WEBHOOK_SECRET=whsec_…
```

`GET /api/v1/aivoy` returns the registered tool list and whether the secret
is configured — useful for quickly spotting missing env in a deploy.

## Adding a new service to the context

When a tool needs something `ListingService` doesn't have, expose it through
`context.ts` rather than importing it inside the handler:

```ts
// context.ts
import { BookingService } from '../services/booking.service.js'

export interface AivoyServices {
  listings: ListingService
  bookings: BookingService          // NEW
}

const bookingService = new BookingService(/* deps from ../container.js */)

export const aivoyServices: AivoyServices = {
  listings: listingService,
  bookings: bookingService,
}
```

Now every tool handler has `ctx.services.bookings.*` available.

## User-scoped tools (planned)

`requiresUser: true` is wired into the dispatcher today and short-circuits
with a 501. Once the aivoy cloud + standalone bundle implement the user-token
pass-through, the dispatcher will populate `ctx.user` from a verified Clerk
JWT, and these tools light up — the handler code doesn't change.

## HMAC verification details

- Header: `X-Aivoy-Signature: t=<unix>,v1=<hex>`
- Sign string: `${unix}.${rawBody}` (raw, before JSON parse)
- Algorithm: HMAC-SHA256
- Replay window: ±5 minutes
- Timing-safe compare via `node:crypto`'s `timingSafeEqual`

The signature scheme matches Stripe's webhook v1 format. Logic lives in
`verify.ts`; the dispatcher in `router.ts` pulls the secret per-tool.

## Failure modes

| Scenario | HTTP | Body |
|---|---|---|
| Tool name not registered in code | 404 | `{ "error": "unknown tool: X" }` |
| `AIVOY_WEBHOOK_SECRET` missing | 503 | `{ "error": "...not configured..." }` |
| Bad/expired signature | 401 | `{ "error": "X-Aivoy-Signature ..." }` |
| Body tool name doesn't match URL | 400 | `{ "error": "tool name mismatch" }` |
| Args fail zod validation | 400 | `{ "error": "invalid args for X: ..." }` |
| `requiresUser: true` w/ no user | 501 | `{ "error": "...not yet supported" }` |
| Handler throws | 500 | `{ "error": "<err.message>" }` |
