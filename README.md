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

## Local Setup

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

Verify services are healthy:
```bash
docker compose -f infra/docker/docker-compose.yml ps
```

### 3. Configure environment variables

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```

Open each file and fill in the required values. At minimum for local dev:
- `DATABASE_URL` — already set to the Docker Postgres instance
- `REDIS_URL` — already set to the Docker Redis instance
- `CLERK_SECRET_KEY` — get from [clerk.com](https://clerk.com) dashboard
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — get from Clerk dashboard
- `CLOUDINARY_*` — get from [cloudinary.com](https://cloudinary.com) (free tier is fine)
- `STRIPE_SECRET_KEY` — get from [stripe.com](https://stripe.com) test mode

### 4. Generate Prisma client

```bash
pnpm --filter @casalux/db db:generate
```

### 5. Run database migrations

```bash
pnpm --filter @casalux/db db:migrate
```

### 6. Seed the database (amenities catalogue)

```bash
pnpm --filter @casalux/db db:seed
```

### 7. Start all apps in dev mode

```bash
pnpm dev
```

This runs all apps in parallel via Turbo:

| App | URL |
|-----|-----|
| API | http://localhost:3001 |
| Web | http://localhost:3000 |
| Admin | http://localhost:3002 |

Or start only the API:
```bash
pnpm --filter @casalux/api dev
```

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

# Prisma Studio (DB GUI)
pnpm --filter @casalux/db db:studio

# Open Kibana (Elasticsearch UI)
docker compose -f infra/docker/docker-compose.yml --profile kibana up -d
# → http://localhost:5601
```

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
