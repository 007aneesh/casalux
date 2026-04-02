# Deployment Guide

## Architecture

```
Browser → Vercel (web)          casalux.com
Browser → Vercel (admin)        admin.casalux.com
Web/Admin → Vercel (API)        api.casalux.com
Fly.io (workers)                background jobs only — no public traffic
API → Neon (Postgres)
API → Upstash (Redis)
API → Elastic Cloud / Bonsai (Search)
API → Cloudinary (Images)
API → Resend (Email)
API → Stripe (Payments)
API → Clerk (Auth)
```

**All three apps deploy to Vercel (free).** The only thing that needs a persistent VM is the
BullMQ background workers (search indexing + payment events). Those run on **Fly.io free tier**
(1 shared-cpu VM, 256 MB — permanently free).

---

## Step 1 — External services (get credentials first)

| Service | What for | Free tier |
|---|---|---|
| [Neon](https://neon.tech) | Postgres database | Yes (0.5 GB) |
| [Upstash](https://upstash.com) | Redis (cache + BullMQ queues) | Yes (10k req/day) |
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

In Vercel → Project → Settings → Environment Variables, add everything from `apps/api/.env.example`:

```
NODE_ENV=production
CORS_ORIGINS=https://casalux.com,https://admin.casalux.com
DATABASE_URL=<neon connection string>
REDIS_URL=<upstash redis url>
ELASTICSEARCH_URL=<bonsai or elastic cloud url>
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

After first deploy, use the [Vercel CLI](https://vercel.com/docs/cli) or Neon dashboard to run:

```bash
# Option A — run locally, pointing at production DB
DATABASE_URL=<neon url> pnpm --filter @casalux/db exec prisma migrate deploy

# Option B — Vercel CLI one-off function invocation
# Add a temporary /migrate route or use the Neon SQL editor to run migrations
```

### 2d. Set custom domain

Vercel → Project → Settings → Domains → Add → `api.casalux.com`

### 2e. Configure Stripe webhook

Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://api.casalux.com/api/v1/webhooks/stripe`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET` in Vercel

### 2f. Configure Clerk webhook

Clerk Dashboard → Webhooks → Add endpoint:
- URL: `https://api.casalux.com/api/v1/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`
- Copy the **Signing secret** → set as `CLERK_WEBHOOK_SECRET` in Vercel

---

## Step 3 — Deploy background workers (Fly.io)

BullMQ workers need a persistent process — they can't run on Vercel serverless.
Fly.io free tier gives 3 always-on VMs. We use 1 for the workers.

### 3a. Install Fly CLI

```bash
brew install flyctl       # macOS
# or: curl -L https://fly.io/install.sh | sh
```

### 3b. Sign up and create the app

```bash
fly auth signup           # or: fly auth login
fly apps create casalux-workers --org personal
```

### 3c. Set secrets (env vars)

```bash
cd apps/api

fly secrets set \
  NODE_ENV=production \
  DATABASE_URL="<neon url>" \
  REDIS_URL="<upstash url>" \
  ELASTICSEARCH_URL="<bonsai url>" \
  CLERK_SECRET_KEY="sk_live_..." \
  STRIPE_SECRET_KEY="sk_live_..." \
  CLOUDINARY_CLOUD_NAME="..." \
  CLOUDINARY_API_KEY="..." \
  CLOUDINARY_API_SECRET="..." \
  RESEND_API_KEY="re_..." \
  --config fly.toml
```

### 3d. Deploy workers

From the **repo root** (Dockerfile.workers needs the full monorepo context):

```bash
fly deploy \
  --config apps/api/fly.toml \
  --dockerfile apps/api/Dockerfile.workers \
  --build-context .
```

The worker process starts and stays alive. It processes:
- **search-indexing queue** — indexes new/updated listings in Elasticsearch
- **payment-events queue** — handles Stripe webhook events (payment succeeded/failed)

### 3e. Verify workers are running

```bash
fly logs --config apps/api/fly.toml
# Should show:
# 🔧 CasaLux Workers starting...
# ✅ Workers running — search indexing + payment events
```

---

## Step 4 — Deploy the web app (Vercel)

### 4a. Import project

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select this repo
3. **Root Directory**: `apps/web`
4. **Framework Preset**: Next.js
5. **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @casalux/web build`

### 4b. Set environment variables

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

### 4c. Set custom domain

Vercel → Project → Settings → Domains → Add → `casalux.com`

### 4d. Set Clerk production URLs

Clerk Dashboard → your application → Domains → Add `casalux.com` as a production domain.

---

## Step 5 — Deploy the admin app (Vercel)

Same as Step 4 but:

1. **Root Directory**: `apps/admin`
2. **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @casalux/admin build`
3. Environment variables from `apps/admin/.env.example`:

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

## Step 6 — Verify everything

| Check | How |
|---|---|
| API health | `curl https://api.casalux.com/health` → `{"status":"ok"}` |
| API docs | Open `https://api.casalux.com/docs` |
| Web | `https://casalux.com` loads |
| Admin | `https://admin.casalux.com` loads, sign in as admin |
| Workers | `fly logs --config apps/api/fly.toml` — no errors |
| Migrations | Neon dashboard → Tables → all tables present |
| Stripe | Make a test booking, check Stripe Dashboard → Events |
| Search | Create a listing, search for it — results appear |

---

## Updating

### API change (routes/controllers/services)
Push to `main` → Vercel auto-deploys the API function.

### Workers change (workers/search-indexing.worker.ts etc.)
```bash
fly deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile.workers --build-context .
```

### Web / Admin change
Push to `main` → Vercel auto-deploys.

### Schema change (new migration)
```bash
# Run after Vercel deploys the new API code:
DATABASE_URL=<neon url> pnpm --filter @casalux/db exec prisma migrate deploy
```

---

## Cost estimate (all free)

| Service | Plan | $/mo |
|---|---|---|
| Vercel (API) | Hobby | **Free** |
| Vercel (web) | Hobby | **Free** |
| Vercel (admin) | Hobby | **Free** |
| Fly.io (workers) | Free tier (3 VMs) | **Free** |
| Neon (Postgres) | Free | **Free** |
| Upstash (Redis) | Free | **Free** |
| Bonsai (Elasticsearch) | Sandbox | **Free** |
| Clerk | Free | **Free** |
| Cloudinary | Free | **Free** |
| Resend | Free | **Free** |
| Stripe | Pay per transaction | 2.9% + 30¢ |
| **Total fixed cost** | | **$0/mo** |

For production scale: upgrade Neon ($19/mo), Upstash Pay-as-you-go (~$0.2/100k req), Bonsai Staging ($10/mo).
