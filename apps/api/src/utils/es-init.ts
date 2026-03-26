/**
 * Ensures all required Elasticsearch indices exist with correct mappings.
 * Called once on API startup — safe to run repeatedly (idempotent).
 *
 * Mapping rules:
 * - avgRating / totalReviews → float/integer so they support both range filters AND sorting
 * - location → geo_point for geo_distance queries
 * - title gets a .suggest completion sub-field for autocomplete
 * - keyword fields are not analyzed (exact match)
 */
import type { ISearchService } from '@casalux/services-search'

const LISTINGS_MAPPING = {
  properties: {
    id:                 { type: 'keyword' },
    title: {
      type: 'text',
      fields: {
        suggest: { type: 'completion' },
      },
    },
    description:        { type: 'text' },
    hostId:             { type: 'keyword' },
    status:             { type: 'keyword' },
    propertyType:       { type: 'keyword' },
    roomType:           { type: 'keyword' },
    amenities:          { type: 'keyword' },
    cancellationPolicy: { type: 'keyword' },
    location:           { type: 'geo_point' },
    // address stored as filterable keywords + indexed for city/country search
    address: {
      properties: {
        street:  { type: 'keyword', index: false },
        city:    { type: 'keyword' },
        state:   { type: 'keyword' },
        country: { type: 'keyword' },
        zip:     { type: 'keyword', index: false },
      },
    },
    city:               { type: 'keyword' },
    country:            { type: 'keyword' },
    // images stored in _source but not indexed — only used for display
    images:             { enabled: false },
    basePrice:          { type: 'double' },
    currency:           { type: 'keyword' },
    minNights:          { type: 'integer' },
    maxGuests:          { type: 'integer' },
    bedrooms:           { type: 'integer' },
    beds:               { type: 'integer' },
    baths:              { type: 'integer' },
    instantBook:        { type: 'boolean' },
    avgRating:          { type: 'float' },
    totalReviews:       { type: 'integer' },
    createdAt:          { type: 'date' },
    isNewListing:       { type: 'boolean' },
    quickFilterTags:    { type: 'keyword' },
  },
}

export async function ensureESIndices(searchService: ISearchService): Promise<void> {
  try {
    await searchService.ensureIndex('listings', LISTINGS_MAPPING)
  } catch (err) {
    // Non-fatal — API can still serve cached/DB responses without ES
    console.error('[ES] Failed to ensure indices:', err)
  }
}
