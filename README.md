# CasaLux

Luxury short-term rental platform — Next.js web app, Hono API, React Native mobile app. Turborepo monorepo with pnpm workspaces.

> **This repo uses [pnpm](https://pnpm.io) workspaces. Running `npm install` or `yarn` will fail** with `Unsupported URL Type "workspace:"`. You must use `pnpm install`.

## Repo Structure

```
casalux/
├── apps/
│   ├── api/        Hono backend (Node 20, port 3001)
│   ├── web/        Next.js 14 guest + host frontend (port 3000)
│   ├── admin/      Next.js admin dashboard (port 3002)
│   └── mobile/     React Native / Expo
├── packages/
│   ├── types/      Shared TypeScript types + Zod schemas
│   ├── utils/      Pure functions: pricing, date, currency
│   ├── db/         Prisma client + schema + migrations
│   ├── auth/       Clerk JWT middleware + RBAC guards
│   ├── ui/         Shared React component library
│   ├── config/     Shared ESLint / Tailwind / TS configs
│   └── services/
│       ├── cache/      Redis wrapper (CacheService + CacheKeys)
│       ├── queue/      BullMQ wrapper (QueueService + QUEUES)
│       ├── storage/    IStorageService + CloudinaryAdapter
│       ├── payment/    IPaymentService + StripeAdapter
│       ├── search/     ISearchService + ElasticsearchAdapter
│       └── email/      IEmailService + ResendAdapter
└── infra/
    ├── docker/     docker-compose (Postgres, Redis, Elasticsearch)
    └── ci/         GitHub Actions workflow
```

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20 | [nodejs.org](https://nodejs.org) or `nvm install 20` |
| pnpm | ≥ 9 | `npm install -g pnpm@9` |
| Docker Desktop | latest | [docker.com](https://www.docker.com/products/docker-desktop) |

---

## First-Time Setup

Follow these steps once when you clone the repo.

### 1. Clone and install dependencies

```bash
git clone <repo-url> casalux
cd casalux
pnpm install
```

### 2. Start infrastructure (Postgres, Redis, Elasticsearch)

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

Verify all services are healthy before continuing:

```bash
docker compose -f infra/docker/docker-compose.yml ps
```

### 3. Configure environment variables

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```

Open each file and fill in the required values. At minimum for local dev:

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | Pre-filled — points to the Docker Postgres instance |
| `REDIS_URL` | Pre-filled — points to the Docker Redis instance |
| `CLERK_SECRET_KEY` | [clerk.com](https://clerk.com) dashboard |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard |
| `CLOUDINARY_*` | [cloudinary.com](https://cloudinary.com) (free tier is fine) |
| `STRIPE_SECRET_KEY` | [stripe.com](https://stripe.com) — use test mode keys |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` (already set in example) |

### 4. Generate Prisma client

> **This step is required before running the API for the first time.** Skipping it causes a `SyntaxError: The requested module '@prisma/client' does not provide an export named 'Prisma'` error.

```bash
pnpm --filter @casalux/db db:generate
```

### 5. Run database migrations

```bash
pnpm --filter @casalux/db db:migrate
```

### 6. Seed the database

```bash
pnpm --filter @casalux/db db:seed
```

### 7. Sync listings into Elasticsearch

> **Required before search/listings APIs will work.** The API auto-creates the index on startup, but it starts empty. This script pushes all active listings from Postgres into ES.

```bash
pnpm --filter @casalux/api es:sync
```

### 8. Start all apps in dev mode

```bash
pnpm dev
```

This runs all apps in parallel via Turbo:

| App | URL |
|-----|-----|
| API | http://localhost:3001 |
| Web | http://localhost:3000 |
| Admin | http://localhost:3002 |

---

## Regular Dev (Daily Workflow)

Once the first-time setup is done, your daily workflow is:

```bash
# 1. Make sure Docker services are running
docker compose -f infra/docker/docker-compose.yml up -d

# 2. Start all apps
pnpm dev
```

If you pulled changes that include new Prisma migrations, run these before starting:

```bash
pnpm --filter @casalux/db db:migrate
```

If you pulled changes that include schema changes (new models/fields), also regenerate the client:

```bash
pnpm --filter @casalux/db db:generate
```

### Running a single app

```bash
# API only
pnpm --filter @casalux/api dev

# Web only
pnpm --filter @casalux/web dev

# Admin only
pnpm --filter @casalux/admin dev
```

---

## Key Commands

```bash
# Type-check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Run all tests
pnpm test

# Production build
pnpm build

# Prisma Studio (visual DB GUI)
pnpm --filter @casalux/db db:studio

# Open Kibana (Elasticsearch UI)
docker compose -f infra/docker/docker-compose.yml --profile kibana up -d
# → http://localhost:5601

# Clean everything (node_modules + build artifacts)
pnpm clean
```

---

## TypeScript Module Resolution

The monorepo uses `moduleResolution: "Bundler"` (TS 5.0+) across all packages:
- **Dev / editor** — all apps resolve workspace packages via explicit `paths` in their `tsconfig.json`
- **Production API build** — `apps/api/tsconfig.build.json` overrides to `NodeNext` for a proper Node.js ESM output

When you add a new workspace package, add it to the `paths` in every `apps/*/tsconfig.json` that uses it.

## Swapping a Provider

All external providers are bound in exactly one file: `apps/api/src/container.ts`.

To swap Stripe for Razorpay, change two lines there:
```ts
// Before
import { StripeAdapter } from '@casalux/services-payment'
export const paymentService = new StripeAdapter({ ... })

// After
import { RazorpayAdapter } from '@casalux/services-payment'
export const paymentService = new RazorpayAdapter({ ... })
```

No business logic changes needed anywhere else.

## Environment Variables Reference

See [`.env.example`](./.env.example) for the full list with descriptions.
