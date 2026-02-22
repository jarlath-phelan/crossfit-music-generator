import { TabBar } from '@/components/tab-bar'

export default function TabLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="pb-20">
        {children}
      </main>
      <TabBar />
    </div>
  )
}
