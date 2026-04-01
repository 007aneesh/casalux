## Casalux — Critical Data Flow Rules (learned through bugs)

### authUser ID fields — NEVER mix these up
In `packages/auth/src/middleware.ts`, the `authUser` object set on every request context has:
- `authUser.userId`  = Clerk ID string (e.g. `user_2abc...`) — for Clerk API calls ONLY
- `authUser.clerkId` = same as userId (alias)
- `authUser.dbUserId` = local DB `User.id` (cuid) — use this for ALL database queries

`HostProfile.userId` references `User.id` (dbUserId), NOT the Clerk ID.
`Listing.hostId` references `HostProfile.id` (a different cuid entirely).

### Correct pattern for any host listing controller method
```ts
// WRONG — will always 404 because Clerk ID ≠ HostProfile.id
await service.someMethod(id, authUser.userId)

// CORRECT
const hostProfileId = await this.service.resolveHostProfileId(authUser.dbUserId)
await service.someMethod(id, hostProfileId)
```

`resolveHostProfileId(dbUserId)` is defined in `ListingService` — it upserts the HostProfile and returns its real primary key id.

### Controllers fixed so far (all had authUser.userId → should be hostProfileId)
- `listing.controller.ts`: createListing, getHostListings, getHostListingById, updateListing, updateStatus, updateAvailability — ALL FIXED

### API response shape must match frontend HostStats interface
`GET /host/stats` must return FLAT fields matching `HostStats` in `apps/web/src/lib/hooks/useHost.ts`:
- `activeListings`, `totalListings`, `pendingRequests`, `confirmedBookings`
- `thisMonthEarnings`, `allTimeEarnings`, `totalBookings`, `totalEarnings`
- `avgRating`, `reviewCount`
Do NOT return nested objects like `{ listings: { active, total } }` — the dashboard reads flat fields directly.

### listing.images JSON column vs mediaAsset table
`Listing.images` is a JSON column read by `shapeListing()` and returned to the frontend.
`mediaAsset` table is written by `/uploads/confirm` but was NOT synced back to `listing.images`.
Fix applied in `uploads.ts` confirm handler: after creating the mediaAsset, also update `listing.images` JSON array via `db.listing.update`.

### toggleListingStatus correct status values
Inactive/paused status string is `'paused'` (not `'inactive'`) — matches the Prisma enum.
