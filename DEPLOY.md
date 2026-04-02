# Deployment Guide

## Architecture

```
Browser → Vercel (web)          casalux.com
Browser → Vercel (admin)        admin.casalux.com
Web/Admin → Vercel (API)        api.casalux.com
API → Neon (Postgres)
API → Upstash (Redis)           caching only
API → Bonsai (Search)
API → Cloudinary (Images)
API → Resend (Email)
API → Stripe (Payments)
API → Clerk (Auth)
```

**All three apps deploy to Vercel. Zero separate servers.** Background jobs (search indexing,
payment events) are processed inline — payment events run synchronously in the Stripe webhook
handler (Stripe retries on failure), and search indexing runs inline when listings change.

---

## Step 1 — External services (get credentials first)

| Service | What for | Free tier |
|---|---|---|
| [Neon](https://neon.tech) | Postgres database | Yes (0.5 GB) |
| [Upstash](https://upstash.com) | Redis cache + email queue | Yes (10k req/day) |
| [Bonsai](https://bonsai.io) | Elasticsearch (listing search) | Free Sandbox tier |
| [Clerk](https://clerk.com) | Auth | Free (10k MAU) |
| [Stripe](https://stripe.com) | Payments | Free (2.9% + 30¢ per txn) |
| [Cloudinary](https://cloudinary.com) | Image storage/CDN | Free (25 GB) |
| [Resend](https://resend.com) | Transactional email | Free (3k/mo) |

---

## Step 2 — Deploy the API (Vercel)

The Hono API runs as a single Vercel serverless function.
`apps/api/api/index.ts` exports `app.fetch` as the default handler.
`apps/api/vercel.json` rewrites all traffic to that function.

### 2a. Import project in Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select this repo
3. **Root Directory**: `apps/api`
4. **Framework Preset**: Other
5. **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @casalux/api... build`
6. **Output Directory**: leave blank (Vercel auto-detects `api/` functions)

> The build command installs from the monorepo root so all workspace packages
> (`@casalux/db`, `@casalux/auth`, etc.) are available.

### 2b. Set environment variables

In Vercel → Project → Settings → Environment Variables:

```
NODE_ENV=production
CORS_ORIGINS=https://casalux.com,https://admin.casalux.com
DATABASE_URL=<neon connection string>
REDIS_URL=<upstash redis url>
ELASTICSEARCH_URL=<bonsai url>
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API_KEY=re_...
GOOGLE_MAPS_API_KEY=AIza...
AUTO_APPROVE_HOSTS=false
PLATFORM_SERVICE_FEE_PERCENT=12
```

### 2c. Run database migrations

```bash
# Run locally pointing at the production DB:
DATABASE_URL=<neon url> pnpm --filter @casalux/db exec prisma migrate deploy
```

Or use the Neon SQL editor to run migrations directly.

### 2d. Set custom domain

Vercel → Project → Settings → Domains → Add → `api.casalux.com`

### 2e. Configure Stripe webhook

Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://api.casalux.com/api/v1/webhooks/payment`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET` in Vercel

### 2f. Configure Clerk webhook

Clerk Dashboard → Webhooks → Add endpoint:
- URL: `https://api.casalux.com/api/v1/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`
- Copy the **Signing secret** → set as `CLERK_WEBHOOK_SECRET` in Vercel

---

## Step 3 — Deploy the web app (Vercel)

### 3a. Import project

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select this repo
3. **Root Directory**: `apps/web`
4. **Framework Preset**: Next.js
5. **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @casalux/web build`

### 3b. Set environment variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_API_URL=https://api.casalux.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 3c. Set custom domain

Vercel → Project → Settings → Domains → Add → `casalux.com`

---

## Step 4 — Deploy the admin app (Vercel)

Same as Step 3 but:

1. **Root Directory**: `apps/admin`
2. **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @casalux/admin build`
3. Environment variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...   # same key as web
CLERK_SECRET_KEY=sk_live_...                    # same key as web
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_API_URL=https://api.casalux.com
```

4. **Custom domain**: `admin.casalux.com`

**Important:** Admins must have `role: admin` in their Clerk `publicMetadata`.
Set this in Clerk Dashboard → Users → select user → Metadata → Public → `{ "role": "admin" }`.

---

## Step 5 — Verify

| Check | How |
|---|---|
| API health | `curl https://api.casalux.com/health` → `{"status":"ok"}` |
| API docs | Open `https://api.casalux.com/docs` |
| Web | `https://casalux.com` loads |
| Admin | `https://admin.casalux.com` loads, sign in as admin |
| Migrations | Neon dashboard → Tables — all tables present |
| Stripe | Make a test booking, check Stripe Dashboard → Events — webhook shows 200 |
| Search | Create a listing, search for it — appears in results |

---

## Updating

### Any code change
Push to `main` → Vercel auto-deploys all three projects.

### Schema change (new migration)
```bash
DATABASE_URL=<neon url> pnpm --filter @casalux/db exec prisma migrate deploy
```

---

## Cost estimate (all free)

| Service | Plan | $/mo |
|---|---|---|
| Vercel (API) | Hobby | **Free** |
| Vercel (web) | Hobby | **Free** |
| Vercel (admin) | Hobby | **Free** |
| Neon (Postgres) | Free | **Free** |
| Upstash (Redis) | Free | **Free** |
| Bonsai (Elasticsearch) | Sandbox | **Free** |
| Clerk | Free | **Free** |
| Cloudinary | Free | **Free** |
| Resend | Free | **Free** |
| Stripe | Pay per transaction | 2.9% + 30¢ |
| **Total fixed cost** | | **$0/mo** |

For production scale: upgrade Neon ($19/mo), Upstash Pay-as-you-go, Bonsai Staging ($10/mo).
