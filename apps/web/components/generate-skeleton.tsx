'use client'

/**
 * Skeleton loader for the generate results area.
 * Matches the layout: 3 phase cards + intensity arc + track rows.
 */
export function GenerateSkeleton() {
  return (
    <div className="space-y-3 animate-fade-slide-up">
      {/* Phase card skeletons */}
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`${i === 2 ? 'flex-[2]' : 'flex-1'} bg-[var(--surface-1)] rounded-xl border border-[var(--border)] p-3 animate-pulse`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-16 bg-[var(--surface-3)] rounded" />
                <div className="h-3 w-12 bg-[var(--surface-2)] rounded" />
                <div className="h-3 w-8 bg-[var(--surface-2)] rounded" />
              </div>
              <div className="h-12 w-12 rounded-full bg-[var(--surface-2)]" />
            </div>
          </div>
        ))}
      </div>

      {/* Intensity arc skeleton */}
      <div className="h-14 bg-[var(--surface-1)] rounded-lg animate-pulse" />

      {/* Track row skeletons */}
      <div className="space-y-1">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-2 py-1.5 animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="w-7 h-4 bg-[var(--surface-2)] rounded" />
            <div className="w-8 h-8 bg-[var(--surface-2)] rounded" />
            <div className="flex-1 space-y-1">
              <div className="h-3.5 w-32 bg-[var(--surface-3)] rounded" />
              <div className="h-3 w-20 bg-[var(--surface-2)] rounded" />
            </div>
            <div className="h-4 w-16 bg-[var(--surface-2)] rounded" />
            <div className="h-3 w-10 bg-[var(--surface-2)] rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
