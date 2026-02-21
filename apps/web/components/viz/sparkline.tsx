'use client'

import { cn } from '@/lib/utils'

export interface SparklineProps {
  /** Array of data points (e.g. heart rate readings) */
  data: number[]
  /** Line color. Default: accent. */
  color?: string
  /** SVG width in px. Default 80. */
  width?: number
  /** SVG height in px. Default 24. */
  height?: number
  /** Whether to show an area fill under the line. Default true. */
  showFill?: boolean
  /** Whether to animate the line drawing. Default true. */
  animated?: boolean
  className?: string
}

/**
 * Tiny line chart for real-time data visualization.
 * Renders a smooth SVG path with optional area fill beneath.
 * Great for showing HR trends, BPM history, etc.
 */
export function Sparkline({
  data,
  color = 'var(--accent)',
  width = 80,
  height = 24,
  showFill = true,
  animated = true,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        className={cn('flex-shrink-0', className)}
        aria-hidden="true"
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </svg>
    )
  }

  const padding = 2
  const plotWidth = width - padding * 2
  const plotHeight = height - padding * 2

  const minVal = Math.min(...data)
  const maxVal = Math.max(...data)
  const range = maxVal - minVal || 1

  // Scale data to SVG coordinates
  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * plotWidth,
    y: padding + plotHeight - ((val - minVal) / range) * plotHeight,
  }))

  // Build smooth curve using cardinal spline
  let linePath = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx = (prev.x + curr.x) / 2
    linePath += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`
  }

  // Area path (line path + close to bottom)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

  // Latest value dot
  const lastPoint = points[points.length - 1]

  return (
    <svg
      width={width}
      height={height}
      className={cn('flex-shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sparkline-fill-${width}-${height}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {showFill && (
        <path
          d={areaPath}
          fill={`url(#sparkline-fill-${width}-${height})`}
        />
      )}

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'animate-sparkline-draw' : ''}
        style={animated ? { strokeDasharray: 1000, strokeDashoffset: 0 } : undefined}
      />

      {/* Latest value dot */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r={2}
        fill={color}
      />
    </svg>
  )
}
