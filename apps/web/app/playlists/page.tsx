import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { listPlaylists } from '@/app/actions'
import { PlaylistList } from '@/components/playlist-list'

export default async function PlaylistsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/')

  const playlists = await listPlaylists()

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Saved Playlists</h1>
        <PlaylistList playlists={playlists} />
      </div>
    </main>
  )
}
