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

const INTENSITY_ORDER: Record<IntensityLevel, number> = {
  cooldown: 0,
  warm_up: 1,
  low: 2,
  moderate: 3,
  high: 4,
  very_high: 5,
}

export interface IntensityArcProps {
  phases: Phase[]
  totalDuration: number
  showLabels?: boolean
  showGrid?: boolean
  showPeakMarker?: boolean
  playheadPosition?: number
  height?: number
  className?: string
}

/**
 * Horizontal SVG showing workout intensity over time.
 * Each phase is a colored segment with width proportional to duration.
 * A smooth curve traces the intensity progression.
 */
export function IntensityArc({
  phases,
  totalDuration,
  showLabels = true,
  showGrid = false,
  showPeakMarker = true,
  playheadPosition,
  height = 60,
  className,
}: IntensityArcProps) {
  const width = 400
  const padding = { left: 4, right: 4, top: 8, bottom: showLabels ? 16 : 4 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const barHeight = 6

  // Calculate phase segments
  const segments: {
    phase: Phase
    x: number
    width: number
    color: string
    intensityY: number
  }[] = []

  let xOffset = 0
  let peakIndex = 0
  let peakIntensity = -1

  phases.forEach((phase, i) => {
    const segWidth = (phase.duration_min / totalDuration) * plotWidth
    const intensity = INTENSITY_ORDER[phase.intensity]
    const intensityY = padding.top + plotHeight - (intensity / 5) * plotHeight

    if (intensity > peakIntensity) {
      peakIntensity = intensity
      peakIndex = i
    }

    segments.push({
      phase,
      x: padding.left + xOffset,
      width: segWidth,
      color: PHASE_COLORS[phase.intensity],
      intensityY,
    })

    xOffset += segWidth
  })

  // Build smooth curve path through segment midpoints
  const points = segments.map((s) => ({
    x: s.x + s.width / 2,
    y: s.intensityY,
  }))

  let curvePath = ''
  if (points.length > 0) {
    curvePath = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cpx1 = prev.x + (curr.x - prev.x) * 0.5
      const cpx2 = prev.x + (curr.x - prev.x) * 0.5
      curvePath += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`
    }
  }

  // Build area fill path (under the curve)
  const areaBaseline = height - padding.bottom
  let areaPath = ''
  if (points.length > 0) {
    areaPath = `M ${points[0].x} ${areaBaseline} L ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cpx1 = prev.x + (curr.x - prev.x) * 0.5
      const cpx2 = prev.x + (curr.x - prev.x) * 0.5
      areaPath += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`
    }
    areaPath += ` L ${points[points.length - 1].x} ${areaBaseline} Z`
  }

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gradient for the area fill */}
          <linearGradient id="intensity-area-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {showGrid &&
          [1, 2, 3, 4, 5].map((level) => {
            const y = padding.top + plotHeight - (level / 5) * plotHeight
            return (
              <line
                key={level}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--border)"
                strokeWidth={0.5}
                strokeDasharray="4 4"
                opacity={0.4}
              />
            )
          })}

        {/* Phase colored bars at bottom */}
        {segments.map((seg, i) => (
          <rect
            key={i}
            x={seg.x}
            y={areaBaseline - barHeight}
            width={Math.max(0, seg.width - 1)}
            height={barHeight}
            fill={seg.color}
            rx={barHeight / 2}
            opacity={0.9}
            className="animate-bar-fill origin-left"
            style={{
              animationDelay: `${i * 100}ms`,
              transformOrigin: `${seg.x}px ${areaBaseline}px`,
            }}
          />
        ))}

        {/* Area fill under curve */}
        {areaPath && (
          <path
            d={areaPath}
            fill="url(#intensity-area-gradient)"
            className="animate-fade-slide-up"
          />
        )}

        {/* Intensity curve */}
        {curvePath && (
          <path
            d={curvePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
            className="animate-sparkline-draw"
            style={{ strokeDasharray: 1000, strokeDashoffset: 0 }}
          />
        )}

        {/* Peak marker */}
        {showPeakMarker && segments.length > 0 && (
          <g className="animate-scale-in" style={{ animationDelay: '400ms' }}>
            <circle
              cx={points[peakIndex].x}
              cy={points[peakIndex].y}
              r={3}
              fill="var(--accent)"
              stroke="white"
              strokeWidth={1.5}
            />
            <text
              x={points[peakIndex].x}
              y={points[peakIndex].y - 8}
              textAnchor="middle"
              fill="var(--accent)"
              fontSize={8}
              fontWeight="bold"
              fontFamily="var(--font-mono)"
            >
              PEAK
            </text>
          </g>
        )}

        {/* Playhead (for live mode) */}
        {playheadPosition !== undefined && (
          <g>
            <line
              x1={padding.left + playheadPosition * plotWidth}
              y1={padding.top}
              x2={padding.left + playheadPosition * plotWidth}
              y2={areaBaseline}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="4 2"
            />
            <circle
              cx={padding.left + playheadPosition * plotWidth}
              cy={areaBaseline}
              r={4}
              fill="var(--accent)"
            />
          </g>
        )}

        {/* Phase labels */}
        {showLabels &&
          segments.map((seg, i) => {
            if (seg.width < 30) return null // skip label if segment too narrow
            return (
              <text
                key={i}
                x={seg.x + seg.width / 2}
                y={height - 2}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize={7}
                fontFamily="var(--font-jakarta)"
                fontWeight="500"
              >
                {seg.phase.duration_min}m
              </text>
            )
          })}
      </svg>
    </div>
  )
}
