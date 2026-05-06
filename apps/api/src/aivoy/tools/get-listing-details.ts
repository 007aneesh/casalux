/**
 * Tool: getListingDetails
 *
 * Use when the user wants more info about a listing they've already seen
 * (typically right after searchListings returned cards). The LLM passes the
 * listing id from a previous card.
 */

import { z } from 'zod'
import { defineAivoyTool } from '../registry.js'
import { toListingCard, type AivoyListingCard } from '../card-formatters.js'

const Schema = z.object({
  listingId: z.string().min(1).describe('Id returned by searchListings'),
})

type Args = z.infer<typeof Schema>

export const getListingDetails = defineAivoyTool({
  name: 'getListingDetails',
  description:
    'Fetch the full details of a single Casalux listing by id. Use this ' +
    'when the user asks a follow-up question about a specific listing they ' +
    "saw earlier — e.g. \"what's the cancellation policy?\" or \"how many " +
    'bedrooms?". Always prefer this over guessing from search results.',
  schema: Schema,
  // We render as a single listingCard so the user gets a visual reminder;
  // the LLM still has the full JSON in context to answer follow-ups.
  renderAs: 'listingCards',
  handler: async (args: Args, ctx): Promise<AivoyListingCard[]> => {
    const listing = await ctx.services.listings.getListingById(args.listingId)
    if (!listing) return []
    return [toListingCard(listing)]
  },
})
