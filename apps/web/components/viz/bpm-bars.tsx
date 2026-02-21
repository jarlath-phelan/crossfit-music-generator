'use client'

import { cn } from '@/lib/utils'

export interface BpmBarsProps {
  bpm: number
  maxBpm?: number
  animated?: boolean
  className?: string
  /** Color override. Defaults to accent. */
  color?: string
  /** Number of bars. Default 4. */
  barCount?: number
}

/**
 * Mini animated vertical bars representing BPM visually.
 * Bar heights are pseudo-random based on BPM value, with animation
 * speed inversely proportional to BPM (faster BPM = faster animation).
 */
export function BpmBars({
  bpm,
  maxBpm = 200,
  animated = true,
  className,
  color,
  barCount = 4,
}: BpmBarsProps) {
  const normalizedBpm = Math.min(1, bpm / maxBpm)
  const barWidth = 3
  const barGap = 2
  const totalWidth = barCount * barWidth + (barCount - 1) * barGap
  const totalHeight = 16

  // Generate bar heights based on BPM — each bar gets a different "seed"
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Deterministic pseudo-random heights based on bpm and bar index
    const hash = ((bpm * 17 + i * 31) % 100) / 100
    const minHeight = 0.25
    const baseHeight = minHeight + hash * (1 - minHeight)
    return baseHeight * normalizedBpm
  })

  // Animation speed: higher BPM = faster bars
  const animationDuration = Math.max(0.3, 1.2 - normalizedBpm * 0.8)

  const fillColor = color || 'var(--accent)'

  return (
    <div
      className={cn('inline-flex items-end', className)}
      style={{ width: totalWidth, height: totalHeight }}
      aria-hidden="true"
    >
      {bars.map((h, i) => (
        <div
          key={i}
          className={cn(
            'rounded-sm',
            animated && 'animate-bpm-bar'
          )}
          style={{
            width: barWidth,
            height: `${h * 100}%`,
            backgroundColor: fillColor,
            marginLeft: i > 0 ? barGap : 0,
            animationDuration: animated ? `${animationDuration}s` : undefined,
            animationDelay: animated ? `${i * 0.1}s` : undefined,
            transformOrigin: 'bottom',
            opacity: 0.6 + h * 0.4,
          }}
        />
      ))}
    </div>
  )
}
