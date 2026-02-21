'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TogglePillOption {
  label: string
  value: string
  icon?: React.ReactNode
}

export interface TogglePillsProps {
  options: TogglePillOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  size?: 'sm' | 'default'
}

export function TogglePills({
  options,
  value,
  onChange,
  className,
  size = 'default',
}: TogglePillsProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full bg-[var(--secondary)] p-1',
        className
      )}
      role="radiogroup"
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative rounded-full font-medium transition-all duration-200',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
              isActive
                ? 'bg-white text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            )}
          >
            <span className="flex items-center gap-1.5">
              {option.icon}
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
