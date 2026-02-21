'use client'

import { cn } from '@/lib/utils'

const ZONE_COLORS: Record<number, string> = {
  1: 'var(--zone-1)',
  2: 'var(--zone-2)',
  3: 'var(--zone-3)',
  4: 'var(--zone-4)',
  5: 'var(--zone-5)',
}

const ZONE_LABELS: Record<number, string> = {
  1: 'Z1',
  2: 'Z2',
  3: 'Z3',
  4: 'Z4',
  5: 'Z5',
}

export interface ZoneDistributionBarProps {
  zones: { zone: number; percentage: number }[]
  animated?: boolean
  showLabels?: boolean
  showPercentages?: boolean
  height?: number
  className?: string
}

/**
 * Stacked horizontal bar showing percentage of time in each HR zone.
 * Zones are colored from gray (Z1) through blue, green, amber to red (Z5).
 */
export function ZoneDistributionBar({
  zones,
  animated = true,
  showLabels = true,
  showPercentages = true,
  height = 12,
  className,
}: ZoneDistributionBarProps) {
  // Sort zones by zone number
  const sortedZones = [...zones].sort((a, b) => a.zone - b.zone)

  // Normalize percentages if they don't add up to 100
  const total = sortedZones.reduce((sum, z) => sum + z.percentage, 0)
  const normalized = sortedZones.map((z) => ({
    ...z,
    percentage: total > 0 ? (z.percentage / total) * 100 : 0,
  }))

  return (
    <div className={cn('w-full', className)}>
      {/* Bar */}
      <div
        className="w-full rounded-full overflow-hidden flex"
        style={{ height }}
        role="img"
        aria-label={`HR Zone distribution: ${normalized
          .map((z) => `Zone ${z.zone}: ${Math.round(z.percentage)}%`)
          .join(', ')}`}
      >
        {normalized.map((z, i) => {
          if (z.percentage < 0.5) return null // skip tiny segments
          return (
            <div
              key={z.zone}
              className={cn(animated && 'animate-bar-fill origin-left')}
              style={{
                width: `${z.percentage}%`,
                backgroundColor: ZONE_COLORS[z.zone] || 'var(--border)',
                height: '100%',
                animationDelay: animated ? `${i * 80}ms` : undefined,
              }}
            />
          )
        })}
      </div>

      {/* Labels below */}
      {(showLabels || showPercentages) && (
        <div className="flex mt-1.5 gap-3">
          {normalized.map((z) => {
            if (z.percentage < 2) return null
            return (
              <div key={z.zone} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ZONE_COLORS[z.zone] }}
                />
                {showLabels && (
                  <span className="text-[10px] font-medium text-[var(--muted)]">
                    {ZONE_LABELS[z.zone]}
                  </span>
                )}
                {showPercentages && (
                  <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                    {Math.round(z.percentage)}%
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
