/**
 * CasaLux Database Seed
 *
 * Creates:
 *  - Amenities (lookup table, including beachfront)
 *  - 3 test users  (1 guest, 1 host, 1 admin)
 *  - 4 listings    (Goa, Mumbai, Manali, Jaipur) — with images, quickFilterTags, amenities
 *  - 2 bookings    (one completed, one confirmed)
 *  - 1 review      (on the completed booking)
 *  - 1 wishlist    (guest's "Goa Trip" wishlist)
 *  - 1 message thread with 3 messages
 *
 * Run: pnpm db:seed  (from repo root)
 *
 * NOTE: Clerk user IDs are read from env vars. Set them before seeding:
 *   SEED_GUEST_CLERK_ID=user_xxx
 *   SEED_HOST_CLERK_ID=user_yyy
 *   SEED_ADMIN_CLERK_ID=user_zzz
 *
 * Get them from Clerk dashboard → Users after signing up on the app.
 */
import { db } from './index.js'

const CLERK_GUEST_ID = process.env['SEED_GUEST_CLERK_ID']  ?? 'user_guest_placeholder'
const CLERK_HOST_ID  = process.env['SEED_HOST_CLERK_ID']   ?? 'user_host_placeholder'
const CLERK_ADMIN_ID = process.env['SEED_ADMIN_CLERK_ID']  ?? 'user_admin_placeholder'

// ─── Amenities ────────────────────────────────────────────────────────────────
const AMENITIES = [
  { slug: 'wifi',               name: 'WiFi',                category: 'Essentials'    },
  { slug: 'air_conditioning',   name: 'Air Conditioning',    category: 'Essentials'    },
  { slug: 'heating',            name: 'Heating',             category: 'Essentials'    },
  { slug: 'kitchen',            name: 'Kitchen',             category: 'Essentials'    },
  { slug: 'washer',             name: 'Washer',              category: 'Essentials'    },
  { slug: 'dryer',              name: 'Dryer',               category: 'Essentials'    },
  { slug: 'tv',                 name: 'TV',                  category: 'Essentials'    },
  { slug: 'iron',               name: 'Iron',                category: 'Essentials'    },
  { slug: 'hot_tub',            name: 'Hot Tub',             category: 'Bathroom'      },
  { slug: 'hair_dryer',         name: 'Hair Dryer',          category: 'Bathroom'      },
  { slug: 'shampoo',            name: 'Shampoo',             category: 'Bathroom'      },
  { slug: 'pool',               name: 'Pool',                category: 'Outdoor'       },
  { slug: 'bbq_grill',          name: 'BBQ Grill',           category: 'Outdoor'       },
  { slug: 'outdoor_dining',     name: 'Outdoor Dining',      category: 'Outdoor'       },
  { slug: 'beach_access',       name: 'Beach Access',        category: 'Outdoor'       },
  { slug: 'beachfront',         name: 'Beachfront',          category: 'Outdoor'       },
  { slug: 'garden',             name: 'Garden',              category: 'Outdoor'       },
  { slug: 'free_parking',       name: 'Free Parking',        category: 'Parking'       },
  { slug: 'ev_charger',         name: 'EV Charger',          category: 'Parking'       },
  { slug: 'smoke_alarm',        name: 'Smoke Alarm',         category: 'Safety'        },
  { slug: 'first_aid_kit',      name: 'First Aid Kit',       category: 'Safety'        },
  { slug: 'fire_extinguisher',  name: 'Fire Extinguisher',   category: 'Safety'        },
  { slug: 'carbon_monoxide_alarm', name: 'Carbon Monoxide Alarm', category: 'Safety'  },
  { slug: 'sea_view',           name: 'Sea View',            category: 'Features'      },
  { slug: 'mountain_view',      name: 'Mountain View',       category: 'Features'      },
  { slug: 'fireplace',          name: 'Fireplace',           category: 'Features'      },
  { slug: 'dedicated_workspace',name: 'Dedicated Workspace', category: 'Work'          },
  { slug: 'fast_wifi',          name: 'Fast WiFi',           category: 'Work'          },
  { slug: 'standing_desk',      name: 'Standing Desk',       category: 'Work'          },
  { slug: 'monitor',            name: 'Monitor',             category: 'Work'          },
  { slug: 'crib',               name: 'Crib',                category: 'Family'        },
  { slug: 'high_chair',         name: 'High Chair',          category: 'Family'        },
  { slug: 'stair_gates',        name: 'Stair Gates',         category: 'Family'        },
  { slug: 'board_games',        name: 'Board Games',         category: 'Family'        },
  { slug: 'pets_allowed',       name: 'Pets Allowed',        category: 'Pet'           },
  { slug: 'dog_friendly',       name: 'Dog Friendly',        category: 'Pet'           },
  { slug: 'cat_litter_box',     name: 'Cat Litter Box',      category: 'Pet'           },
  { slug: 'wheelchair_accessible', name: 'Wheelchair Accessible', category: 'Accessibility' },
  { slug: 'elevator',           name: 'Elevator',            category: 'Accessibility' },
  { slug: 'step_free_path',     name: 'Step-free Path',      category: 'Accessibility' },
  { slug: 'wide_doorways',      name: 'Wide Doorways',       category: 'Accessibility' },
]

