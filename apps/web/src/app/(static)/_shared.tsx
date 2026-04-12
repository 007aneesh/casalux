import Link from 'next/link'

// ─── Shared building blocks used by every static page ────────────────────────

export function PageHero({
  label,
  title,
  description,
}: {
  label: string
  title: string
  description: string
}) {
  return (
    <section className="bg-[rgb(var(--navy))] text-white py-16 sm:py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90 transition-colors mb-6"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>
        <p className="text-[rgb(var(--gold))] text-xs font-semibold uppercase tracking-widest mb-3">
          {label}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-4">{title}</h1>
        <p className="text-white/70 text-lg max-w-2xl">{description}</p>
      </div>
    </section>
  )
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
      {children}
    </div>
  )
}

export function PageContainerWide({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-screen-lg px-4 sm:px-6 py-14">
      {children}
    </div>
  )
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl font-semibold text-foreground mb-6 pb-3 border-b border-border">
      {children}
    </h2>
  )
}

export function Prose({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`prose prose-sm max-w-none text-foreground/80 leading-relaxed space-y-4 ${className}`}>
      {children}
    </div>
  )
}
