'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width as CSS value. Default "100%" */
  width?: string
  /** Height as CSS value. Default "1rem" */
  height?: string
  /** Use rounded-full for circular elements. Default false */
  circle?: boolean
}

function Skeleton({
  className,
  width,
  height,
  circle = false,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 animate-pulse',
        circle ? 'rounded-full' : 'rounded-lg',
        className
      )}
      style={{
        width: width || '100%',
        height: height || '1rem',
        ...style,
      }}
      {...props}
    />
  )
}

/** Skeleton that mimics a text line — narrower width for visual realism */
function SkeletonText({
  className,
  lines = 1,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.75rem"
          width={i === lines - 1 && lines > 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  )
}

/** Skeleton that mimics a card layout */
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--border)] bg-white p-4 space-y-3',
        className
      )}
      {...props}
    >
      <Skeleton height="1.25rem" width="70%" />
      <Skeleton height="0.75rem" width="40%" />
      <Skeleton height="2.5rem" />
    </div>
  )
}

/** Skeleton row for table-like layouts */
function SkeletonRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 py-2',
        className
      )}
      {...props}
    >
      <Skeleton width="1.5rem" height="1.5rem" />
      <div className="flex-1 space-y-1.5">
        <Skeleton height="0.75rem" width="60%" />
        <Skeleton height="0.625rem" width="35%" />
      </div>
      <Skeleton width="3rem" height="0.75rem" />
      <Skeleton width="2.5rem" height="0.75rem" />
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonRow }
