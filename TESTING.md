# CasaLux API — Local Testing Guide

## 1. Start infrastructure

```bash
cd infra/docker
docker compose up -d
```

Wait for all services to be healthy (~30 seconds). Verify:
```bash
docker compose ps        # all 3 services = healthy
curl localhost:5432       # postgres
curl localhost:6379       # redis (use redis-cli ping)
curl localhost:9200       # elasticsearch
```

---

## 2. Generate Prisma client + run migrations

```bash
# From repo root
pnpm db:generate    # generates the Prisma client
pnpm db:migrate     # applies schema to postgres
```

> First run will create all tables. Subsequent runs only apply new migrations.

---

## 3. Set Clerk IDs for seed data

After signing up 3 test accounts (guest, host, admin) in your app or at dashboard.clerk.com:

```bash
# In .env
SEED_GUEST_CLERK_ID=user_2xxxxxxxxxxxxx
SEED_HOST_CLERK_ID=user_2yyyyyyyyyyyyy
SEED_ADMIN_CLERK_ID=user_2zzzzzzzzzzzzz
```

Also set the host role in Clerk dashboard:
- Open Clerk Dashboard → Users → host user → Public metadata
- Set: `{ "role": "host" }`

Or skip all of this by setting `AUTO_APPROVE_HOSTS=true` in `.env` — the onboarding
submit step will auto-promote any user to host without admin approval.

---

## 4. Seed the database

```bash
pnpm db:seed
```

This creates:
- **4 listings** — Goa beach villa, Mumbai studio, Manali cabin, Jaipur haveli
- **2 bookings** — one completed (for review testing), one confirmed (for cancellation)
- **1 review** — 5★ on the Goa villa with host response already set
- **1 wishlist** — guest's "Goa Trip 🏖️" with 2 listings
- **1 message thread** — 3 messages between guest and host about the Mumbai booking

---

## 5. Start the API

```bash
# From repo root
pnpm dev
# or just the API:
cd apps/api && npx tsx watch src/index.ts
```

API runs on `http://localhost:3001`

---

## 6. Open Swagger UI

```
http://localhost:3001/docs
```

Click **Authorize** (top right) → paste a Clerk JWT → **Authorize**.

To get a JWT from the browser after signing in to the app:
```javascript
// In browser console (on your Next.js app)
const token = await window.Clerk.session.getToken()
console.log(token)
```

---

## 7. Test flows (in order)

### A. Public — no auth needed

| Test | Endpoint |
|------|----------|
| Browse listings | `GET /listings` |
| Filter by city | `GET /listings?city=Goa` |
| Filter instant book | `GET /listings?instantBook=true` |
| Listing detail | `GET /listings/seed-listing-goa-villa` |
| Reviews for listing | `GET /listings/seed-listing-goa-villa/reviews` |
| Pricing preview | `GET /listings/seed-listing-goa-villa/pricing-preview?checkIn=2025-12-24&checkOut=2025-12-28&guests=2` |
| Location autocomplete | `GET /locations/autocomplete?q=Goa` |
| Location autocomplete | `GET /locations/autocomplete?q=Mum` |

---

### B. Guest flows — auth required (sign in as guest)

**Wishlists**
1. `GET /users/me/wishlists` — see the seeded "Goa Trip" wishlist
2. `POST /users/me/wishlists` `{ "name": "Manali Winter" }`
3. `POST /users/me/wishlists/{id}/listings` `{ "listingId": "seed-listing-manali-cabin" }`
4. `POST /listings/seed-listing-manali-cabin/save` — quick-save via heart button
5. `GET /users/me/wishlists/check/seed-listing-goa-villa` — check if saved

**Messaging**
1. `GET /messages/threads` — see the seeded thread
2. `GET /messages/threads/seed-thread-1`
3. `GET /messages/threads/seed-thread-1/messages`
4. `POST /messages/threads/seed-thread-1/messages` `{ "body": "Test reply from Swagger" }`
5. `PATCH /messages/threads/seed-thread-1/read`
6. `GET /messages/unread-count`

