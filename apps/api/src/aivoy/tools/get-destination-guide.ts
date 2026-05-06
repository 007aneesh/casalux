/**
 * Tool: getDestinationGuide
 *
 * Use when the user asks "what's good in <city>?" / "best time to visit X?".
 * Returns short editorial-style copy the LLM can quote from. Replace the
 * stub source with whatever Casalux actually uses (CMS, static JSON, an
 * editor-curated table) — the contract above the data layer is stable.
 */

import { z } from 'zod'
import { defineAivoyTool } from '../registry.js'

const Schema = z.object({
  city: z.string().min(1),
  month: z
    .string()
    .optional()
    .describe('Month name or YYYY-MM. Optional — adds seasonal hints.'),
})

type Args = z.infer<typeof Schema>

interface DestinationGuide {
  city: string
  summary: string
  bestNeighborhoods: string[]
  monthlyHints?: string
  source: string
}

export const getDestinationGuide = defineAivoyTool({
  name: 'getDestinationGuide',
  description:
    'Return a short travel guide for a city: vibe, popular neighborhoods, ' +
    'and (optional) seasonal hints. Use this when the user is researching a ' +
    "destination and hasn't yet asked for specific listings.",
  schema: Schema,
  // No card — just plain text the LLM weaves into the reply.
  handler: async (args: Args): Promise<DestinationGuide> => {
    // TODO: replace with a real CMS lookup or curated table. Until then we
    // return a structured stub the LLM can still phrase nicely.
    return {
      city: args.city,
      summary: `${args.city} is one of the destinations available on Casalux.`,
      bestNeighborhoods: [],
      monthlyHints: args.month ? `No tailored notes for ${args.month} yet.` : undefined,
      source: 'casalux-editorial-stub',
    }
  },
})
