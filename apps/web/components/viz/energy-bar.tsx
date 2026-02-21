'use client'

import { cn } from '@/lib/utils'

export interface EnergyBarProps {
  /** Energy value from 0 to 1 */
  energy: number
  animated?: boolean
  className?: string
  /** Width in px. Default 48 */
  width?: number
  /** Height in px. Default 4 */
  height?: number
}

/**
 * Horizontal fill bar showing energy from 0-100%.
 * Color interpolates from cool gray through green to coral
 * based on energy level.
 */
export function EnergyBar({
  energy,
  animated = true,
  className,
  width = 48,
  height = 4,
}: EnergyBarProps) {
  const clampedEnergy = Math.max(0, Math.min(1, energy))

  // Color gradient: low = gray, mid = green, high = coral
  let fillColor: string
  if (clampedEnergy < 0.4) {
    fillColor = 'var(--zone-1)'
  } else if (clampedEnergy < 0.6) {
    fillColor = 'var(--phase-low)'
  } else if (clampedEnergy < 0.8) {
    fillColor = 'var(--phase-moderate)'
  } else {
    fillColor = 'var(--accent)'
  }

  return (
    <div
      className={cn('relative rounded-full overflow-hidden bg-gray-100', className)}
      style={{ width, height }}
      role="meter"
      aria-valuenow={Math.round(clampedEnergy * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Energy: ${Math.round(clampedEnergy * 100)}%`}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full',
          animated && 'animate-bar-fill origin-left'
        )}
        style={{
          width: `${clampedEnergy * 100}%`,
          backgroundColor: fillColor,
        }}
      />
    </div>
  )
}
