import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Navbar } from '@/components/layout/Navbar'
import { SWRProvider } from '@/components/providers/SWRProvider'
import './globals.css'

// Self-hosted via next/font — zero network round-trip, no render-blocking request
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'CasaLux — Luxury Short-Term Rentals',
    template: '%s | CasaLux',
  },
  description: 'Discover and book curated luxury stays around the world. Villas, cabins, beachfront retreats — all exceptionally appointed.',
  keywords: ['luxury rentals', 'vacation homes', 'short-term rentals', 'premium stays'],
  openGraph: {
    title: 'CasaLux — Luxury Short-Term Rentals',
    description: 'Discover and book curated luxury stays around the world.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${playfair.variable} ${inter.variable} scroll-smooth`} suppressHydrationWarning>
        <body className="min-h-screen bg-background text-foreground antialiased">
          <SWRProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-4rem)]">
              {children}
            </main>
            <Footer />
            <Analytics />
            <SpeedInsights />
          </SWRProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="#" className="hover:text-foreground transition-colors">Help Centre</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Safety information</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Cancellation options</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Hosting</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="/host/dashboard" className="hover:text-foreground transition-colors">Host your home</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Resources for hosts</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Community forum</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">CasaLux</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="#" className="hover:text-foreground transition-colors">Newsroom</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Investors</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Sitemap</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">© {new Date().getFullYear()} CasaLux, Inc. All rights reserved.</p>
          <p className="text-xs text-muted font-display italic">Curated luxury. Anywhere.</p>
        </div>
      </div>
    </footer>
  )
}
