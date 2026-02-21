import { TabBar, type UserRole } from '@/components/tab-bar'

/**
 * Tab layout wraps all tabbed pages with a fixed bottom tab bar.
 * The role is currently hardcoded to 'coach' — once role detection
 * is added (Task 21), this will read from the user's profile.
 */
export default function TabLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Fetch session and determine role from profile
  // For now, default to coach (the primary user flow)
  const role: UserRole = 'coach'

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Content area — bottom padding accounts for the tab bar */}
      <main className="pb-20">
        {children}
      </main>
      <TabBar role={role} />
    </div>
  )
}
