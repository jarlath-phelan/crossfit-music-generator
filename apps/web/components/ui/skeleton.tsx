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
        'bg-[var(--surface-3)] animate-pulse',
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

export { Skeleton }
