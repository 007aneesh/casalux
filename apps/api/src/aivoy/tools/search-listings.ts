/**
 * Tool: searchListings
 *
 * What the LLM uses it for: any "show me stays in X" / "find rentals for Y guests
 * in Z" / "anywhere with a pool under $500" type query.
 *
 * Args are mapped onto Casalux's existing ListingSearchParams; we don't expose
 * everything the public listings API supports (e.g. pagination) — keep the
 * surface area focused on what makes sense for a chat interface.
 */

import { z } from 'zod'
import { defineAivoyTool } from '../registry.js'
import { toListingCard, type AivoyListingCard } from '../card-formatters.js'

const Schema = z.object({
  query: z.string().optional().describe('Free-text destination or keyword. Only set if the user named a place.'),
  city: z.string().optional().describe('City name. Only set if the user named one — never invent.'),
  country: z.string().optional().describe('Country name. Only set if the user named one — never invent.'),
  checkIn: z.string().optional().describe('YYYY-MM-DD. Only if the user gave dates.'),
  checkOut: z.string().optional().describe('YYYY-MM-DD. Only if the user gave dates.'),
  guests: z.number().int().min(1).optional().describe('Guest count. Only set if the user specified one — do NOT default to 1.'),
  minPrice: z.number().nonnegative().optional().describe('REQUIRED whenever the user mentions a minimum price (e.g. "above 2000", "at least ₹3000"). In MAJOR currency units (rupees / dollars), not paise / cents. Example: user says "above 2k" → minPrice: 2000.'),
  maxPrice: z.number().positive().optional().describe('REQUIRED whenever the user mentions a maximum price (e.g. "under 5000", "below ₹4k", "less than 100 dollars", "max 5k", "cheap"). In MAJOR currency units (rupees / dollars), not paise / cents. Example: user says "under 5000" → maxPrice: 5000. Failing to set this will return listings the user does not want.'),
  amenities: z.array(z.string()).optional(),
  petFriendly: z.boolean().optional(),
  instantBook: z.boolean().optional(),
  limit: z.number().int().min(1).max(12).default(6),
})

type Args = z.infer<typeof Schema>

export const searchListings = defineAivoyTool({
  name: 'searchListings',
  description:
    'Search Casalux luxury short-term rentals by city, country, dates, ' +
    'guest count, price range, and amenities. Returns a curated list of ' +
    'listings as cards. Use this whenever the user wants to discover stays.',
  schema: Schema,
  renderAs: 'listingCards',
  handler: async (args: Args, ctx): Promise<AivoyListingCard[]> => {
    // Casalux's ListingSearchParams has `location` as the free-text field.
    const location = args.query ?? args.city ?? args.country
    const MINOR_PER_MAJOR = 100
    const result = await ctx.services.listings.getListings({
      location,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      guests: args.guests,
      minPrice: args.minPrice != null ? args.minPrice * MINOR_PER_MAJOR : undefined,
      maxPrice: args.maxPrice != null ? args.maxPrice * MINOR_PER_MAJOR : undefined,
      amenities: args.amenities,
      petFriendly: args.petFriendly,
      instantBook: args.instantBook,
      page: 1,
      limit: args.limit,
    })

    const rows: any[] = result?.data ?? []
    return rows.map(toListingCard)
  },
})
