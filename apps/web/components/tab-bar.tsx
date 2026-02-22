'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Zap, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabConfig {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: TabConfig[] = [
  { label: 'Generate', href: '/generate', icon: Zap },
  { label: 'Library', href: '/library', icon: Bookmark },
]

interface TabBarProps {
  miniPlayer?: React.ReactNode
}

export function TabBar({ miniPlayer }: TabBarProps) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface-1)]/90 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      {/* Mini-player slot — renders above tabs when playing */}
      {miniPlayer}

      {/* Safe area padding for iOS notch */}
      <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href))

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 min-w-[64px] transition-colors duration-150',
                isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
              )}
            >
              <tab.icon
                className={cn(
                  'h-5 w-5 transition-colors duration-150',
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                )}
              />
              <span className="text-xs font-semibold leading-none mt-0.5">
                {tab.label}
              </span>
              {/* Active dot indicator */}
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-[var(--accent)] mt-0.5" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
