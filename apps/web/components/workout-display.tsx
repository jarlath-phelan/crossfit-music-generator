'use client'

import type { WorkoutStructure, Phase, IntensityLevel } from '@crossfit-playlist/shared'
import { BpmGauge } from '@/components/viz/bpm-gauge'
import { IntensityArc } from '@/components/viz/intensity-arc'

interface WorkoutDisplayProps {
  workout: WorkoutStructure
  /** 0-1 fraction representing playback progress through the workout */
  playheadPosition?: number
}

const PHASE_COLORS: Record<IntensityLevel, string> = {
  warm_up: 'var(--phase-warmup)',
  low: 'var(--phase-low)',
  moderate: 'var(--phase-moderate)',
  high: 'var(--phase-high)',
  very_high: 'var(--phase-very-high)',
  cooldown: 'var(--phase-cooldown)',
}


const INTENSITY_LABELS: Record<IntensityLevel, string> = {
  warm_up: 'Warm Up',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
  cooldown: 'Cooldown',
}

export function WorkoutDisplay({ workout, playheadPosition }: WorkoutDisplayProps) {
  // WOD phases get flex-[2] to be wider
  const isWodPhase = (phase: Phase) =>
    phase.intensity !== 'warm_up' && phase.intensity !== 'cooldown'

  return (
    <div className="space-y-2">
      {/* Phase cards — horizontal scroll on mobile, flex row on desktop */}
      <div className="relative sm:contents">
        <div
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide sm:overflow-x-visible"
          role="list"
          aria-label={`Workout phases, ${workout.phases.length} total`}
        >
        {workout.phases.map((phase, index) => (
          <div
            key={index}
            role="listitem"
            className={`
              min-w-[140px] snap-center sm:min-w-0
              ${isWodPhase(phase) ? 'sm:flex-[2]' : 'sm:flex-1'}
              bg-[var(--surface-1)] rounded-xl border border-[var(--border)] border-l-4
              p-2.5 shadow-sm
              animate-scale-in
            `}
            style={{ borderLeftColor: PHASE_COLORS[phase.intensity], animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight line-clamp-2">{phase.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {INTENSITY_LABELS[phase.intensity]}
                </p>
                <p className="font-mono text-xs text-[var(--muted)] mt-1">
                  {phase.duration_min}m
                </p>
              </div>
              <BpmGauge
                bpmRange={phase.bpm_range as [number, number]}
                color={PHASE_COLORS[phase.intensity]}
                size={52}
              />
            </div>
          </div>
        ))}
        </div>
        {/* Scroll affordance — gradient fade on right edge (mobile only) */}
        {workout.phases.length > 2 && (
          <div
            className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-[var(--background)] to-transparent sm:hidden"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Intensity arc below the cards */}
      <IntensityArc
        phases={workout.phases}
        totalDuration={workout.total_duration_min}
        showLabels
        showPeakMarker
        playheadPosition={playheadPosition}
        height={64}
      />
    </div>
  )
}
