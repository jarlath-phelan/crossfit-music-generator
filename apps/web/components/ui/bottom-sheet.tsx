'use client'

import * as React from 'react'
import { useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Height as CSS value, e.g. "80%", "auto", "60vh". Default "80%" */
  height?: string
  className?: string
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  height = '80%',
  className,
}: BottomSheetProps) {
  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full max-w-lg bg-[var(--surface-1)] rounded-t-2xl shadow-xl animate-slide-up',
          className
        )}
        style={{ maxHeight: height }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-3">
            <h2 className="text-lg font-bold text-[var(--foreground)]">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--secondary)] transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-[var(--muted)]" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: `calc(${height} - 80px)` }}>
          {children}
        </div>
      </div>
    </div>
  )
}
