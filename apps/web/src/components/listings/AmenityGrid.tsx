'use client'

import { useState } from 'react'
import {
  Wifi, ChefHat, Waves, Dumbbell, Flame, Thermometer,
  Wind, Tv, PawPrint, Car, Zap, Mountain, Eye, TreePine,
  Baby, Accessibility, Key, Shield, AlertTriangle, Shirt,
  Coffee, Snowflake, Monitor, Utensils, Bath,
} from 'lucide-react'
import { Button } from '@casalux/ui'

const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  kitchen: ChefHat,
  pool: Waves,
  hot_tub: Waves,
  gym: Dumbbell,
  fireplace: Flame,
  heating: Thermometer,
  air_conditioning: Wind,
  tv: Tv,
  pets_allowed: PawPrint,
  free_parking: Car,
  ev_charger: Zap,
  mountain_view: Mountain,
  ocean_view: Eye,
  garden: TreePine,
  crib: Baby,
  wheelchair_accessible: Accessibility,
  self_checkin: Key,
  smoke_alarm: Shield,
  carbon_monoxide_alarm: AlertTriangle,
  washer: Shirt,
  dryer: Shirt,
  coffee: Coffee,
  dedicated_workspace: Monitor,
  standing_desk: Monitor,
  fast_wifi: Wifi,
  bbq_grill: Utensils,
  sauna: Bath,
  default: Snowflake,
}

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wifi',
  kitchen: 'Full kitchen',
  pool: 'Private pool',
  hot_tub: 'Hot tub',
  gym: 'Gym',
  fireplace: 'Indoor fireplace',
  heating: 'Central heating',
  air_conditioning: 'Air conditioning',
  tv: 'Smart TV',
  pets_allowed: 'Pets allowed',
  free_parking: 'Free parking',
  ev_charger: 'EV charger',
  mountain_view: 'Mountain view',
  ocean_view: 'Ocean view',
  garden: 'Private garden',
  crib: 'Crib',
  wheelchair_accessible: 'Wheelchair accessible',
  self_checkin: 'Self check-in',
  smoke_alarm: 'Smoke alarm',
  carbon_monoxide_alarm: 'CO alarm',
  washer: 'Washer',
  dryer: 'Dryer',
  bbq_grill: 'BBQ grill',
  dedicated_workspace: 'Dedicated workspace',
  fast_wifi: 'Fast wifi (100+ Mbps)',
  sauna: 'Sauna',
  beachfront: 'Beachfront',
  beach_access: 'Beach access',
  ski_in_out: 'Ski-in / Ski-out',
  lake_access: 'Lake access',
}

interface AmenityGridProps {
  amenities: string[]
}

const PREVIEW_COUNT = 10

export function AmenityGrid({ amenities }: AmenityGridProps) {
  const [expanded, setExpanded] = useState(false)

  // Only render amenities that have a known label
  const known = amenities.filter((slug) => !!AMENITY_LABELS[slug])

  if (known.length === 0) return null

  const visible = expanded ? known : known.slice(0, PREVIEW_COUNT)
  const hasMore = known.length > PREVIEW_COUNT

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((slug) => {
          const Icon = AMENITY_ICONS[slug] ?? AMENITY_ICONS.default
          const label = AMENITY_LABELS[slug]
          return (
            <div key={slug} className="flex items-center gap-3 py-2">
              <Icon className="h-5 w-5 text-foreground shrink-0" />
              <span className="text-sm text-foreground">{label}</span>
            </div>
          )
        })}
      </div>
      {hasMore && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show fewer amenities' : `Show all ${known.length} amenities`}
          </Button>
        </div>
      )}
    </div>
  )
}
