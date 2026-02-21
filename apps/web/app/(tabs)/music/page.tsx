import { Music } from 'lucide-react'
import { PageHeader } from '@/components/page-header'

export default function MusicPage() {
  return (
    <div>
      <PageHeader title="My Music" />
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--secondary)] mb-4">
            <Music className="h-8 w-8 text-[var(--muted)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">My Music</h2>
          <p className="text-sm text-[var(--muted)] max-w-sm">
            Manage your taste profile, see your influence on class playlists, and browse liked tracks. Coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
