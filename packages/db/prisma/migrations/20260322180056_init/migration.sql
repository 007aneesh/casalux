-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('guest', 'host', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('unverified', 'verified');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('apartment', 'house', 'villa', 'cabin', 'unique', 'hotel');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('entire_place', 'private_room', 'shared_room');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'active', 'paused', 'archived', 'flagged');

-- CreateEnum
CREATE TYPE "CancellationPolicy" AS ENUM ('flexible', 'moderate', 'strict', 'super_strict');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending_request', 'host_approved', 'pending_payment', 'confirmed', 'completed', 'host_declined', 'guest_cancelled', 'cancelled_by_host', 'cancelled_by_admin', 'request_expired', 'payment_window_expired', 'payment_failed', 'payment_expired', 'disputed');

-- CreateEnum
CREATE TYPE "BookingRequestStatus" AS ENUM ('pending', 'approved', 'declined', 'guest_cancelled', 'expired', 'pre_approved', 'payment_window_expired');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'initiated', 'settled');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('none', 'requested', 'partial', 'full', 'processed');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('weekly_discount', 'monthly_discount', 'early_bird', 'last_minute', 'promo_code', 'new_listing_promo', 'seasonal', 'loyalty');

-- CreateEnum
CREATE TYPE "AvailabilityRuleType" AS ENUM ('blocked', 'available', 'min_nights_override', 'price_override', 'advance_notice', 'preparation_time');

-- CreateEnum
CREATE TYPE "HostApplicationStatus" AS ENUM ('in_progress', 'submitted', 'approved', 'rejected', 'auto_approved');

