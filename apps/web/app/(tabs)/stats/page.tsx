import { BarChart3 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'

export default function StatsPage() {
  return (
    <div>
      <PageHeader title="Stats" />
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--secondary)] mb-4">
            <BarChart3 className="h-8 w-8 text-[var(--muted)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Stats</h2>
          <p className="text-sm text-[var(--muted)] max-w-sm">
            Track your workout stats, view leaderboards, and earn achievements. Coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
