export const dynamic = 'force-dynamic'

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
  let session
  try {
    session = await auth.api.getSession({ headers: await headers() })
  } catch {
    redirect('/generate')
  }
  if (!session) redirect('/generate')

  const { id } = await params
  const data = await getPlaylistById(id)
  if (!data) notFound()

  const workout = data.workoutStructure as WorkoutStructure | null
  const playlist = data.playlistData as Playlist | null

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Link
          href="/library"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to library
        </Link>

        <h1 className="text-2xl font-bold mb-1">{data.name}</h1>
        <p className="text-sm text-[var(--muted)] mb-6 font-mono">
          {new Date(data.createdAt).toLocaleDateString()}
        </p>

        <div className="space-y-6">
          {workout && <WorkoutDisplay workout={workout} />}
          {playlist && (
            <PlaylistDisplay
              playlist={playlist}
              phases={workout?.phases}
              spotifyToken={null}
            />
          )}
        </div>
      </div>
    </main>
  )
}
