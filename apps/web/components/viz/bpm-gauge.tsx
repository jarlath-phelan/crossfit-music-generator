'use client'

import { cn } from '@/lib/utils'

export interface BpmGaugeProps {
  bpmRange: [number, number]
  maxBpm?: number
  color: string
  size?: number
  animated?: boolean
  className?: string
}

/**
 * Circular SVG gauge showing a BPM range as a colored arc.
 * The arc sweeps from the start to end of the BPM range on a 0-maxBpm scale.
 * Center shows the midpoint BPM in monospace.
 */
export function BpmGauge({
  bpmRange,
  maxBpm = 200,
  color,
  size = 64,
  animated = true,
  className,
}: BpmGaugeProps) {
  const [bpmMin, bpmMax] = bpmRange
  const midBpm = Math.round((bpmMin + bpmMax) / 2)

  // Circle geometry
  const strokeWidth = size * 0.08
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  // Arc calculation: map BPM range to 270-degree gauge (leaving 90deg gap at bottom)
  const gaugeArc = 270 // degrees of the gauge
  const startAngle = 135 // start at bottom-left (135deg from top)

  const startFraction = Math.max(0, bpmMin / maxBpm)
  const endFraction = Math.min(1, bpmMax / maxBpm)
  const arcLength = (endFraction - startFraction) * (gaugeArc / 360) * circumference

  // Background track (full 270deg)
  const trackLength = (gaugeArc / 360) * circumference
  const trackGap = circumference - trackLength

  // Colored arc offset
  const arcStart = startFraction * (gaugeArc / 360) * circumference
  const arcGap = circumference - arcLength

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-[225deg]"
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${trackLength} ${trackGap}`}
          strokeLinecap="round"
          opacity={0.5}
        />

        {/* Colored arc for BPM range */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth * 1.2}
          strokeDasharray={`${arcLength} ${arcGap}`}
          strokeDashoffset={-arcStart}
          strokeLinecap="round"
          className={animated ? 'animate-gauge-sweep' : ''}
          style={
            animated
              ? { '--gauge-offset': String(-arcStart) } as React.CSSProperties
              : undefined
          }
        />
      </svg>

      {/* Center BPM text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-bold leading-none"
          style={{ fontSize: size * 0.22 }}
        >
          {midBpm}
        </span>
        <span
          className="text-[var(--muted)] font-mono uppercase leading-none mt-0.5"
          style={{ fontSize: size * 0.11 }}
        >
          BPM
        </span>
      </div>
    </div>
  )
}
