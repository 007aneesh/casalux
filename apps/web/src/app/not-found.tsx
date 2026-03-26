import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import { Button } from '@casalux/ui'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="font-display text-7xl font-bold text-navy/10 select-none">404</div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Page not found</h1>
          <p className="text-sm text-muted mt-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/">
            <Button variant="gold" size="lg" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go home
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Browse listings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