async function main() {
  console.log('🌱 Seeding CasaLux database...\n')

  // ── 1. Amenities ─────────────────────────────────────────────────────────────
  console.log('📦 Seeding amenities...')
  for (const amenity of AMENITIES) {
    await db.amenity.upsert({
      where:  { slug: amenity.slug },
      update: { name: amenity.name, category: amenity.category },
      create: amenity,
    })
  }
  console.log(`   ✅ ${AMENITIES.length} amenities ready\n`)

  // ── 2. Users ─────────────────────────────────────────────────────────────────
  console.log('👤 Seeding test users...')
  if (CLERK_GUEST_ID === 'user_guest_placeholder') {
    console.log('   ⚠️  Using placeholder Clerk IDs — set SEED_GUEST_CLERK_ID / SEED_HOST_CLERK_ID / SEED_ADMIN_CLERK_ID in .env\n')
  }

  const guest = await db.user.upsert({
    where:  { clerkId: CLERK_GUEST_ID },
    update: {},
    create: {
      clerkId:            CLERK_GUEST_ID,
      email:              'guest@casalux.dev',
      firstName:          'Priya',
      lastName:           'Sharma',
      profileImageUrl:    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      role:               'guest',
      verificationStatus: 'verified',
    },
  })

  const host = await db.user.upsert({
    where:  { clerkId: CLERK_HOST_ID },
    update: {},
    create: {
      clerkId:            CLERK_HOST_ID,
      email:              'host@casalux.dev',
      firstName:          'Arjun',
      lastName:           'Mehta',
      profileImageUrl:    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      role:               'host',
      verificationStatus: 'verified',
    },
  })

  const admin = await db.user.upsert({
    where:  { clerkId: CLERK_ADMIN_ID },
    update: {},
    create: {
      clerkId:            CLERK_ADMIN_ID,
      email:              'aneeshx000@gmail.com',
      firstName:          'Aneesh',
      lastName:           'Admin',
      role:               'admin',
      verificationStatus: 'verified',
    },
  })

  console.log(`   ✅ Guest: ${guest.firstName} ${guest.lastName} (${guest.clerkId})`)
  console.log(`   ✅ Host:  ${host.firstName} ${host.lastName}  (${host.clerkId})`)
  console.log(`   ✅ Admin: ${admin.firstName} ${admin.lastName} (${admin.clerkId})\n`)

  // ── 3. Host Profile ──────────────────────────────────────────────────────────
  const hostProfile = await db.hostProfile.upsert({
    where:  { userId: host.id },
    update: {},
    create: {
      userId:               host.id,
      bio:                  'Superhost with properties across Goa and Mumbai. Your comfort is my top priority.',
      responseRate:         98,
      avgResponseTimeHours: 1,
      isSuperhost:          true,
      totalListings:        4,
    },
  })

  // ── 4. Listings ──────────────────────────────────────────────────────────────
  // Images must match the ListingImage type:
  //   { publicId, url, width, height, isPrimary, order }
  // quickFilterTags drive the home-feed filters — set explicitly here.
  console.log('🏠 Seeding listings...')

  const listing1 = await db.listing.upsert({
    where:  { id: 'seed-listing-goa-villa' },
    update: {},
    create: {
      id:           'seed-listing-goa-villa',
      hostId:       hostProfile.id,
      title:        'Luxury Beach Villa with Private Pool — North Goa',
      description:  'Wake up to the sound of waves in this stunning 3-bedroom beach villa. Private pool, direct beachfront access, fully equipped kitchen, and daily housekeeping. Just 2 minutes walk to Anjuna Beach.',
      propertyType: 'villa',
      roomType:     'entire_place',
      status:       'active',
      basePrice:    800000,
      currency:     'INR',
      cleaningFee:  150000,
      maxGuests:    8,
      bedrooms:     3,
      beds:         4,
      baths:        3,
      address: {
        street:  'Ozran Beach Road',
        city:    'Anjuna',
        state:   'Goa',
        country: 'India',
        zip:     '403509',
      },
      lat:                15.5706,
      lng:                73.7380,
      cancellationPolicy: 'moderate',
      instantBook:        true,
      checkInTime:        '14:00',
      checkOutTime:       '11:00',
      minNights:          2,
      maxNights:          30,
      avgRating:          4.9,
      totalReviews:       47,
      // Tags drive quick filters on the home feed
      quickFilterTags: ['beachfront', 'amazing_pools', 'trending'],
      images: [
        { publicId: 'seed-goa-1', url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200', isPrimary: true,  order: 0, width: 1200, height: 800 },
        { publicId: 'seed-goa-2', url: 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=1200', isPrimary: false, order: 1, width: 1200, height: 800 },
        { publicId: 'seed-goa-3', url: 'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=1200', isPrimary: false, order: 2, width: 1200, height: 800 },
        { publicId: 'seed-goa-4', url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200', isPrimary: false, order: 3, width: 1200, height: 800 },
        { publicId: 'seed-goa-5', url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200', isPrimary: false, order: 4, width: 1200, height: 800 },
      ],
    },
  })

  const listing2 = await db.listing.upsert({
    where:  { id: 'seed-listing-mumbai-apt' },
    update: {},
    create: {
      id:           'seed-listing-mumbai-apt',
      hostId:       hostProfile.id,
      title:        'Modern Sea-View Studio — Bandra West, Mumbai',
      description:  'Stylish studio on the 18th floor with panoramic Arabian Sea views. Heart of Bandra West — walk to Carter Road, restaurants, and nightlife. Fast WiFi, dedicated workspace, fully equipped.',
      propertyType: 'apartment',
      roomType:     'entire_place',
      status:       'active',
      basePrice:    350000,
      currency:     'INR',
      cleaningFee:  80000,
      maxGuests:    2,
      bedrooms:     0,
      beds:         1,
      baths:        1,
      address: {
        street:  '12 Waterfield Road',
        city:    'Mumbai',
        state:   'Maharashtra',
        country: 'India',
        zip:     '400050',
      },
      lat:                19.0596,
      lng:                72.8295,
      cancellationPolicy: 'flexible',
      instantBook:        true,
      checkInTime:        '13:00',
      checkOutTime:       '11:00',
      minNights:          1,
      maxNights:          90,
      avgRating:          4.7,
      totalReviews:       23,
      quickFilterTags: ['trending', 'instant_book'],
      images: [
        { publicId: 'seed-mumbai-1', url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200', isPrimary: true,  order: 0, width: 1200, height: 800 },
        { publicId: 'seed-mumbai-2', url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200', isPrimary: false, order: 1, width: 1200, height: 800 },
        { publicId: 'seed-mumbai-3', url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200', isPrimary: false, order: 2, width: 1200, height: 800 },
      ],
    },
  })

  const listing3 = await db.listing.upsert({
    where:  { id: 'seed-listing-manali-cabin' },
    update: {},
    create: {
      id:           'seed-listing-manali-cabin',
      hostId:       hostProfile.id,
      title:        'Himalayan Pine Log Cabin — Old Manali',
      description:  'Cosy pine cabin in Himalayan forests. Fireplace, private balcony with snow-capped mountain views. 10-minute walk to Old Manali market. Pet-friendly. Perfect for couples and small families.',
      propertyType: 'cabin',
      roomType:     'entire_place',
      status:       'active',
      basePrice:    450000,
      currency:     'INR',
      cleaningFee:  100000,
      maxGuests:    4,
      bedrooms:     2,
      beds:         2,
      baths:        1,
      address: {
        street:  'Manu Temple Road, Old Manali',
        city:    'Manali',
        state:   'Himachal Pradesh',
        country: 'India',
        zip:     '175131',
      },
      lat:                32.2639,
      lng:                77.1892,
      cancellationPolicy: 'strict',
      instantBook:        false,
      checkInTime:        '15:00',
      checkOutTime:       '10:00',
      minNights:          2,
      maxNights:          14,
      avgRating:          4.8,
      totalReviews:       31,
      quickFilterTags: ['cabins', 'pet_friendly', 'trending'],
      images: [
        { publicId: 'seed-manali-1', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200', isPrimary: true,  order: 0, width: 1200, height: 800 },
        { publicId: 'seed-manali-2', url: 'https://images.unsplash.com/photo-1490526047243-855c50ab9f3e?w=1200', isPrimary: false, order: 1, width: 1200, height: 800 },
        { publicId: 'seed-manali-3', url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200', isPrimary: false, order: 2, width: 1200, height: 800 },
        { publicId: 'seed-manali-4', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', isPrimary: false, order: 3, width: 1200, height: 800 },
      ],
    },
  })

  const listing4 = await db.listing.upsert({
    where:  { id: 'seed-listing-jaipur-haveli' },
    update: {},
    create: {
      id:           'seed-listing-jaipur-haveli',
      hostId:       hostProfile.id,
      title:        'Heritage Haveli with Rooftop Pool — Pink City, Jaipur',
      description:  'Live like royalty in this 200-year-old heritage haveli. Rooftop infinity pool, traditional Rajasthani architecture with modern comforts, steps from Hawa Mahal. Concierge, chef on request.',
      propertyType: 'house',
      roomType:     'entire_place',
      status:       'active',
      basePrice:    1200000,
      currency:     'INR',
      cleaningFee:  200000,
      maxGuests:    10,
      bedrooms:     4,
      beds:         5,
      baths:        4,
      address: {
        street:  'Chandpol Bazaar',
        city:    'Jaipur',
        state:   'Rajasthan',
        country: 'India',
        zip:     '302001',
      },
      lat:                26.9239,
      lng:                75.8267,
      cancellationPolicy: 'moderate',
      instantBook:        true,
      checkInTime:        '15:00',
      checkOutTime:       '12:00',
      minNights:          2,
      maxNights:          21,
      avgRating:          5.0,
      totalReviews:       12,
      quickFilterTags: ['amazing_pools', 'luxe', 'trending'],
      images: [
        { publicId: 'seed-jaipur-1', url: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200', isPrimary: true,  order: 0, width: 1200, height: 800 },
        { publicId: 'seed-jaipur-2', url: 'https://images.unsplash.com/photo-1590086782957-93c06ef21604?w=1200', isPrimary: false, order: 1, width: 1200, height: 800 },
        { publicId: 'seed-jaipur-3', url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200', isPrimary: false, order: 2, width: 1200, height: 800 },
        { publicId: 'seed-jaipur-4', url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200', isPrimary: false, order: 3, width: 1200, height: 800 },
      ],
    },
  })

  console.log(`   ✅ ${listing1.title}`)
  console.log(`   ✅ ${listing2.title}`)
  console.log(`   ✅ ${listing3.title}`)
  console.log(`   ✅ ${listing4.title}\n`)

  // ── 5. Link amenities to listings ────────────────────────────────────────────
  async function linkAmenities(listingId: string, slugs: string[]) {
    for (const slug of slugs) {
      const amenity = await db.amenity.findUnique({ where: { slug } })
      if (!amenity) continue
      await db.listingAmenity.upsert({
        where:  { listingId_amenityId: { listingId, amenityId: amenity.id } },
        update: {},
        create: { listingId, amenityId: amenity.id },
      })
    }
  }

  // Goa: beachfront + pool → enables 'beachfront' and 'amazing_pools' quick filters
  await linkAmenities(listing1.id, [
    'wifi', 'pool', 'air_conditioning', 'kitchen', 'beachfront', 'beach_access',
    'bbq_grill', 'outdoor_dining', 'free_parking', 'smoke_alarm', 'first_aid_kit', 'sea_view',
  ])
  // Mumbai: sea view, workspace
  await linkAmenities(listing2.id, [
    'wifi', 'fast_wifi', 'air_conditioning', 'kitchen', 'tv', 'dedicated_workspace',
    'smoke_alarm', 'sea_view', 'elevator', 'washer', 'iron',
  ])
  // Manali: cabin + pets → enables 'cabins' and 'pet_friendly' quick filters
  await linkAmenities(listing3.id, [
    'wifi', 'heating', 'kitchen', 'fireplace', 'mountain_view', 'free_parking',
    'pets_allowed', 'dog_friendly', 'smoke_alarm', 'bbq_grill', 'board_games',
  ])
  // Jaipur: pool + high price → enables 'amazing_pools' and 'luxe' quick filters
  await linkAmenities(listing4.id, [
    'wifi', 'pool', 'air_conditioning', 'kitchen', 'tv', 'free_parking',
    'smoke_alarm', 'first_aid_kit', 'bbq_grill', 'outdoor_dining', 'hot_tub',
  ])
  console.log('   ✅ Amenities linked to all listings\n')

  // ── 6. Bookings ───────────────────────────────────────────────────────────────
  console.log('📅 Seeding bookings...')

  const completedBooking = await db.booking.upsert({
    where:  { id: 'seed-booking-completed' },
    update: {},
    create: {
      id:                 'seed-booking-completed',
      listingId:          listing1.id,
      guestId:            guest.clerkId,
      hostId:             hostProfile.id,
      checkIn:            new Date('2025-10-01'),
      checkOut:           new Date('2025-10-06'),
      nights:             5,
      guests:             4,
      baseSubtotal:       4000000,
      cleaningFee:        150000,
      platformServiceFee: 492000,
      totalAmount:        4642000,
      hostPayout:         3808000,
      currency:           'INR',
      status:             'completed',
      paymentProvider:    'stripe',
      paymentOrderId:     'pi_seed_completed_001',
      paymentId:          'pi_seed_completed_001',
      idempotencyKey:     'seed-booking-completed-idem',
    },
  })

  const confirmedBooking = await db.booking.upsert({
    where:  { id: 'seed-booking-confirmed' },
    update: {},
    create: {
      id:                 'seed-booking-confirmed',
      listingId:          listing2.id,
      guestId:            guest.clerkId,
      hostId:             hostProfile.id,
      checkIn:            new Date('2025-12-20'),
      checkOut:           new Date('2025-12-25'),
      nights:             5,
      guests:             2,
      baseSubtotal:       1750000,
      cleaningFee:        80000,
      platformServiceFee: 218400,
      totalAmount:        2048400,
      hostPayout:         1681600,
      currency:           'INR',
      status:             'confirmed',
      paymentProvider:    'stripe',
      paymentOrderId:     'pi_seed_confirmed_001',
      paymentId:          'pi_seed_confirmed_001',
      idempotencyKey:     'seed-booking-confirmed-idem',
    },
  })

  console.log(`   ✅ Completed booking: ${completedBooking.id} (Goa villa, Oct 2025)`)
  console.log(`   ✅ Confirmed booking: ${confirmedBooking.id} (Mumbai studio, Dec 2025)\n`)

  // ── 7. Review ────────────────────────────────────────────────────────────────
  console.log('⭐ Seeding review...')

  const review = await db.review.upsert({
    where:  { bookingId: completedBooking.id },
    update: {},
    create: {
      bookingId:         completedBooking.id,
      listingId:         listing1.id,
      guestId:           guest.clerkId,
      rating:            5,
      comment:           'Absolutely stunning property! The private pool and direct beach access made this trip unforgettable. Arjun was an amazing host — responsive, attentive, and full of local tips. Already planning our return trip!',
      cleanlinessRating: 5,
      accuracyRating:    5,
      locationRating:    5,
      checkInRating:     5,
      valueRating:       4,
      hostResponse:      'Thank you so much, Priya! It was an absolute pleasure hosting you. Looking forward to welcoming you back! 🌴',
    },
  })

  console.log(`   ✅ Review (${review.rating}★) on Goa villa with host response\n`)

  // ── 8. Wishlist ───────────────────────────────────────────────────────────────
  console.log('❤️  Seeding wishlist...')

  const wishlist = await db.wishlist.upsert({
    where:  { id: 'seed-wishlist-1' },
    update: {},
    create: { id: 'seed-wishlist-1', userId: guest.id, name: 'Goa Trip 🏖️' },
  })

  for (const lid of [listing1.id, listing4.id]) {
    await db.wishlistItem.upsert({
      where:  { wishlistId_listingId: { wishlistId: wishlist.id, listingId: lid } },
      update: {},
      create: { wishlistId: wishlist.id, listingId: lid },
    })
  }

  console.log(`   ✅ Wishlist "${wishlist.name}" with 2 listings\n`)

  // ── 9. Message thread ────────────────────────────────────────────────────────
  console.log('💬 Seeding message thread...')

  const thread = await db.messageThread.upsert({
    where:  { id: 'seed-thread-1' },
    update: {},
    create: {
      id:               'seed-thread-1',
      guestId:          guest.clerkId,
      hostId:           host.clerkId,
      bookingId:        confirmedBooking.id,
      unreadCountGuest: 1,
      unreadCountHost:  0,
      lastMessageAt:    new Date('2025-11-15T10:30:00Z'),
    },
  })

  const messages = [
    { id: 'seed-msg-1', senderId: guest.clerkId, body: 'Hi Arjun! Excited about our December stay. Any parking tips and best way from airport?',                                                                                 createdAt: new Date('2025-11-14T09:00:00Z') },
    { id: 'seed-msg-2', senderId: host.clerkId,  body: 'Hi Priya! 2 reserved spots in the basement — mention my name to security. For the airport, Ola/Uber takes ~45 min. Looking forward to hosting you!',                    createdAt: new Date('2025-11-14T09:45:00Z') },
    { id: 'seed-msg-3', senderId: guest.clerkId, body: 'Perfect, thank you! Is early check-in around 11am possible? Our flight lands at 8am.',                                                                                   createdAt: new Date('2025-11-15T10:30:00Z') },
  ]

  for (const msg of messages) {
    await db.message.upsert({
      where:  { id: msg.id },
      update: {},
      create: { ...msg, threadId: thread.id },
    })
  }

  console.log(`   ✅ Thread with ${messages.length} messages (guest ↔ host, re: Mumbai booking)\n`)

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════')
  console.log('🏁 Seed complete!\n')
  console.log('  ⚠️  Next step: run  pnpm --filter @casalux/api es:sync')
  console.log('     to index listings into Elasticsearch\n')
  console.log('  Public endpoints (no auth needed):')
  console.log('  GET  /api/v1/listings')
  console.log('  GET  /api/v1/listings/seed-listing-goa-villa')
  console.log('  GET  /api/v1/listings/seed-listing-goa-villa/reviews')
  console.log('  GET  /api/v1/listings/seed-listing-goa-villa/pricing-preview?checkIn=2025-12-24&checkOut=2025-12-28&guests=2')
  console.log('  GET  /api/v1/locations/autocomplete?q=Goa')
  console.log('')
  console.log('  Authenticated (paste JWT in Swagger Authorize):')
  console.log('  GET  /api/v1/users/me/bookings')
  console.log('  GET  /api/v1/users/me/wishlists')
  console.log('  GET  /api/v1/messages/threads')
  console.log('  POST /api/v1/bookings/initiate')
  console.log('')
  console.log('  📖 Swagger UI  → http://localhost:3001/docs')
  console.log('  📄 OpenAPI JSON→ http://localhost:3001/api/v1/openapi.json')
  console.log('═══════════════════════════════════════════════════\n')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
