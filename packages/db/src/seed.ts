/**
 * Database seed — development only.
 * Creates amenity catalogue from PRD Appendix 18.1
 */
import { db } from './index.js'

const AMENITIES = [
  // Essentials
  { slug: 'wifi', name: 'WiFi', category: 'Essentials' },
  { slug: 'kitchen', name: 'Kitchen', category: 'Essentials' },
  { slug: 'washer', name: 'Washer', category: 'Essentials' },
  { slug: 'dryer', name: 'Dryer', category: 'Essentials' },
  { slug: 'air_conditioning', name: 'Air Conditioning', category: 'Essentials' },
  { slug: 'heating', name: 'Heating', category: 'Essentials' },
  { slug: 'tv', name: 'TV', category: 'Essentials' },
  { slug: 'iron', name: 'Iron', category: 'Essentials' },
  { slug: 'hair_dryer', name: 'Hair Dryer', category: 'Essentials' },
  // Safety
  { slug: 'smoke_alarm', name: 'Smoke Alarm', category: 'Safety' },
  { slug: 'carbon_monoxide_alarm', name: 'Carbon Monoxide Alarm', category: 'Safety' },
  { slug: 'fire_extinguisher', name: 'Fire Extinguisher', category: 'Safety' },
  { slug: 'first_aid_kit', name: 'First Aid Kit', category: 'Safety' },
  // Outdoor
  { slug: 'pool', name: 'Pool', category: 'Outdoor' },
  { slug: 'hot_tub', name: 'Hot Tub', category: 'Outdoor' },
  { slug: 'bbq_grill', name: 'BBQ Grill', category: 'Outdoor' },
  { slug: 'patio', name: 'Patio', category: 'Outdoor' },
  { slug: 'garden', name: 'Garden', category: 'Outdoor' },
  { slug: 'beach_access', name: 'Beach Access', category: 'Outdoor' },
  { slug: 'lake_access', name: 'Lake Access', category: 'Outdoor' },
  { slug: 'ski_in_out', name: 'Ski-in/Ski-out', category: 'Outdoor' },
  { slug: 'beachfront', name: 'Beachfront', category: 'Outdoor' },
  // Parking
  { slug: 'free_parking', name: 'Free Parking', category: 'Parking' },
  { slug: 'ev_charger', name: 'EV Charger', category: 'Parking' },
  { slug: 'garage_parking', name: 'Garage Parking', category: 'Parking' },
  { slug: 'street_parking', name: 'Street Parking', category: 'Parking' },
  // Features
  { slug: 'gym', name: 'Gym', category: 'Features' },
  { slug: 'sauna', name: 'Sauna', category: 'Features' },
  { slug: 'mountain_view', name: 'Mountain View', category: 'Features' },
  { slug: 'ocean_view', name: 'Ocean View', category: 'Features' },
  { slug: 'city_view', name: 'City View', category: 'Features' },
  { slug: 'fireplace', name: 'Fireplace', category: 'Features' },
  // Work
  { slug: 'dedicated_workspace', name: 'Dedicated Workspace', category: 'Work' },
  { slug: 'fast_wifi', name: 'Fast WiFi', category: 'Work' },
  { slug: 'standing_desk', name: 'Standing Desk', category: 'Work' },
  { slug: 'monitor', name: 'Monitor', category: 'Work' },
  // Family
  { slug: 'crib', name: 'Crib', category: 'Family' },
  { slug: 'high_chair', name: 'High Chair', category: 'Family' },
  { slug: 'stair_gates', name: 'Stair Gates', category: 'Family' },
  { slug: 'board_games', name: 'Board Games', category: 'Family' },
  // Pet
  { slug: 'pets_allowed', name: 'Pets Allowed', category: 'Pet' },
  { slug: 'dog_friendly', name: 'Dog Friendly', category: 'Pet' },
  { slug: 'cat_litter_box', name: 'Cat Litter Box', category: 'Pet' },
  // Accessibility
  { slug: 'wheelchair_accessible', name: 'Wheelchair Accessible', category: 'Accessibility' },
  { slug: 'elevator', name: 'Elevator', category: 'Accessibility' },
  { slug: 'step_free_path', name: 'Step-free Path', category: 'Accessibility' },
  { slug: 'wide_doorways', name: 'Wide Doorways', category: 'Accessibility' },
]

async function main() {
  console.log('🌱 Seeding database...')

  for (const amenity of AMENITIES) {
    await db.amenity.upsert({
      where: { slug: amenity.slug },
      update: { name: amenity.name, category: amenity.category },
      create: amenity,
    })
  }

  console.log(`✅ Seeded ${AMENITIES.length} amenities`)
  console.log('🏁 Seed complete')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
