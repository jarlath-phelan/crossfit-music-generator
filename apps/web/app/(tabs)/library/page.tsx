import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { listPlaylists } from '@/app/actions'
import { PlaylistList } from '@/components/playlist-list'

export default async function LibraryPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/generate')

  const playlists = await listPlaylists()

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <PlaylistList playlists={playlists} />
    </div>
  )
}
