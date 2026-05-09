/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@casalux/ui', '@casalux/types', '@casalux/utils'],

  images: {
    // Serve AVIF where supported (~50% smaller than WebP), fall back to WebP
    formats: ['image/avif', 'image/webp'],
    // Cache optimised images for 30 days (default is 60s — far too short)
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  // Compress responses (brotli/gzip) — Vercel does this at the edge, but
  // this also applies when running behind a custom server / local dev
  compress: true,
}

export default nextConfig
