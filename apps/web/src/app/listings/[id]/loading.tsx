/**
 * Instant loading skeleton for /listings/[id].
 *
 * Shown while the server component fetches listing data from the API.
 * Prevents a blank white screen on first load (cold API start / cache miss).
 */
export default function ListingLoading() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-8 pb-24 lg:pb-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-10 rounded bg-surface shimmer" />
        <div className="h-4 w-4 rounded bg-surface shimmer" />
        <div className="h-4 w-32 rounded bg-surface shimmer" />
      </div>

      {/* Title */}
      <div className="mb-5 space-y-3">
        <div className="h-8 w-2/3 rounded-lg bg-surface shimmer" />
        <div className="h-4 w-1/3 rounded-lg bg-surface shimmer" />
      </div>

      {/* Image gallery skeleton */}
      <div className="hidden sm:grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[480px]">
        <div className="col-span-2 row-span-2 bg-surface shimmer" />
        <div className="bg-surface shimmer" />
        <div className="bg-surface shimmer" />
        <div className="bg-surface shimmer" />
        <div className="bg-surface shimmer" />
      </div>
      <div className="sm:hidden aspect-[4/3] rounded-2xl bg-surface shimmer" />

      {/* Content + sidebar */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
        {/* Left */}
        <div className="space-y-6">
          <div className="pb-6 border-b border-border space-y-2">
            <div className="h-6 w-48 rounded-lg bg-surface shimmer" />
            <div className="h-4 w-24 rounded-lg bg-surface shimmer" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-surface shimmer" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-5 w-40 rounded-lg bg-surface shimmer" />
            <div className="h-4 w-full rounded-lg bg-surface shimmer" />
            <div className="h-4 w-5/6 rounded-lg bg-surface shimmer" />
            <div className="h-4 w-4/6 rounded-lg bg-surface shimmer" />
          </div>
        </div>

        {/* Right — booking widget skeleton */}
        <div className="hidden lg:block">
          <div className="rounded-2xl border border-border p-6 space-y-4">
            <div className="h-7 w-32 rounded-lg bg-surface shimmer" />
            <div className="h-24 rounded-xl bg-surface shimmer" />
            <div className="h-12 rounded-xl bg-surface shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}
