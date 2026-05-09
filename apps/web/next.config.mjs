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

  // The aivoy embed proxy lives in src/app/aivoy/[...path]/route.ts — it
  // injects the casalux-web origin header so aivoy's per-token origin
  // allowlist sees a real origin (browsers don't send Origin on same-origin
  // GETs, which a plain rewrite can't work around). See that file for why.
}

export default nextConfig
