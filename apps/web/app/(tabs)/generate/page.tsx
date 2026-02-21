'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import type { GeneratePlaylistResponse } from '@crossfit-playlist/shared'
import { generatePlaylist, getSpotifyAccessToken, savePlaylist } from '@/app/actions'
import { WorkoutForm } from '@/components/workout-form'
import { WorkoutDisplay } from '@/components/workout-display'
import { PlaylistDisplay } from '@/components/playlist-display'
import { GenerateSkeleton } from '@/components/generate-skeleton'
import { SpotifyPlayer } from '@/components/spotify-player'
import { useSpotifyPlayer } from '@/hooks/use-spotify-player'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { UserMenu } from '@/components/auth/user-menu'
import { Badge } from '@/components/ui/badge'
import { Save, AudioLines } from 'lucide-react'

type GenerateState = 'empty' | 'loading' | 'results'

const LOADING_MESSAGES = [
  'Parsing workout...',
  'Finding tracks...',
  'Composing playlist...',
]

export default function GeneratePage() {
  const [state, setState] = useState<GenerateState>('empty')
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState<GeneratePlaylistResponse | null>(null)
  const [workoutText, setWorkoutText] = useState('')
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
  const { data: session } = authClient.useSession()

  // Cycle through loading messages
  useEffect(() => {
    if (state !== 'loading') return
    let index = 0
    setLoadingMessage(LOADING_MESSAGES[0])
    const interval = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length
      setLoadingMessage(LOADING_MESSAGES[index])
    }, 2000)
    return () => clearInterval(interval)
  }, [state])

  // Fetch Spotify access token when authenticated
  useEffect(() => {
    if (!session) {
      setSpotifyToken(null)
      return
    }

    const fetchToken = async () => {
      const token = await getSpotifyAccessToken()
      setSpotifyToken(token)
    }

    fetchToken()
    const interval = setInterval(fetchToken, 50 * 60 * 1000)
    return () => clearInterval(interval)
  }, [session])

  const spotifyPlayer = useSpotifyPlayer({
    accessToken: spotifyToken,
    onError: (error) => toast.error(error),
  })

  const handleSubmit = async (
    text: string,
    imageBase64?: string,
    imageMediaType?: string
  ) => {
    setState('loading')
    setResult(null)
    setWorkoutText(text)
    try {
      const data = await generatePlaylist(text, imageBase64, imageMediaType)
      setResult(data)
      setState('results')
      toast.success('Playlist generated!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate playlist'
      toast.error(message)
      setState('empty')
    }
  }

  const handleSave = async () => {
    if (!result) return
    setIsSaving(true)
    try {
      await savePlaylist({
        name: result.playlist.name,
        workoutText,
        workoutStructure: result.workout,
        playlistData: result.playlist,
      })
      toast.success('Playlist saved!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save playlist'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePlayTrack = useCallback(
    (uri: string) => {
      if (spotifyPlayer.isReady) {
        spotifyPlayer.play(uri)
      }
    },
    [spotifyPlayer]
  )

  const handleNewWorkout = () => {
    setResult(null)
    setWorkoutText('')
    setState('empty')
  }

  const handleEdit = () => {
    setState('empty')
  }

  return (
    <div>
      <PageHeader
        title="Generate"
        showLogo
        rightContent={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">MOCK</Badge>
            <UserMenu />
          </div>
        }
      />
      <div className="container mx-auto px-4 max-w-5xl space-y-4">
        {/* Workout input — full or compact */}
        {state === 'results' ? (
          <WorkoutForm
            onSubmit={handleSubmit}
            isLoading={false}
            isCompact
            compactText={workoutText || result?.workout.workout_name}
            onEdit={handleEdit}
            onNewWorkout={handleNewWorkout}
          />
        ) : (
          <WorkoutForm
            onSubmit={handleSubmit}
            isLoading={state === 'loading'}
          />
        )}

        {/* Loading state */}
        {state === 'loading' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <div className="h-1 flex-1 rounded-full bg-[var(--secondary)] overflow-hidden">
                <div className="h-full bg-[var(--accent)] rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <span>{loadingMessage}</span>
            </div>
            <GenerateSkeleton />
          </div>
        )}

        {/* Results state */}
        {state === 'results' && result && (
          <div className="space-y-4 animate-fade-slide-up">
            {/* Save button */}
            {session && (
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  variant="outline"
                  size="sm"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}

            <WorkoutDisplay workout={result.workout} />
            <PlaylistDisplay
              playlist={result.playlist}
              phases={result.workout.phases}
              spotifyToken={spotifyToken}
              onPlayTrack={spotifyPlayer.isReady ? handlePlayTrack : undefined}
              currentTrackUri={spotifyPlayer.currentTrackUri}
              isPlaying={spotifyPlayer.isPlaying}
            />
          </div>
        )}

        {/* Empty state */}
        {state === 'empty' && !result && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AudioLines className="h-10 w-10 text-[var(--border)] mb-3" />
            <p className="text-sm text-[var(--muted)]">
              Your workout breakdown and playlist will appear here
            </p>
          </div>
        )}
      </div>

      {/* Spotify player bar */}
      {spotifyPlayer.isReady && result && (
        <div className="fixed bottom-20 left-0 right-0 z-30 border-t border-[var(--border)] bg-white/95 backdrop-blur">
          <div className="container mx-auto px-4 max-w-5xl">
            <SpotifyPlayer
              tracks={result.playlist.tracks}
              isReady={spotifyPlayer.isReady}
              isPlaying={spotifyPlayer.isPlaying}
              currentTrackUri={spotifyPlayer.currentTrackUri}
              position={spotifyPlayer.position}
              duration={spotifyPlayer.duration}
              onPlay={spotifyPlayer.play}
              onPause={spotifyPlayer.pause}
              onResume={spotifyPlayer.resume}
              onSkipNext={spotifyPlayer.skipToNext}
              onSkipPrevious={spotifyPlayer.skipToPrevious}
            />
          </div>
        </div>
      )}
    </div>
  )
}
