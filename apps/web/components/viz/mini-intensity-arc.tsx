'use client'

import { cn } from '@/lib/utils'
import type { Phase, IntensityLevel } from '@crossfit-playlist/shared'

const PHASE_COLORS: Record<IntensityLevel, string> = {
  warm_up: 'var(--phase-warmup)',
  low: 'var(--phase-low)',
  moderate: 'var(--phase-moderate)',
  high: 'var(--phase-high)',
  very_high: 'var(--phase-very-high)',
  cooldown: 'var(--phase-cooldown)',
}

export interface MiniIntensityArcProps {
  phases: Phase[]
  totalDuration: number
  className?: string
  /** Height in px. Default 6. */
  height?: number
}

/**
 * Compact version of the intensity arc — a thin colored bar showing
 * phase segments proportional to duration. No labels, no curves.
 * Used on playlist cards in the library view.
 */
export function MiniIntensityArc({
  phases,
  totalDuration,
  className,
  height = 6,
}: MiniIntensityArcProps) {
  if (!phases.length || totalDuration <= 0) return null

  return (
    <div
      className={cn('w-full rounded-full overflow-hidden flex', className)}
      style={{ height }}
      role="img"
      aria-label={`Intensity: ${phases.map((p) => p.name).join(', ')}`}
    >
      {phases.map((phase, i) => {
        const widthPercent = (phase.duration_min / totalDuration) * 100
        if (widthPercent < 0.5) return null

        return (
          <div
            key={i}
            className="animate-bar-fill origin-left"
            style={{
              width: `${widthPercent}%`,
              backgroundColor: PHASE_COLORS[phase.intensity],
              height: '100%',
              animationDelay: `${i * 60}ms`,
            }}
          />
        )
      })}
    </div>
  )
}
