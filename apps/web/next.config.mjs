/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@casalux/ui', '@casalux/types', '@casalux/utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default nextConfig
