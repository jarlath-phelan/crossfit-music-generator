import { Calendar } from 'lucide-react'
import { PageHeader } from '@/components/page-header'

export default function ClassesPage() {
  return (
    <div>
      <PageHeader title="Classes" />
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--secondary)] mb-4">
            <Calendar className="h-8 w-8 text-[var(--muted)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Classes</h2>
          <p className="text-sm text-[var(--muted)] max-w-sm">
            Schedule classes, manage attendees, and generate playlists for your sessions. Coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
