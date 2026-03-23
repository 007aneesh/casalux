/**
 * CasaLux OpenAPI 3.0 Specification
 * Served at GET /api/v1/openapi.json
 * Interactive UI at GET /docs
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CasaLux API',
    version: '1.0.0',
    description: `
## CasaLux — Vacation Rental Platform API

All protected endpoints require a **Clerk JWT** in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <your_clerk_jwt>
\`\`\`

### How to get a token for testing
1. Sign up / sign in via the web or mobile app
2. Open DevTools → Application → Cookies or use Clerk's \`getToken()\`
3. Paste the JWT into the **Authorize** button above

### Base URL
\`http://localhost:3001/api/v1\`
    `,
    contact: { name: 'CasaLux Engineering', email: 'aneeshx000@gmail.com' },
  },
  servers: [
    { url: 'http://localhost:3001/api/v1', description: 'Local development' },
  ],
  security: [{ BearerAuth: [] }],

  // ── Reusable Components ─────────────────────────────────────────────────────
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Clerk JWT — obtain from your Clerk session',
      },
    },
    schemas: {
      // ── Errors ──────────────────────────────────────────────────────────────
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Not found' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              formErrors: { type: 'array', items: { type: 'string' } },
              fieldErrors: { type: 'object' },
            },
          },
        },
      },

      // ── Listing ─────────────────────────────────────────────────────────────
      Listing: {
        type: 'object',
        properties: {
          id:               { type: 'string' },
          title:            { type: 'string' },
          description:      { type: 'string' },
          propertyType:     { type: 'string', enum: ['apartment', 'house', 'villa', 'studio', 'cabin', 'boat', 'treehouse', 'camper', 'other'] },
          roomType:         { type: 'string', enum: ['entire_place', 'private_room', 'shared_room'] },
          status:           { type: 'string', enum: ['draft', 'active', 'inactive', 'pending_review', 'suspended'] },
          basePrice:        { type: 'integer', description: 'Price in paise (₹1 = 100 paise)' },
          currency:         { type: 'string', example: 'INR' },
          maxGuests:        { type: 'integer' },
          bedrooms:         { type: 'integer' },
          beds:             { type: 'integer' },
          baths:            { type: 'number' },
          avgRating:        { type: 'number', example: 4.7 },
          totalReviews:     { type: 'integer' },
          instantBook:      { type: 'boolean' },
          city:             { type: 'string' },
          country:          { type: 'string' },
          lat:              { type: 'number' },
          lng:              { type: 'number' },
          createdAt:        { type: 'string', format: 'date-time' },
        },
      },
      ListingDetail: {
        allOf: [
          { '$ref': '#/components/schemas/Listing' },
          {
            type: 'object',
            properties: {
              amenities:          { type: 'array', items: { type: 'object', properties: { slug: { type: 'string' }, name: { type: 'string' }, category: { type: 'string' } } } },
              photos:             { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, isPrimary: { type: 'boolean' } } } },
              cancellationPolicy: { type: 'string', enum: ['flexible', 'moderate', 'strict'] },
              cleaningFee:        { type: 'integer' },
              host: {
                type: 'object',
                properties: {
                  id:          { type: 'string' },
                  firstName:   { type: 'string' },
                  lastName:    { type: 'string' },
                  avatarUrl:   { type: 'string' },
                  isSuperhost: { type: 'boolean' },
                },
              },
            },
          },
        ],
      },

      // ── Booking ─────────────────────────────────────────────────────────────
      Booking: {
        type: 'object',
        properties: {
          id:          { type: 'string' },
          listingId:   { type: 'string' },
          checkIn:     { type: 'string', format: 'date', example: '2025-12-24' },
          checkOut:    { type: 'string', format: 'date', example: '2025-12-30' },
          guests:      { type: 'integer' },
          totalPrice:  { type: 'integer', description: 'Total in paise' },
          status:      { type: 'string', enum: ['pending_payment', 'confirmed', 'cancelled', 'completed', 'disputed'] },
          paymentStatus: { type: 'string' },
          createdAt:   { type: 'string', format: 'date-time' },
        },
      },

      // ── Booking Request ──────────────────────────────────────────────────────
      BookingRequest: {
        type: 'object',
        properties: {
          id:        { type: 'string' },
          listingId: { type: 'string' },
          checkIn:   { type: 'string', format: 'date' },
          checkOut:  { type: 'string', format: 'date' },
          guests:    { type: 'integer' },
          message:   { type: 'string' },
          status:    { type: 'string', enum: ['pending', 'approved', 'declined', 'expired', 'cancelled', 'pre_approved'] },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Review ───────────────────────────────────────────────────────────────
      Review: {
        type: 'object',
        properties: {
          id:               { type: 'string' },
          bookingId:        { type: 'string' },
          listingId:        { type: 'string' },
          rating:           { type: 'integer', minimum: 1, maximum: 5 },
          comment:          { type: 'string' },
          cleanlinessRating: { type: 'integer', minimum: 1, maximum: 5 },
          accuracyRating:   { type: 'integer', minimum: 1, maximum: 5 },
          locationRating:   { type: 'integer', minimum: 1, maximum: 5 },
          checkInRating:    { type: 'integer', minimum: 1, maximum: 5 },
          valueRating:      { type: 'integer', minimum: 1, maximum: 5 },
          hostResponse:     { type: 'string', nullable: true },
          createdAt:        { type: 'string', format: 'date-time' },
        },
      },

      // ── Wishlist ─────────────────────────────────────────────────────────────
      Wishlist: {
        type: 'object',
        properties: {
          id:        { type: 'string' },
          name:      { type: 'string' },
          itemCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Message Thread ───────────────────────────────────────────────────────
      MessageThread: {
        type: 'object',
        properties: {
          id:               { type: 'string' },
          guestId:          { type: 'string' },
          hostId:           { type: 'string' },
          bookingId:        { type: 'string', nullable: true },
          unreadCountGuest: { type: 'integer' },
          unreadCountHost:  { type: 'integer' },
          lastMessageAt:    { type: 'string', format: 'date-time' },
        },
      },

      // ── Message ──────────────────────────────────────────────────────────────
      Message: {
        type: 'object',
        properties: {
          id:        { type: 'string' },
          threadId:  { type: 'string' },
          senderId:  { type: 'string' },
          body:      { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Onboarding Session ───────────────────────────────────────────────────
      OnboardingSession: {
        type: 'object',
        properties: {
          id:          { type: 'string' },
          status:      { type: 'string', enum: ['in_progress', 'submitted', 'approved', 'rejected'] },
          sessionData: { type: 'object', description: 'Accumulated step data' },
          createdAt:   { type: 'string', format: 'date-time' },
          updatedAt:   { type: 'string', format: 'date-time' },
        },
      },

      // ── Autocomplete ─────────────────────────────────────────────────────────
      AutocompleteItem: {
        type: 'object',
        properties: {
          type:        { type: 'string', enum: ['recent', 'popular', 'places_api'] },
          description: { type: 'string', example: 'Goa, India' },
          placeId:     { type: 'string', nullable: true },
          lat:         { type: 'number', nullable: true },
          lng:         { type: 'number', nullable: true },
        },
      },
    },

    // ── Reusable Parameters ────────────────────────────────────────────────────
    parameters: {
      pageParam: {
        name: 'page', in: 'query', schema: { type: 'integer', default: 1 },
        description: 'Page number (1-based)',
      },
      limitParam: {
        name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 },
        description: 'Items per page',
      },
      cursorParam: {
        name: 'cursor', in: 'query', schema: { type: 'string' },
        description: 'Pagination cursor (ID of last item in previous page)',
      },
      listingIdPath: {
        name: 'id', in: 'path', required: true, schema: { type: 'string' },
        description: 'Listing ID',
      },
      bookingIdPath: {
        name: 'id', in: 'path', required: true, schema: { type: 'string' },
        description: 'Booking ID',
      },
      reviewIdPath: {
        name: 'id', in: 'path', required: true, schema: { type: 'string' },
        description: 'Review ID',
      },
      sessionIdPath: {
        name: 'sessionId', in: 'path', required: true, schema: { type: 'string' },
        description: 'Onboarding session ID',
      },
      threadIdPath: {
        name: 'threadId', in: 'path', required: true, schema: { type: 'string' },
        description: 'Message thread ID',
      },
    },

    // ── Reusable Responses ─────────────────────────────────────────────────────
    responses: {
      Unauthorized: {
        description: '401 — Missing or invalid JWT',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: '403 — Insufficient role',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: '404 — Resource not found',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } },
      },
      ValidationError: {
        description: '422 — Validation failed',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/ValidationError' } } },
      },
    },
  },

  // ── Paths ───────────────────────────────────────────────────────────────────
  paths: {

    // ════════════════════════════════════════════════════════════════════════
    // HEALTH
    // ════════════════════════════════════════════════════════════════════════
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Server health check',
        security: [],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' }, timestamp: { type: 'string' } } } } } },
        },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // LISTINGS — public
    // ════════════════════════════════════════════════════════════════════════
    '/listings': {
      get: {
        tags: ['Listings'],
        summary: 'Browse listings with filters',
        security: [],
        parameters: [
          { name: 'q',            in: 'query', schema: { type: 'string' }, description: 'Free-text search' },
          { name: 'city',         in: 'query', schema: { type: 'string' } },
          { name: 'checkIn',      in: 'query', schema: { type: 'string', format: 'date' }, example: '2025-12-24' },
          { name: 'checkOut',     in: 'query', schema: { type: 'string', format: 'date' }, example: '2025-12-30' },
          { name: 'guests',       in: 'query', schema: { type: 'integer' } },
          { name: 'minPrice',     in: 'query', schema: { type: 'integer' }, description: 'Min price in paise' },
          { name: 'maxPrice',     in: 'query', schema: { type: 'integer' }, description: 'Max price in paise' },
          { name: 'propertyType', in: 'query', schema: { type: 'string' } },
          { name: 'roomType',     in: 'query', schema: { type: 'string' } },
          { name: 'amenities',    in: 'query', schema: { type: 'string' }, description: 'Comma-separated amenity slugs' },
          { name: 'instantBook',  in: 'query', schema: { type: 'boolean' } },
          { name: 'sortBy',       in: 'query', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'rating', 'newest'] } },
          { '$ref': '#/components/parameters/pageParam' },
          { '$ref': '#/components/parameters/limitParam' },
        ],
        responses: {
          200: {
            description: 'Paginated listing feed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    listings: { type: 'array', items: { '$ref': '#/components/schemas/Listing' } },
                    total:    { type: 'integer' },
                    page:     { type: 'integer' },
                    pages:    { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/listings/quick-filters': {
      get: {
        tags: ['Listings'],
        summary: 'Filter chip metadata with counts',
        security: [],
        responses: {
          200: { description: 'Filter options', content: { 'application/json': { schema: { type: 'object' } } } },
        },
      },
    },

    '/listings/recommended': {
      get: {
        tags: ['Listings'],
        summary: 'Personalised listing recommendations (auth optional)',
        security: [{ BearerAuth: [] }, {}],
        responses: {
          200: {
            description: 'Recommended listings',
            content: { 'application/json': { schema: { type: 'object', properties: { listings: { type: 'array', items: { '$ref': '#/components/schemas/Listing' } } } } } },
          },
        },
      },
    },

    '/listings/{id}': {
      get: {
        tags: ['Listings'],
        summary: 'Listing detail page',
        security: [],
        parameters: [{ '$ref': '#/components/parameters/listingIdPath' }],
        responses: {
          200: { description: 'Listing detail', content: { 'application/json': { schema: { type: 'object', properties: { listing: { '$ref': '#/components/schemas/ListingDetail' } } } } } },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    '/listings/{id}/availability': {
      get: {
        tags: ['Listings'],
        summary: 'Blocked dates for a listing (calendar)',
        security: [],
        parameters: [
          { '$ref': '#/components/parameters/listingIdPath' },
          { name: 'month', in: 'query', schema: { type: 'string', example: '2025-12' }, description: 'YYYY-MM — returns that month\'s blocked dates' },
        ],
        responses: {
          200: {
            description: 'Blocked date ranges',
            content: { 'application/json': { schema: { type: 'object', properties: { blockedDates: { type: 'array', items: { type: 'object', properties: { start: { type: 'string' }, end: { type: 'string' } } } } } } } },
          },
        },
      },
    },

    '/listings/{id}/pricing-preview': {
      get: {
        tags: ['Listings'],
        summary: 'Price breakdown for a date range',
        security: [],
        parameters: [
          { '$ref': '#/components/parameters/listingIdPath' },
          { name: 'checkIn',  in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'checkOut', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'guests',   in: 'query', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: {
            description: 'Price breakdown',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    nights:         { type: 'integer' },
                    baseTotal:      { type: 'integer' },
                    cleaningFee:    { type: 'integer' },
                    serviceFee:     { type: 'integer' },
                    total:          { type: 'integer' },
                    currency:       { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/listings/{id}/reviews': {
      get: {
        tags: ['Listings'],
        summary: 'Paginated reviews for a listing',
        security: [],
        parameters: [
          { '$ref': '#/components/parameters/listingIdPath' },
          { '$ref': '#/components/parameters/cursorParam' },
          { '$ref': '#/components/parameters/limitParam' },
        ],
        responses: {
          200: {
            description: 'Reviews',
            content: { 'application/json': { schema: { type: 'object', properties: { reviews: { type: 'array', items: { '$ref': '#/components/schemas/Review' } }, nextCursor: { type: 'string' } } } } },
          },
        },
      },
    },

    '/listings/{id}/save': {
      post: {
        tags: ['Listings', 'Wishlists'],
        summary: 'Quick-save listing to first wishlist (heart button)',
        parameters: [{ '$ref': '#/components/parameters/listingIdPath' }],
        responses: {
          201: { description: 'Saved', content: { 'application/json': { schema: { type: 'object', properties: { item: { type: 'object' } } } } } },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // BOOKINGS — guest
    // ════════════════════════════════════════════════════════════════════════
    '/bookings/initiate': {
      post: {
        tags: ['Bookings'],
        summary: 'Instant Book — create booking + Stripe payment order',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['listingId', 'checkIn', 'checkOut', 'guests'],
                properties: {
                  listingId:   { type: 'string' },
                  checkIn:     { type: 'string', format: 'date', example: '2025-12-24' },
                  checkOut:    { type: 'string', format: 'date', example: '2025-12-30' },
                  guests:      { type: 'integer', minimum: 1 },
                  couponCode:  { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Booking created, payment order ready',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    booking:       { '$ref': '#/components/schemas/Booking' },
                    paymentIntent: { type: 'object', description: 'Stripe PaymentIntent client_secret' },
                  },
                },
              },
            },
          },
          422: { '$ref': '#/components/responses/ValidationError' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },

    '/bookings/{id}': {
      get: {
        tags: ['Bookings'],
        summary: 'Full booking detail',
        parameters: [{ '$ref': '#/components/parameters/bookingIdPath' }],
        responses: {
          200: { description: 'Booking', content: { 'application/json': { schema: { type: 'object', properties: { booking: { '$ref': '#/components/schemas/Booking' } } } } } },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    '/bookings/{id}/status': {
      get: {
        tags: ['Bookings'],
        summary: 'Lightweight status poll (for payment confirmation screen)',
        parameters: [{ '$ref': '#/components/parameters/bookingIdPath' }],
        responses: {
          200: {
            description: 'Current status',
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, paymentStatus: { type: 'string' } } } } },
          },
        },
      },
    },

    '/bookings/{id}/cancellation-preview': {
      get: {
        tags: ['Bookings'],
        summary: 'Show refund amount before cancelling',
        parameters: [{ '$ref': '#/components/parameters/bookingIdPath' }],
        responses: {
          200: {
            description: 'Cancellation preview',
            content: { 'application/json': { schema: { type: 'object', properties: { refundAmount: { type: 'integer' }, refundPercent: { type: 'integer' }, policy: { type: 'string' } } } } },
          },
        },
      },
    },

    '/bookings/{id}/cancel': {
      post: {
        tags: ['Bookings'],
        summary: 'Cancel a booking (guest)',
        parameters: [{ '$ref': '#/components/parameters/bookingIdPath' }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } },
        },
        responses: {
          200: { description: 'Cancelled', content: { 'application/json': { schema: { type: 'object', properties: { booking: { '$ref': '#/components/schemas/Booking' } } } } } },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    '/bookings/{id}/review': {
      post: {
        tags: ['Bookings', 'Reviews'],
        summary: 'Write a review for a completed booking',
        parameters: [{ '$ref': '#/components/parameters/bookingIdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rating', 'comment'],
                properties: {
                  rating:            { type: 'integer', minimum: 1, maximum: 5 },
                  comment:           { type: 'string', minLength: 10, maxLength: 3000 },
                  cleanlinessRating: { type: 'integer', minimum: 1, maximum: 5 },
                  accuracyRating:    { type: 'integer', minimum: 1, maximum: 5 },
                  locationRating:    { type: 'integer', minimum: 1, maximum: 5 },
                  checkInRating:     { type: 'integer', minimum: 1, maximum: 5 },
                  valueRating:       { type: 'integer', minimum: 1, maximum: 5 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Review created', content: { 'application/json': { schema: { type: 'object', properties: { review: { '$ref': '#/components/schemas/Review' } } } } } },
          409: { description: 'Already reviewed', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
        },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // BOOKING REQUESTS
    // ════════════════════════════════════════════════════════════════════════
    '/booking-requests': {
      post: {
        tags: ['Booking Requests'],
        summary: 'Send a booking request (non-instant-book listings)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['listingId', 'checkIn', 'checkOut', 'guests'],
                properties: {
                  listingId: { type: 'string' },
                  checkIn:   { type: 'string', format: 'date' },
                  checkOut:  { type: 'string', format: 'date' },
                  guests:    { type: 'integer' },
                  message:   { type: 'string', maxLength: 1000 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Request created', content: { 'application/json': { schema: { type: 'object', properties: { request: { '$ref': '#/components/schemas/BookingRequest' } } } } } },
        },
      },
    },

    '/booking-requests/{id}': {
      get: {
        tags: ['Booking Requests'],
        summary: 'Get booking request detail',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Request', content: { 'application/json': { schema: { type: 'object', properties: { request: { '$ref': '#/components/schemas/BookingRequest' } } } } } },
        },
      },
    },

    '/booking-requests/{id}/confirm': {
      post: {
        tags: ['Booking Requests'],
        summary: 'Guest confirms a pre-approved request + pays',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Confirmed + payment order', content: { 'application/json': { schema: { type: 'object' } } } },
        },
      },
    },

    '/booking-requests/{id}/cancel': {
      post: {
        tags: ['Booking Requests'],
        summary: 'Guest cancels their own pending request',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Cancelled', content: { 'application/json': { schema: { type: 'object', properties: { request: { '$ref': '#/components/schemas/BookingRequest' } } } } } },
        },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // REVIEWS
    // ════════════════════════════════════════════════════════════════════════
    '/reviews/{id}/response': {
      patch: {
        tags: ['Reviews'],
        summary: 'Host responds to a guest review',
        parameters: [{ '$ref': '#/components/parameters/reviewIdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['response'],
                properties: { response: { type: 'string', minLength: 1, maxLength: 1500 } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Response added', content: { 'application/json': { schema: { type: 'object', properties: { review: { '$ref': '#/components/schemas/Review' } } } } } },
          409: { description: 'Already responded' },
        },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // MESSAGES
    // ════════════════════════════════════════════════════════════════════════
    '/messages/unread-count': {
      get: {
        tags: ['Messages'],
        summary: 'Total unread messages across all threads',
        responses: {
          200: { description: 'Count', content: { 'application/json': { schema: { type: 'object', properties: { unreadCount: { type: 'integer' } } } } } },
        },
      },
    },

    '/messages/threads': {
      get: {
        tags: ['Messages'],
        summary: 'List all message threads for the caller',
        responses: {
          200: { description: 'Threads', content: { 'application/json': { schema: { type: 'object', properties: { threads: { type: 'array', items: { '$ref': '#/components/schemas/MessageThread' } } } } } } },
        },
      },
      post: {
        tags: ['Messages'],
        summary: 'Get or create a thread between guest and host',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['guestId', 'hostId'],
                properties: {
                  guestId:          { type: 'string' },
                  hostId:           { type: 'string' },
                  bookingId:        { type: 'string' },
                  bookingRequestId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Thread', content: { 'application/json': { schema: { type: 'object', properties: { thread: { '$ref': '#/components/schemas/MessageThread' } } } } } },
        },
      },
    },

    '/messages/threads/{threadId}': {
      get: {
        tags: ['Messages'],
        summary: 'Thread detail + most recent messages',
        parameters: [{ '$ref': '#/components/parameters/threadIdPath' }],
        responses: {
          200: { description: 'Thread', content: { 'application/json': { schema: { type: 'object', properties: { thread: { '$ref': '#/components/schemas/MessageThread' } } } } } },
          403: { '$ref': '#/components/responses/Forbidden' },
        },
      },
    },

    '/messages/threads/{threadId}/messages': {
      get: {
        tags: ['Messages'],
        summary: 'Paginated messages in a thread',
        parameters: [
          { '$ref': '#/components/parameters/threadIdPath' },
          { '$ref': '#/components/parameters/cursorParam' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 } },
        ],
        responses: {
          200: { description: 'Messages', content: { 'application/json': { schema: { type: 'object', properties: { messages: { type: 'array', items: { '$ref': '#/components/schemas/Message' } }, nextCursor: { type: 'string' } } } } } },
        },
      },
      post: {
        tags: ['Messages'],
        summary: 'Send a message',
        parameters: [{ '$ref': '#/components/parameters/threadIdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['body'], properties: { body: { type: 'string', minLength: 1, maxLength: 3000 } } },
            },
          },
        },
        responses: {
          201: { description: 'Message sent', content: { 'application/json': { schema: { type: 'object', properties: { message: { '$ref': '#/components/schemas/Message' } } } } } },
        },
      },
    },

    '/messages/threads/{threadId}/read': {
      patch: {
        tags: ['Messages'],
        summary: 'Mark thread as read',
        parameters: [{ '$ref': '#/components/parameters/threadIdPath' }],
        responses: {
          200: { description: 'Marked read', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } },
        },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // USERS / ME
    // ════════════════════════════════════════════════════════════════════════
    '/users/me/bookings': {
      get: {
        tags: ['My Account'],
        summary: 'My booking history (guest)',
        parameters: [{ '$ref': '#/components/parameters/pageParam' }, { '$ref': '#/components/parameters/limitParam' }],
        responses: {
          200: { description: 'Bookings', content: { 'application/json': { schema: { type: 'object', properties: { bookings: { type: 'array', items: { '$ref': '#/components/schemas/Booking' } } } } } } },
        },
      },
    },

    '/users/me/booking-requests': {
      get: {
        tags: ['My Account'],
        summary: 'My booking requests (guest)',
        responses: {
          200: { description: 'Requests', content: { 'application/json': { schema: { type: 'object', properties: { requests: { type: 'array', items: { '$ref': '#/components/schemas/BookingRequest' } } } } } } },
        },
      },
    },

    '/users/me/reviews': {
      get: {
        tags: ['My Account'],
        summary: 'Reviews I have written',
        parameters: [{ '$ref': '#/components/parameters/cursorParam' }, { '$ref': '#/components/parameters/limitParam' }],
        responses: {
          200: { description: 'Reviews', content: { 'application/json': { schema: { type: 'object', properties: { reviews: { type: 'array', items: { '$ref': '#/components/schemas/Review' } }, nextCursor: { type: 'string' } } } } } },
        },
      },
    },

    '/users/me/wishlists': {
      get: {
        tags: ['Wishlists'],
        summary: 'List all my wishlists',
        responses: {
          200: { description: 'Wishlists', content: { 'application/json': { schema: { type: 'object', properties: { wishlists: { type: 'array', items: { '$ref': '#/components/schemas/Wishlist' } } } } } } },
        },
      },
      post: {
        tags: ['Wishlists'],
        summary: 'Create a new wishlist',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 1, maxLength: 100 } } } } },
        },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { wishlist: { '$ref': '#/components/schemas/Wishlist' } } } } } },
        },
      },
    },

    '/users/me/wishlists/check/{listingId}': {
      get: {
        tags: ['Wishlists'],
        summary: 'Check if a listing is saved in any wishlist',
        parameters: [{ name: 'listingId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Save state',
            content: { 'application/json': { schema: { type: 'object', properties: { isSaved: { type: 'boolean' }, wishlistIds: { type: 'array', items: { type: 'string' } } } } } },
          },
        },
      },
    },

    '/users/me/wishlists/{id}': {
      get: {
        tags: ['Wishlists'],
        summary: 'Get a wishlist with its listings',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Wishlist detail', content: { 'application/json': { schema: { type: 'object', properties: { wishlist: { '$ref': '#/components/schemas/Wishlist' } } } } } },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Wishlists'],
        summary: 'Rename a wishlist',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } },
        },
        responses: {
          200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { wishlist: { '$ref': '#/components/schemas/Wishlist' } } } } } },
        },
      },
      delete: {
        tags: ['Wishlists'],
        summary: 'Delete a wishlist',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } } },
      },
    },

    '/users/me/wishlists/{id}/listings': {
      post: {
        tags: ['Wishlists'],
        summary: 'Add a listing to a wishlist',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['listingId'], properties: { listingId: { type: 'string' } } } } },
        },
        responses: { 201: { description: 'Added' } },
      },
    },

    '/users/me/wishlists/{id}/listings/{listingId}': {
      delete: {
        tags: ['Wishlists'],
        summary: 'Remove a listing from a wishlist',
        parameters: [
          { name: 'id',        in: 'path', required: true, schema: { type: 'string' } },
          { name: 'listingId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Removed' } },
      },
    },

    '/users/me/search-history': {
      get: {
        tags: ['Search History'],
        summary: 'My recent searches',
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } }],
        responses: { 200: { description: 'History', content: { 'application/json': { schema: { type: 'object', properties: { history: { type: 'array', items: { type: 'object' } } } } } } } },
      },
      delete: {
        tags: ['Search History'],
        summary: 'Clear all search history',
        responses: { 200: { description: 'Cleared', content: { 'application/json': { schema: { type: 'object', properties: { deleted: { type: 'integer' } } } } } } },
      },
    },

    '/users/me/search-history/{id}': {
      delete: {
        tags: ['Search History'],
        summary: 'Delete a single search history entry',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' } },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // LOCATION AUTOCOMPLETE
    // ════════════════════════════════════════════════════════════════════════
    '/locations/autocomplete': {
      get: {
        tags: ['Locations'],
        summary: 'Location autocomplete (recent → popular → Google Places)',
        security: [{ BearerAuth: [] }, {}],
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 1 }, description: 'Search prefix', example: 'Goa' },
        ],
        responses: {
          200: {
            description: 'Autocomplete results (max 10)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { results: { type: 'array', items: { '$ref': '#/components/schemas/AutocompleteItem' } } },
                },
              },
            },
          },
        },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // SEARCH HISTORY (save — auth optional)
    // ════════════════════════════════════════════════════════════════════════
    '/search/history': {
      post: {
        tags: ['Search History'],
        summary: 'Save a search (called automatically after each search)',
        security: [{ BearerAuth: [] }, {}],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: {
                  query:       { type: 'string', maxLength: 200 },
                  location:    { type: 'string' },
                  lat:         { type: 'number' },
                  lng:         { type: 'number' },
                  resultCount: { type: 'integer', default: 0 },
                  sessionId:   { type: 'string', description: 'Anonymous session ID for unauthenticated users' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Saved', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } } },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // HOST — listing management
    // ════════════════════════════════════════════════════════════════════════
    '/host/listings': {
      post: {
        tags: ['Host — Listings'],
        summary: 'Create a new draft listing',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'propertyType', 'roomType', 'maxGuests', 'basePrice'],
                properties: {
                  title:       { type: 'string' },
                  description: { type: 'string' },
                  propertyType: { type: 'string' },
                  roomType:    { type: 'string' },
                  maxGuests:   { type: 'integer' },
                  basePrice:   { type: 'integer', description: 'In paise' },
                  city:        { type: 'string' },
                  country:     { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Draft listing created', content: { 'application/json': { schema: { type: 'object', properties: { listing: { '$ref': '#/components/schemas/ListingDetail' } } } } } } },
      },
      get: {
        tags: ['Host — Listings'],
        summary: 'My listings',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { '$ref': '#/components/parameters/pageParam' },
        ],
        responses: { 200: { description: 'Listings', content: { 'application/json': { schema: { type: 'object', properties: { listings: { type: 'array', items: { '$ref': '#/components/schemas/Listing' } } } } } } } },
      },
    },

    '/host/listings/{id}': {
      get: {
        tags: ['Host — Listings'],
        summary: 'Get my listing detail',
        parameters: [{ '$ref': '#/components/parameters/listingIdPath' }],
        responses: { 200: { description: 'Listing', content: { 'application/json': { schema: { type: 'object', properties: { listing: { '$ref': '#/components/schemas/ListingDetail' } } } } } } },
      },
      put: {
        tags: ['Host — Listings'],
        summary: 'Full update listing',
        parameters: [{ '$ref': '#/components/parameters/listingIdPath' }],
        requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/ListingDetail' } } } },
        responses: { 200: { description: 'Updated' } },
      },
    },

    '/host/listings/{id}/status': {
      patch: {
        tags: ['Host — Listings'],
        summary: 'Change listing status (draft → active, etc.)',
        parameters: [{ '$ref': '#/components/parameters/listingIdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['draft', 'active', 'inactive'] } } },
            },
          },
        },
        responses: { 200: { description: 'Status updated' } },
      },
    },

    '/host/listings/{id}/availability': {
      put: {
        tags: ['Host — Listings'],
        summary: 'Set blocked dates / availability rules',
        parameters: [{ '$ref': '#/components/parameters/listingIdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  blockedDates: { type: 'array', items: { type: 'object', properties: { start: { type: 'string' }, end: { type: 'string' } } } },
                  minNights:    { type: 'integer' },
                  maxNights:    { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Availability updated' } },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // HOST — booking management
    // ════════════════════════════════════════════════════════════════════════
    '/host/bookings': {
      get: {
        tags: ['Host — Bookings'],
        summary: 'All bookings for my listings',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { '$ref': '#/components/parameters/pageParam' },
        ],
        responses: { 200: { description: 'Bookings', content: { 'application/json': { schema: { type: 'object', properties: { bookings: { type: 'array', items: { '$ref': '#/components/schemas/Booking' } } } } } } } },
      },
    },

    '/host/bookings/{id}': {
      get: {
        tags: ['Host — Bookings'],
        summary: 'Booking detail (host view)',
        parameters: [{ '$ref': '#/components/parameters/bookingIdPath' }],
        responses: { 200: { description: 'Booking' } },
      },
    },

    '/host/bookings/{id}/cancel': {
      post: {
        tags: ['Host — Bookings'],
        summary: 'Cancel a confirmed booking as host (penalty applies)',
        parameters: [{ '$ref': '#/components/parameters/bookingIdPath' }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } } },
        responses: { 200: { description: 'Cancelled' } },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // HOST — booking requests
    // ════════════════════════════════════════════════════════════════════════
    '/host/booking-requests': {
      get: {
        tags: ['Host — Booking Requests'],
        summary: 'All booking requests for my listings',
        parameters: [{ '$ref': '#/components/parameters/pageParam' }],
        responses: { 200: { description: 'Requests', content: { 'application/json': { schema: { type: 'object', properties: { requests: { type: 'array', items: { '$ref': '#/components/schemas/BookingRequest' } } } } } } } },
      },
    },

    '/host/booking-requests/pending': {
      get: {
        tags: ['Host — Booking Requests'],
        summary: 'Pending requests sorted by expiry (action queue)',
        responses: { 200: { description: 'Pending requests' } },
      },
    },

    '/host/booking-requests/pre-approve': {
      post: {
        tags: ['Host — Booking Requests'],
        summary: 'Send a pre-approval to a specific guest',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['guestClerkId', 'listingId', 'checkIn', 'checkOut', 'guests'],
                properties: {
                  guestClerkId: { type: 'string' },
                  listingId:   { type: 'string' },
                  checkIn:     { type: 'string', format: 'date' },
                  checkOut:    { type: 'string', format: 'date' },
                  guests:      { type: 'integer' },
                  message:     { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Pre-approval sent' } },
      },
    },

    '/host/booking-requests/{id}/approve': {
      post: {
        tags: ['Host — Booking Requests'],
        summary: 'Approve a booking request',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Approved' } },
      },
    },

    '/host/booking-requests/{id}/decline': {
      post: {
        tags: ['Host — Booking Requests'],
        summary: 'Decline a booking request',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { reason: { type: 'string', enum: ['dates_not_available', 'not_a_good_fit', 'requested_to_book_elsewhere', 'other'] } } },
            },
          },
        },
        responses: { 200: { description: 'Declined' } },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // HOST — onboarding wizard (8 steps)
    // ════════════════════════════════════════════════════════════════════════
    '/host/onboarding/start': {
      post: {
        tags: ['Host Onboarding'],
        summary: 'Step 1 — Start (or resume) onboarding session',
        description: 'Returns existing in-progress session if one exists, otherwise creates new.',
        responses: {
          201: { description: 'Session', content: { 'application/json': { schema: { type: 'object', properties: { session: { '$ref': '#/components/schemas/OnboardingSession' } } } } } },
        },
      },
    },

    '/host/onboarding/{sessionId}': {
      get: {
        tags: ['Host Onboarding'],
        summary: 'Get current onboarding progress',
        parameters: [{ '$ref': '#/components/parameters/sessionIdPath' }],
        responses: { 200: { description: 'Session progress', content: { 'application/json': { schema: { type: 'object', properties: { session: { '$ref': '#/components/schemas/OnboardingSession' } } } } } } },
      },
    },

    '/host/onboarding/{sessionId}/space': {
      patch: {
        tags: ['Host Onboarding'],
        summary: 'Step 2 — Property type, room type, guest capacity & address',
        parameters: [{ '$ref': '#/components/parameters/sessionIdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['propertyType', 'roomType', 'maxGuests', 'address'],
                properties: {
                  propertyType: { type: 'string', enum: ['apartment', 'house', 'villa', 'studio', 'cabin', 'boat', 'treehouse', 'camper', 'other'] },
                  roomType:     { type: 'string', enum: ['entire_place', 'private_room', 'shared_room'] },
                  maxGuests:    { type: 'integer', minimum: 1, maximum: 50 },
                  bedrooms:     { type: 'integer', minimum: 0 },
                  beds:         { type: 'integer', minimum: 1 },
                  baths:        { type: 'number', minimum: 0 },
                  address: {
                    type: 'object',
                    description: 'Structured address',
                    example: { street: '12 Marine Drive', city: 'Mumbai', state: 'Maharashtra', country: 'India', postalCode: '400020' },
                    additionalProperties: { type: 'string' },
                  },
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Step saved', content: { 'application/json': { schema: { type: 'object', properties: { session: { '$ref': '#/components/schemas/OnboardingSession' } } } } } } },
      },
    },

    '/host/onboarding/{sessionId}/amenities': {
      patch: {
        tags: ['Host Onboarding'],
        summary: 'Step 3 — Select amenities',
        parameters: [{ '$ref': '#/components/parameters/sessionIdPath' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['amenities'], properties: { amenities: { type: 'array', items: { type: 'string' }, example: ['wifi', 'pool', 'air_conditioning'] } } } } },
        },
        responses: { 200: { description: 'Step saved' } },
      },
    },

    '/host/onboarding/{sessionId}/photos': {
      post: {
        tags: ['Host Onboarding'],
        summary: 'Step 4 — Upload photos (Cloudinary publicIds)',
        description: 'Upload photos via `POST /api/v1/uploads/sign` first to get publicId + url from Cloudinary, then submit them here.',
        parameters: [{ '$ref': '#/components/parameters/sessionIdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['photos'],
                properties: {
                  photos: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      required: ['publicId', 'url', 'isPrimary'],
                      properties: {
                        publicId:  { type: 'string', example: 'casalux/listings/abc123' },
                        url:       { type: 'string', format: 'uri' },
                        isPrimary: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Step saved' } },
      },
    },

    '/host/onboarding/{sessionId}/details': {
      patch: {
        tags: ['Host Onboarding'],
        summary: 'Step 5 — Title & description',
        parameters: [{ '$ref': '#/components/parameters/sessionIdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description'],
                properties: {
                  title:       { type: 'string', minLength: 5, maxLength: 100, example: 'Cosy Goa Beach Villa with Pool' },
                  description: { type: 'string', minLength: 20, maxLength: 3000 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Step saved' } },
      },
    },

    '/host/onboarding/{sessionId}/pricing': {
      patch: {
        tags: ['Host Onboarding'],
        summary: 'Step 6 — Base price, cleaning fee & cancellation policy',
        parameters: [{ '$ref': '#/components/parameters/sessionIdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['basePrice', 'cancellationPolicy'],
                properties: {
                  basePrice:          { type: 'integer', minimum: 100, description: 'In paise (₹500/night = 50000)', example: 500000 },
                  currency:           { type: 'string', default: 'INR' },
                  cleaningFee:        { type: 'integer', minimum: 0, example: 50000 },
                  cancellationPolicy: { type: 'string', enum: ['flexible', 'moderate', 'strict'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Step saved' } },
      },
    },

    '/host/onboarding/{sessionId}/availability': {
      patch: {
        tags: ['Host Onboarding'],
        summary: 'Step 7 — Availability rules',
        parameters: [{ '$ref': '#/components/parameters/sessionIdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  instantBook:   { type: 'boolean', default: false },
                  checkInTime:   { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '14:00' },
                  checkOutTime:  { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '11:00' },
                  minNights:     { type: 'integer', minimum: 1, default: 1 },
                  maxNights:     { type: 'integer', minimum: 1, default: 365 },
                  blockedDates:  { type: 'array', items: { type: 'object', properties: { start: { type: 'string', format: 'date' }, end: { type: 'string', format: 'date' } } } },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Step saved' } },
      },
    },

    '/host/onboarding/{sessionId}/submit': {
      post: {
        tags: ['Host Onboarding'],
        summary: 'Step 8 — Submit application for review',
        description: 'Validates all required fields are complete. If `AUTO_APPROVE_HOSTS=true`, instantly upgrades Clerk role to `host`. Otherwise, queues for admin review.',
        parameters: [{ '$ref': '#/components/parameters/sessionIdPath' }],
        responses: {
          200: {
            description: 'Submitted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', enum: ['submitted', 'auto_approved'] } },
                },
              },
            },
          },
          422: { description: 'Missing required fields', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
        },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN
    // ════════════════════════════════════════════════════════════════════════
    '/admin/host-applications': {
      get: {
        tags: ['Admin'],
        summary: 'List all submitted host applications',
        description: 'Requires `admin` or `super_admin` role.',
        responses: {
          200: { description: 'Applications', content: { 'application/json': { schema: { type: 'object', properties: { applications: { type: 'array', items: { '$ref': '#/components/schemas/OnboardingSession' } } } } } } },
          403: { '$ref': '#/components/responses/Forbidden' },
        },
      },
    },

    '/admin/host-applications/{sessionId}/approve': {
      post: {
        tags: ['Admin'],
        summary: 'Approve a host application — upgrades Clerk role to host',
        parameters: [{ '$ref': '#/components/parameters/sessionIdPath' }],
        responses: { 200: { description: 'Approved', content: { 'application/json': { schema: { type: 'object', properties: { application: { '$ref': '#/components/schemas/OnboardingSession' } } } } } } },
      },
    },

    '/admin/host-applications/{sessionId}/reject': {
      post: {
        tags: ['Admin'],
        summary: 'Reject a host application with a reason',
        parameters: [{ '$ref': '#/components/parameters/sessionIdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['reason'], properties: { reason: { type: 'string', minLength: 10, maxLength: 500 } } },
            },
          },
        },
        responses: { 200: { description: 'Rejected' } },
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // UPLOADS
    // ════════════════════════════════════════════════════════════════════════
    '/uploads/sign': {
      post: {
        tags: ['Uploads'],
        summary: 'Get a Cloudinary signed upload URL',
        description: 'Returns a signed upload URL. Upload directly from client to Cloudinary, then pass the `publicId` + `url` to the relevant endpoint.',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { folder: { type: 'string', example: 'casalux/listings', description: 'Cloudinary folder' } } },
            },
          },
        },
        responses: {
          200: {
            description: 'Signed upload params',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    uploadUrl:  { type: 'string', format: 'uri' },
                    signature:  { type: 'string' },
                    apiKey:     { type: 'string' },
                    timestamp:  { type: 'integer' },
                    folder:     { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const