-- CreateEnum
CREATE TYPE "DeclineReason" AS ENUM ('dates_unavailable', 'guests_dont_fit', 'not_a_good_fit', 'other');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('stripe', 'razorpay', 'paypal');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "profileImageUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'guest',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'unverified',
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "responseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgResponseTimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isSuperhost" BOOLEAN NOT NULL DEFAULT false,
    "superhostGrantedAt" TIMESTAMP(3),
    "totalListings" INTEGER NOT NULL DEFAULT 0,
    "hostCancellationCount" INTEGER NOT NULL DEFAULT 0,
    "responseWindowHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "HostApplicationStatus" NOT NULL DEFAULT 'in_progress',
    "sessionData" JSONB NOT NULL DEFAULT '{}',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "roomType" "RoomType" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'draft',
    "address" JSONB NOT NULL,
    "lat" DECIMAL(10,7) NOT NULL,
    "lng" DECIMAL(10,7) NOT NULL,
    "images" JSONB[],
    "basePrice" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "cleaningFee" INTEGER NOT NULL DEFAULT 0,
    "minNights" INTEGER NOT NULL DEFAULT 1,
    "maxNights" INTEGER,
    "maxGuests" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "beds" INTEGER NOT NULL DEFAULT 0,
    "baths" INTEGER NOT NULL DEFAULT 0,
    "instantBook" BOOLEAN NOT NULL DEFAULT false,
    "checkInTime" TEXT NOT NULL DEFAULT '15:00',
    "checkOutTime" TEXT NOT NULL DEFAULT '11:00',
    "cancellationPolicy" "CancellationPolicy" NOT NULL DEFAULT 'flexible',
    "requireVerifiedId" BOOLEAN NOT NULL DEFAULT false,
    "requireProfilePhoto" BOOLEAN NOT NULL DEFAULT false,
    "requirePositiveReviews" BOOLEAN NOT NULL DEFAULT false,
    "avgRating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "quickFilterTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingAmenity" (
    "listingId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,

    CONSTRAINT "ListingAmenity_pkey" PRIMARY KEY ("listingId","amenityId")
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "type" "AvailabilityRuleType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "value" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "hostId" TEXT,
    "type" "DiscountType" NOT NULL,
    "label" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "isPercent" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minNights" INTEGER,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "code" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "daysInAdvance" INTEGER,
    "daysUntilCheckIn" INTEGER,
    "minPastBookings" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingRequestId" TEXT,
    "listingId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "checkIn" DATE NOT NULL,
    "checkOut" DATE NOT NULL,
    "nights" INTEGER NOT NULL,
    "guests" INTEGER NOT NULL,
    "agreedToHouseRules" BOOLEAN NOT NULL DEFAULT false,
    "guestVerifiedAtBooking" BOOLEAN NOT NULL DEFAULT false,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending_payment',
    "refundStatus" "RefundStatus" DEFAULT 'none',
    "baseSubtotal" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "discountsApplied" JSONB NOT NULL DEFAULT '[]',
    "cleaningFee" INTEGER NOT NULL DEFAULT 0,
    "platformServiceFee" INTEGER NOT NULL,
    "taxes" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "hostPayout" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentProvider" "PaymentProvider" NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "payoutId" TEXT,
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "cancellationReason" TEXT,
    "cancelledBy" TEXT,
    "hostCancellationPenalty" INTEGER,
    "refundAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRequest" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "checkIn" DATE NOT NULL,
    "checkOut" DATE NOT NULL,
    "nights" INTEGER NOT NULL,
    "guests" INTEGER NOT NULL,
    "status" "BookingRequestStatus" NOT NULL DEFAULT 'pending',
    "guestMessage" VARCHAR(1000),
    "hostMessage" VARCHAR(1000),
    "declineReason" "DeclineReason",
    "priceSnapshot" JSONB NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paymentWindowExpiresAt" TIMESTAMP(3),
    "expireJobId" TEXT,
    "payWindowJobId" TEXT,
    "reminderJobId18h" TEXT,
    "reminderJobId23h" TEXT,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostEarning" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "payoutId" TEXT,
    "payoutDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "wishlistId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("wishlistId","listingId")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "query" TEXT NOT NULL,
    "location" TEXT,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingView" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "rating" DECIMAL(2,1) NOT NULL,
    "comment" TEXT NOT NULL,
    "cleanlinessRating" DECIMAL(2,1),
    "accuracyRating" DECIMAL(2,1),
    "locationRating" DECIMAL(2,1),
    "checkInRating" DECIMAL(2,1),
    "valueRating" DECIMAL(2,1),
    "hostResponse" TEXT,
    "hostRespondedAt" TIMESTAMP(3),
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL DEFAULT 'image',
    "format" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "listingId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageThread" (
    "id" TEXT NOT NULL,
    "bookingRequestId" TEXT,
    "bookingId" TEXT,
    "guestId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unreadCountGuest" INTEGER NOT NULL DEFAULT 0,
    "unreadCountHost" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" VARCHAR(3000) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HostProfile_userId_key" ON "HostProfile"("userId");

-- CreateIndex
CREATE INDEX "HostProfile_isSuperhost_idx" ON "HostProfile"("isSuperhost");

-- CreateIndex
CREATE INDEX "HostApplication_userId_status_idx" ON "HostApplication"("userId", "status");

-- CreateIndex
CREATE INDEX "Listing_status_lat_lng_idx" ON "Listing"("status", "lat", "lng");

-- CreateIndex
CREATE INDEX "Listing_hostId_status_idx" ON "Listing"("hostId", "status");

-- CreateIndex
CREATE INDEX "Listing_basePrice_idx" ON "Listing"("basePrice");

-- CreateIndex
CREATE INDEX "Listing_avgRating_totalReviews_idx" ON "Listing"("avgRating" DESC, "totalReviews" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_slug_key" ON "Amenity"("slug");

-- CreateIndex
CREATE INDEX "AvailabilityRule_listingId_startDate_endDate_idx" ON "AvailabilityRule"("listingId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Discount_code_key" ON "Discount"("code");

-- CreateIndex
CREATE INDEX "Discount_listingId_isActive_idx" ON "Discount"("listingId", "isActive");

-- CreateIndex
CREATE INDEX "Discount_code_idx" ON "Discount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Booking_listingId_checkIn_checkOut_status_idx" ON "Booking"("listingId", "checkIn", "checkOut", "status");

-- CreateIndex
CREATE INDEX "Booking_guestId_status_idx" ON "Booking"("guestId", "status");

-- CreateIndex
CREATE INDEX "Booking_hostId_status_idx" ON "Booking"("hostId", "status");

-- CreateIndex
CREATE INDEX "Booking_idempotencyKey_idx" ON "Booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BookingRequest_listingId_status_idx" ON "BookingRequest"("listingId", "status");

-- CreateIndex
CREATE INDEX "BookingRequest_guestId_status_idx" ON "BookingRequest"("guestId", "status");

-- CreateIndex
CREATE INDEX "BookingRequest_hostId_status_idx" ON "BookingRequest"("hostId", "status");

-- CreateIndex
CREATE INDEX "BookingRequest_expiresAt_status_idx" ON "BookingRequest"("expiresAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_providerEventId_key" ON "PaymentEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "PaymentEvent_bookingId_idx" ON "PaymentEvent"("bookingId");

-- CreateIndex
CREATE INDEX "PaymentEvent_providerEventId_idx" ON "PaymentEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "HostEarning_hostId_payoutStatus_idx" ON "HostEarning"("hostId", "payoutStatus");

-- CreateIndex
CREATE INDEX "Wishlist_userId_idx" ON "Wishlist"("userId");

-- CreateIndex
CREATE INDEX "WishlistItem_listingId_idx" ON "WishlistItem"("listingId");

-- CreateIndex
CREATE INDEX "SearchHistory_userId_idx" ON "SearchHistory"("userId");

-- CreateIndex
CREATE INDEX "SearchHistory_sessionId_idx" ON "SearchHistory"("sessionId");

-- CreateIndex
CREATE INDEX "ListingView_listingId_createdAt_idx" ON "ListingView"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "ListingView_userId_idx" ON "ListingView"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_listingId_isVisible_idx" ON "Review"("listingId", "isVisible");

-- CreateIndex
CREATE INDEX "Review_guestId_idx" ON "Review"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_publicId_key" ON "MediaAsset"("publicId");

-- CreateIndex
CREATE INDEX "MediaAsset_entityType_entityId_idx" ON "MediaAsset"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "MediaAsset_listingId_idx" ON "MediaAsset"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageThread_bookingRequestId_key" ON "MessageThread"("bookingRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageThread_bookingId_key" ON "MessageThread"("bookingId");

-- CreateIndex
CREATE INDEX "MessageThread_guestId_lastMessageAt_idx" ON "MessageThread"("guestId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "MessageThread_hostId_lastMessageAt_idx" ON "MessageThread"("hostId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "HostProfile" ADD CONSTRAINT "HostProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostApplication" ADD CONSTRAINT "HostApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "HostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingAmenity" ADD CONSTRAINT "ListingAmenity_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingAmenity" ADD CONSTRAINT "ListingAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostEarning" ADD CONSTRAINT "HostEarning_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "HostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostEarning" ADD CONSTRAINT "HostEarning_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingView" ADD CONSTRAINT "ListingView_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingView" ADD CONSTRAINT "ListingView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
