'use client'

import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

export interface PageHeaderProps {
  /** Page title: "Generate", "Library", "Classes", "Profile" */
  title: string
  /** When true, shows the Crank logo mark + "Crank" text instead of plain title */
  showLogo?: boolean
  /** Optional content rendered on the right side (badges, buttons, user menu) */
  rightContent?: React.ReactNode
  className?: string
}

/**
 * Per-page header component. Replaces the old global NavBar.
 * The Generate tab shows the Crank logo; other tabs show a simple title.
 */
export function PageHeader({
  title,
  showLogo = false,
  rightContent,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 pt-[env(safe-area-inset-top,8px)] pb-2',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {showLogo ? (
          <>
            {/* Crank logo mark */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]">
              <Zap className="h-4 w-4 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              Crank
            </span>
          </>
        ) : (
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            {title}
          </h1>
        )}
      </div>

      {rightContent && (
        <div className="flex items-center gap-2">
          {rightContent}
        </div>
      )}
    </header>
  )
}
