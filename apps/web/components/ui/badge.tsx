'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--secondary)] text-[var(--foreground)]',

        // Phase badges — colored backgrounds with white text
        'phase-warmup': 'bg-[var(--phase-warmup)] text-white',
        'phase-low': 'bg-[var(--phase-low)] text-white',
        'phase-moderate': 'bg-[var(--phase-moderate)] text-white',
        'phase-high': 'bg-[var(--phase-high)] text-white',
        'phase-very-high': 'bg-[var(--phase-very-high)] text-white',
        'phase-cooldown': 'bg-[var(--phase-cooldown)] text-white',

        // Phase badges — subtle (light background, colored text)
        'phase-warmup-subtle': 'bg-blue-50 text-[var(--phase-warmup)] border border-blue-200',
        'phase-low-subtle': 'bg-emerald-50 text-[var(--phase-low)] border border-emerald-200',
        'phase-moderate-subtle': 'bg-amber-50 text-[var(--phase-moderate)] border border-amber-200',
        'phase-high-subtle': 'bg-orange-50 text-[var(--phase-high)] border border-orange-200',
        'phase-very-high-subtle': 'bg-red-50 text-[var(--phase-very-high)] border border-red-200',
        'phase-cooldown-subtle': 'bg-violet-50 text-[var(--phase-cooldown)] border border-violet-200',

        // Status badges
        'status-green': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        'status-amber': 'bg-amber-50 text-amber-700 border border-amber-200',
        'status-gray': 'bg-gray-100 text-gray-600 border border-gray-200',
        'status-red': 'bg-red-50 text-red-700 border border-red-200',

        // Accent
        accent: 'bg-[var(--accent)] text-white',

        // Outlined
        outline: 'border border-[var(--border)] text-[var(--muted)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  )
}

// Utility to map intensity level to badge variant
type IntensityLevel = 'warm_up' | 'low' | 'moderate' | 'high' | 'very_high' | 'cooldown'

const INTENSITY_BADGE_MAP: Record<IntensityLevel, VariantProps<typeof badgeVariants>['variant']> = {
  warm_up: 'phase-warmup',
  low: 'phase-low',
  moderate: 'phase-moderate',
  high: 'phase-high',
  very_high: 'phase-very-high',
  cooldown: 'phase-cooldown',
}

const INTENSITY_BADGE_SUBTLE_MAP: Record<IntensityLevel, VariantProps<typeof badgeVariants>['variant']> = {
  warm_up: 'phase-warmup-subtle',
  low: 'phase-low-subtle',
  moderate: 'phase-moderate-subtle',
  high: 'phase-high-subtle',
  very_high: 'phase-very-high-subtle',
  cooldown: 'phase-cooldown-subtle',
}

function getPhaseVariant(intensity: IntensityLevel, subtle = false) {
  return subtle ? INTENSITY_BADGE_SUBTLE_MAP[intensity] : INTENSITY_BADGE_MAP[intensity]
}

export { Badge, badgeVariants, getPhaseVariant }
export type { IntensityLevel }
