'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import type { GeneratePlaylistResponse } from '@crossfit-playlist/shared'
import { generatePlaylist, getSpotifyAccessToken, savePlaylist, exportToSpotify } from '@/app/actions'
import { WorkoutForm } from '@/components/workout-form'
import { Onboarding } from '@/components/onboarding'
import { WorkoutDisplay } from '@/components/workout-display'
import { PlaylistDisplay } from '@/components/playlist-display'
import { GenerateSkeleton } from '@/components/generate-skeleton'
import { SpotifyPlayer } from '@/components/spotify-player'
import { useSpotifyPlayer } from '@/hooks/use-spotify-player'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { UserMenu } from '@/components/auth/user-menu'
import Link from 'next/link'
import { Save, AudioLines, Share, Settings } from 'lucide-react'

type GenerateState = 'empty' | 'loading' | 'results'

const LOADING_MESSAGES = [
  'Parsing workout...',
  'Finding tracks...',
  'Composing playlist...',
]

const GENRE_OPTIONS = [
  'Rock', 'Hip-Hop', 'EDM', 'Metal', 'Pop', 'Punk', 'Country', 'Indie',
]

export default function GeneratePage() {
  const [state, setState] = useState<GenerateState>('empty')
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [result, setResult] = useState<GeneratePlaylistResponse | null>(null)
  const [workoutText, setWorkoutText] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('Rock')
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
  const [initialText, setInitialText] = useState<string | undefined>(undefined)
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
      const data = await generatePlaylist(text, imageBase64, imageMediaType, selectedGenre.toLowerCase())
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

  const handleExportToSpotify = async () => {
    if (!result) return
    const uris = result.playlist.tracks
      .map((t) => t.spotify_uri)
      .filter((uri): uri is string => !!uri)
    if (uris.length === 0) {
      toast.error('No Spotify tracks to export')
      return
    }
    setIsExporting(true)
    try {
      const { spotifyUrl } = await exportToSpotify(result.playlist.name, uris)
      toast.success(
        <span>
          Playlist exported!{' '}
          <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
            Open in Spotify
          </a>
        </span>
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export'
      toast.error(message)
    } finally {
      setIsExporting(false)
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

  // Compute playhead position (0-1) for the IntensityArc
  const playheadPosition = useMemo(() => {
    if (!result || !spotifyPlayer.currentTrackUri) return undefined
    const tracks = result.playlist.tracks
    const currentIndex = tracks.findIndex((t) => t.spotify_uri === spotifyPlayer.currentTrackUri)
    if (currentIndex < 0) return undefined

    const totalMs = tracks.reduce((sum, t) => sum + t.duration_ms, 0)
    if (totalMs === 0) return undefined

    // Sum durations of all tracks before the current one + current position
    let elapsed = 0
    for (let i = 0; i < currentIndex; i++) {
      elapsed += tracks[i].duration_ms
    }
    elapsed += spotifyPlayer.position
    return Math.min(1, elapsed / totalMs)
  }, [result, spotifyPlayer.currentTrackUri, spotifyPlayer.position])

  return (
    <div>
      <Onboarding
        onComplete={() => {}}
        onLoadExample={(text) => setInitialText(text)}
      />
      <PageHeader
        title="Generate"
        showLogo
        rightContent={
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              aria-label="Settings"
              className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <UserMenu />
          </div>
        }
      />
      <div className="container mx-auto px-4 max-w-5xl space-y-3">
        {/* Genre chips */}
        {state !== 'results' && (
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Music genre">
            {GENRE_OPTIONS.map((genre) => (
              <button
                key={genre}
                type="button"
                role="radio"
                aria-checked={selectedGenre === genre}
                onClick={() => setSelectedGenre(genre)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  selectedGenre === genre
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}

        {/* Workout input — hero heading in results, full form otherwise */}
        {state === 'results' ? (
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold uppercase tracking-wide truncate">
              {result?.workout.workout_name || workoutText}
            </h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleEdit}>Edit</Button>
              <Button variant="outline" size="sm" onClick={handleNewWorkout}>New</Button>
            </div>
          </div>
        ) : (
          <WorkoutForm
            onSubmit={handleSubmit}
            isLoading={state === 'loading'}
            initialText={initialText}
          />
        )}

        {/* Loading state */}
        {state === 'loading' && (
          <div className="space-y-4" aria-live="polite">
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
          <div className="space-y-3 animate-fade-slide-up">
            {/* Action buttons */}
            {session && (
              <div className="flex justify-end gap-2">
                {result.playlist.tracks.some((t) => t.spotify_uri) && (
                  <Button
                    onClick={handleExportToSpotify}
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                  >
                    <Share className="h-3.5 w-3.5 mr-1.5" />
                    {isExporting ? 'Exporting...' : 'Export to Spotify'}
                  </Button>
                )}
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

            <WorkoutDisplay workout={result.workout} playheadPosition={playheadPosition} />
            <PlaylistDisplay
              playlist={result.playlist}
              phases={result.workout.phases}
              spotifyToken={spotifyToken}
              onPlayTrack={spotifyPlayer.isReady ? handlePlayTrack : undefined}
              currentTrackUri={spotifyPlayer.currentTrackUri}
              isPlaying={spotifyPlayer.isPlaying}
              isAuthenticated={!!session}
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
              onSeek={spotifyPlayer.seek}
              phases={result.workout.phases}
            />
          </div>
        </div>
      )}
    </div>
  )
}
