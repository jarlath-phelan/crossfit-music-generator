import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { WorkoutStructure, Playlist } from '@crossfit-playlist/shared'
import { auth } from '@/lib/auth'
import { getPlaylistById } from '@/app/actions'
import { WorkoutDisplay } from '@/components/workout-display'
import { PlaylistDisplay } from '@/components/playlist-display'
import { ArrowLeft } from 'lucide-react'

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/')

  const { id } = await params
  const data = await getPlaylistById(id)
  if (!data) notFound()

  const workout = data.workoutStructure as WorkoutStructure | null
  const playlist = data.playlistData as Playlist | null

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Link
          href="/playlists"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to playlists
        </Link>

        <h1 className="text-3xl font-bold mb-2">{data.name}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Saved on {new Date(data.createdAt).toLocaleDateString()}
        </p>

        <div className="space-y-8">
          {workout && <WorkoutDisplay workout={workout} />}
          {playlist && (
            <PlaylistDisplay
              playlist={playlist}
              spotifyToken={null}
            />
          )}
        </div>
      </div>
    </main>
  )
}
