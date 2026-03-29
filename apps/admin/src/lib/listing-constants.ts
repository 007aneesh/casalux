export const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'cabin', 'unique', 'hotel'] as const
export const ROOM_TYPES     = ['entire_place', 'private_room', 'shared_room'] as const
export const STATUSES       = ['draft', 'active', 'paused', 'archived', 'flagged'] as const
export const POLICIES       = ['flexible', 'moderate', 'strict', 'super_strict'] as const
export const CURRENCIES     = ['INR', 'USD', 'EUR', 'GBP', 'AED'] as const

export const STATUS_BADGE: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-700',
  active:   'bg-green-100 text-green-700',
  paused:   'bg-yellow-100 text-yellow-700',
  archived: 'bg-red-100 text-red-700',
  flagged:  'bg-orange-100 text-orange-700',
}

export interface AmenityDef { slug: string; name: string; category: string }

export const STANDARD_AMENITIES: AmenityDef[] = [
  // Essentials
  { slug: 'wifi',                  name: 'WiFi',                    category: 'Essentials'    },
  { slug: 'air_conditioning',      name: 'Air Conditioning',        category: 'Essentials'    },
  { slug: 'heating',               name: 'Heating',                 category: 'Essentials'    },
  { slug: 'kitchen',               name: 'Kitchen',                 category: 'Essentials'    },
  { slug: 'washer',                name: 'Washer',                  category: 'Essentials'    },
  { slug: 'dryer',                 name: 'Dryer',                   category: 'Essentials'    },
  { slug: 'tv',                    name: 'TV',                      category: 'Essentials'    },
  { slug: 'iron',                  name: 'Iron',                    category: 'Essentials'    },
  // Bathroom
  { slug: 'hot_tub',               name: 'Hot Tub',                 category: 'Bathroom'      },
  { slug: 'hair_dryer',            name: 'Hair Dryer',              category: 'Bathroom'      },
  { slug: 'shampoo',               name: 'Shampoo',                 category: 'Bathroom'      },
  // Outdoor
  { slug: 'pool',                  name: 'Pool',                    category: 'Outdoor'       },
  { slug: 'bbq_grill',             name: 'BBQ Grill',               category: 'Outdoor'       },
  { slug: 'outdoor_dining',        name: 'Outdoor Dining',          category: 'Outdoor'       },
  { slug: 'beach_access',          name: 'Beach Access',            category: 'Outdoor'       },
  { slug: 'beachfront',            name: 'Beachfront',              category: 'Outdoor'       },
  { slug: 'garden',                name: 'Garden',                  category: 'Outdoor'       },
  // Parking
  { slug: 'free_parking',          name: 'Free Parking',            category: 'Parking'       },
  { slug: 'ev_charger',            name: 'EV Charger',              category: 'Parking'       },
  // Safety
  { slug: 'smoke_alarm',           name: 'Smoke Alarm',             category: 'Safety'        },
  { slug: 'first_aid_kit',         name: 'First Aid Kit',           category: 'Safety'        },
  { slug: 'fire_extinguisher',     name: 'Fire Extinguisher',       category: 'Safety'        },
  { slug: 'carbon_monoxide_alarm', name: 'Carbon Monoxide Alarm',   category: 'Safety'        },
  // Features
  { slug: 'sea_view',              name: 'Sea View',                category: 'Features'      },
  { slug: 'mountain_view',         name: 'Mountain View',           category: 'Features'      },
  { slug: 'fireplace',             name: 'Fireplace',               category: 'Features'      },
  // Work
  { slug: 'dedicated_workspace',   name: 'Dedicated Workspace',     category: 'Work'          },
  { slug: 'fast_wifi',             name: 'Fast WiFi',               category: 'Work'          },
  { slug: 'standing_desk',         name: 'Standing Desk',           category: 'Work'          },
  { slug: 'monitor',               name: 'Monitor',                 category: 'Work'          },
  // Family
  { slug: 'crib',                  name: 'Crib',                    category: 'Family'        },
  { slug: 'high_chair',            name: 'High Chair',              category: 'Family'        },
  { slug: 'stair_gates',           name: 'Stair Gates',             category: 'Family'        },
  { slug: 'board_games',           name: 'Board Games',             category: 'Family'        },
  // Pet
  { slug: 'pets_allowed',          name: 'Pets Allowed',            category: 'Pet'           },
  { slug: 'dog_friendly',          name: 'Dog Friendly',            category: 'Pet'           },
  { slug: 'cat_litter_box',        name: 'Cat Litter Box',          category: 'Pet'           },
  // Accessibility
  { slug: 'wheelchair_accessible', name: 'Wheelchair Accessible',   category: 'Accessibility' },
  { slug: 'elevator',              name: 'Elevator',                category: 'Accessibility' },
  { slug: 'step_free_path',        name: 'Step-free Path',          category: 'Accessibility' },
  { slug: 'wide_doorways',         name: 'Wide Doorways',           category: 'Accessibility' },
]

export const STANDARD_AMENITY_SLUGS = new Set(STANDARD_AMENITIES.map((a) => a.slug))

/** Group STANDARD_AMENITIES by category, preserving order */
export function groupAmenitiesByCategory(amenities: AmenityDef[]): Record<string, AmenityDef[]> {
  const groups: Record<string, AmenityDef[]> = {}
  for (const a of amenities) {
    ;(groups[a.category] ??= []).push(a)
  }
  return groups
}
