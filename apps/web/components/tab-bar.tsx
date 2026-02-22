'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Zap, Bookmark, User, Music, BarChart3, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export type UserRole = 'coach' | 'attendee'

interface TabConfig {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const COACH_TABS: TabConfig[] = [
  { label: 'Generate', href: '/generate', icon: Zap },
  { label: 'Library', href: '/library', icon: Bookmark },
  { label: 'Profile', href: '/profile', icon: User },
]

const ATTENDEE_TABS: TabConfig[] = [
  { label: 'Classes', href: '/classes', icon: Calendar },
  { label: 'Music', href: '/music', icon: Music },
  { label: 'Stats', href: '/stats', icon: BarChart3 },
  { label: 'Profile', href: '/profile', icon: User },
]

interface TabBarProps {
  role: UserRole
}

export function TabBar({ role }: TabBarProps) {
  const pathname = usePathname()
  const tabs = role === 'coach' ? COACH_TABS : ATTENDEE_TABS

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60"
      role="tablist"
      aria-label="Main navigation"
    >
      {/* Safe area padding for iOS notch */}
      <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href))

          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
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
              <span className="text-[10px] font-semibold leading-none mt-0.5">
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
