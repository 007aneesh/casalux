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

  // Proxy the aivoy concierge embed through casalux's own origin. aivoy.vercel.app
  // is on Vercel's free plan and its system DDoS mitigations were flagging
  // cross-site <script> loads with `x-vercel-mitigated: deny` (403). Serving the
  // loader/standalone bundle and chat API as same-origin sidesteps that — the
  // browser sees casalux-web.vercel.app, the proxy quietly forwards to aivoy.
  // Long-term fix is a custom domain on the aivoy project; this is the bandage.
  async rewrites() {
    const host = process.env.AIVOY_PROXY_TARGET ?? 'https://aivoy.vercel.app'
    return [
      { source: '/aivoy/:path*', destination: `${host}/:path*` },
    ]
  },
}

export default nextConfig