**Bookings**
1. `GET /users/me/bookings` — see both seeded bookings
2. `GET /bookings/seed-booking-confirmed`
3. `GET /bookings/seed-booking-confirmed/status`
4. `GET /bookings/seed-booking-confirmed/cancellation-preview`
5. `POST /bookings/initiate` — **new booking** (need Stripe test card):
   ```json
   {
     "listingId": "seed-listing-mumbai-apt",
     "checkIn": "2026-02-10",
     "checkOut": "2026-02-13",
     "guests": 1
   }
   ```

**Reviews**
1. `GET /users/me/reviews` — see the seeded review
2. Write a new review on the completed booking:
   `POST /bookings/seed-booking-completed/review`
   > Should return 409 — already reviewed (seeded). Test with a new completed booking.

**Search history**
1. `POST /search/history` `{ "query": "Goa beach", "location": "Goa", "resultCount": 4 }`
2. `GET /users/me/search-history`
3. `DELETE /users/me/search-history/{id}` — delete one entry
4. `DELETE /users/me/search-history` — clear all

---

### C. Host onboarding — auth required (sign in as any user)

Walk through all 8 steps:

```
POST /host/onboarding/start
→ copy sessionId from response

PATCH /host/onboarding/{sessionId}/space
{
  "propertyType": "apartment",
  "roomType": "entire_place",
  "maxGuests": 4,
  "bedrooms": 2,
  "beds": 2,
  "baths": 1,
  "address": { "street": "15 Park Street", "city": "Bengaluru", "state": "Karnataka", "country": "India", "postalCode": "560001" },
  "lat": 12.9716,
  "lng": 77.5946
}

PATCH /host/onboarding/{sessionId}/amenities
{ "amenities": ["wifi", "air_conditioning", "kitchen", "free_parking"] }

POST /host/onboarding/{sessionId}/photos
{ "photos": [{ "publicId": "casalux/test/photo1", "url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", "isPrimary": true }] }

PATCH /host/onboarding/{sessionId}/details
{ "title": "Modern 2BHK in Indiranagar, Bengaluru", "description": "Comfortable and well-furnished 2 bedroom apartment in the heart of Indiranagar. Walking distance to 100 Feet Road, restaurants, and MG Road metro station." }

PATCH /host/onboarding/{sessionId}/pricing
{ "basePrice": 400000, "cleaningFee": 75000, "cancellationPolicy": "moderate" }

PATCH /host/onboarding/{sessionId}/availability
{ "instantBook": true, "checkInTime": "14:00", "checkOutTime": "11:00", "minNights": 1 }

POST /host/onboarding/{sessionId}/submit
→ If AUTO_APPROVE_HOSTS=true: returns { "status": "auto_approved" }
→ Otherwise: returns { "status": "submitted" }, then admin approves
```

---

### D. Host routes — auth required (sign in as host user)

1. `GET /host/listings` — see all host's listings
2. `GET /host/listings/seed-listing-goa-villa`
3. `PATCH /host/listings/seed-listing-goa-villa/status` `{ "status": "inactive" }` then `{ "status": "active" }`
4. `GET /host/bookings` — see all bookings for host's listings
5. `GET /host/booking-requests/pending`

---

### E. Admin routes — auth required (sign in as admin)

1. `GET /admin/host-applications` — if any submitted
2. `POST /admin/host-applications/{sessionId}/approve`
3. `POST /admin/host-applications/{sessionId}/reject` `{ "reason": "Incomplete property information provided." }`

---

## 8. Stripe webhook testing (payment flow)

Install Stripe CLI, then forward webhooks to local:
```bash
stripe listen --forward-to localhost:3001/api/v1/webhooks/stripe
```

Use Stripe test card `4242 4242 4242 4242` (any future expiry, any CVC) when paying.

---

## 9. Import into Postman

1. Open Postman → **Import**
2. Paste URL: `http://localhost:3001/api/v1/openapi.json`
3. Postman generates the full collection from the spec
4. Set a collection variable `baseUrl = http://localhost:3001/api/v1`
5. Add Bearer token in collection Authorization tab

---

## 10. Elasticsearch index check

After starting the API and seeding, verify listings are indexed:
```bash
curl "localhost:9200/listings/_count"
# Should return: {"count": 4, ...}

curl "localhost:9200/listings/_search?q=Goa&pretty"
```

If the index is empty, trigger re-indexing by updating any listing via the host API.
