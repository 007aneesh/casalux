/**
 * Dependency Injection Container
 *
 * This is the ONE file where external provider adapters are wired up.
 * To swap a provider, change the adapter binding here — business logic is untouched.
 *
 * Example: swap Cloudinary → S3 by changing CloudinaryAdapter → S3Adapter below.
 */

import { CloudinaryAdapter } from '@casalux/services-storage'
import { StripeAdapter } from '@casalux/services-payment'
import { ElasticsearchAdapter } from '@casalux/services-search'
import { ResendAdapter } from '@casalux/services-email'
import { CacheService } from '@casalux/services-cache'
import { QueueService } from '@casalux/services-queue'

// ─── Storage ────────────────────────────────────────────────────────────────
// Swap: CloudinaryAdapter | S3Adapter | R2Adapter | GCSAdapter | LocalAdapter
export const storageService = new CloudinaryAdapter({
  cloudName: process.env['CLOUDINARY_CLOUD_NAME']!,
  apiKey: process.env['CLOUDINARY_API_KEY']!,
  apiSecret: process.env['CLOUDINARY_API_SECRET']!,
})

// ─── Payment ────────────────────────────────────────────────────────────────
// Swap: StripeAdapter | RazorpayAdapter | PaypalAdapter
export const paymentService = new StripeAdapter({
  secretKey: process.env['STRIPE_SECRET_KEY']!,
  webhookSecret: process.env['STRIPE_WEBHOOK_SECRET']!,
})

// ─── Search ─────────────────────────────────────────────────────────────────
// Swap: ElasticsearchAdapter | TypesenseAdapter | MeiliSearchAdapter
export const searchService = new ElasticsearchAdapter({
  node: process.env['ELASTICSEARCH_URL']!,
})

// ─── Email ──────────────────────────────────────────────────────────────────
// Swap: ResendAdapter | SendGridAdapter | SESAdapter | NodemailerAdapter
export const emailService = new ResendAdapter({
  apiKey: process.env['RESEND_API_KEY']!,
})

// ─── Cache (Redis) ──────────────────────────────────────────────────────────
export const cacheService = new CacheService({
  url: process.env['REDIS_URL']!,
})

// ─── Queue (BullMQ) ─────────────────────────────────────────────────────────
export const queueService = new QueueService({
  redisUrl: process.env['REDIS_URL']!,
})
