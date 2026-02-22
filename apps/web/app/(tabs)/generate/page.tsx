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
import { useSpotifyPlayer } from '@/hooks/use-spotify-player'
import { useSpotifyMiniPlayer } from '@/components/spotify-context'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { UserMenu } from '@/components/auth/user-menu'
import Link from 'next/link'
import { Save, AudioLines, Share, Settings, Clock, Music, Gauge } from 'lucide-react'
import { formatTotalDuration } from '@/lib/utils'

type GenerateState = 'empty' | 'loading' | 'results' | 'error'

const LOADING_STAGES = [
  { label: 'Breaking down your WOD...', progress: 20 },
  { label: 'Matching tracks to your tempo...', progress: 55 },
  { label: 'Dialing in the perfect playlist...', progress: 85 },
]

/**
 * Asymptotic progress value for the loading bar.
 * Crawls quickly to ~60%, then slows to a near-stop at 92%.
 * Formula: target = 92 * (1 - e^(-t/18)) where t is seconds elapsed.
 */
function asymptotic(elapsed: number): number {
  return 92 * (1 - Math.exp(-elapsed / 18))
}

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
  const [loadingStage, setLoadingStage] = useState(0)
  const [smoothProgress, setSmoothProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [initialText, setInitialText] = useState<string | undefined>(undefined)
  const { data: session } = authClient.useSession()

  // Restore last playlist from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('crank_last_playlist')
      if (saved) {
        const parsed = JSON.parse(saved) as GeneratePlaylistResponse
        if (parsed?.workout && parsed?.playlist) {
          setResult(parsed)
          setState('results')
        }
      }
      const savedText = localStorage.getItem('crank_last_workout_text')
      if (savedText) setWorkoutText(savedText)
      const savedGenre = localStorage.getItem('crank_last_genre')
      if (savedGenre) setSelectedGenre(savedGenre)
    } catch {
      // Ignore invalid localStorage data
    }
  }, [])

  // Save result to localStorage when it changes
  useEffect(() => {
    if (result) {
      try {
        localStorage.setItem('crank_last_playlist', JSON.stringify(result))
      } catch {
        // Ignore quota exceeded errors
      }
    }
  }, [result])

  // Progress stage labels on timers (unchanged — drives the status text)
  useEffect(() => {
    if (state !== 'loading') {
      setLoadingStage(0)
      return
    }
    const timers = [
      setTimeout(() => setLoadingStage(1), 2500),
      setTimeout(() => setLoadingStage(2), 5500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [state])

  // Smooth asymptotic progress bar — ticks every 500 ms while loading
  useEffect(() => {
    if (state !== 'loading') {
      // Snap to 100% briefly so the bar fills before unmounting, then reset
      if (state === 'results') {
        setSmoothProgress(100)
      } else {
        setSmoothProgress(0)
      }
      return
    }
    setSmoothProgress(5)
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      setSmoothProgress(asymptotic(elapsed))
    }, 500)
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

  const { setState: setMiniPlayerState } = useSpotifyMiniPlayer()

  // Push Spotify state to mini-player context
  useEffect(() => {
    if (!spotifyPlayer.isReady || !result) {
      setMiniPlayerState(null)
      return
    }
    const tracks = result.playlist.tracks
    const currentIndex = tracks.findIndex(
      (t) => t.spotify_uri === spotifyPlayer.currentTrackUri
    )
    setMiniPlayerState({
      currentTrack: currentIndex >= 0 ? tracks[currentIndex] : null,
      isPlaying: spotifyPlayer.isPlaying,
      position: spotifyPlayer.position,
      duration: spotifyPlayer.duration,
      onPlayPause: () => {
        if (spotifyPlayer.isPlaying) {
          spotifyPlayer.pause()
        } else if (spotifyPlayer.currentTrackUri) {
          spotifyPlayer.resume()
        }
      },
      onSkipNext: spotifyPlayer.skipToNext,
    })
  }, [spotifyPlayer.isReady, spotifyPlayer.isPlaying, spotifyPlayer.currentTrackUri, spotifyPlayer.position, spotifyPlayer.duration, result, setMiniPlayerState])

  // Clean up mini-player on unmount
  useEffect(() => {
    return () => setMiniPlayerState(null)
  }, [setMiniPlayerState])

  const handleSubmit = async (
    text: string,
    imageBase64?: string,
    imageMediaType?: string
  ) => {
    setState('loading')
    setResult(null)
    setErrorMessage(null)
    setWorkoutText(text)
    try {
      const data = await generatePlaylist(text, imageBase64, imageMediaType, selectedGenre.toLowerCase())
      setResult(data)
      setState('results')
      localStorage.setItem('crank_last_workout_text', text)
      localStorage.setItem('crank_last_genre', selectedGenre)
      toast.success('Your playlist is locked in.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate playlist'
      setErrorMessage(message)
      setState('error')
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
      toast.success('Saved to your library.')
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
          Exported to Spotify.{' '}
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
    setSelectedGenre('Rock')
    setState('empty')
    localStorage.removeItem('crank_last_playlist')
    localStorage.removeItem('crank_last_workout_text')
    localStorage.removeItem('crank_last_genre')
  }

  const handleEdit = () => {
    setInitialText(workoutText)
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
            {session && (
              <Link
                href="/profile"
                aria-label="Settings"
                className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <Settings className="h-5 w-5" />
              </Link>
            )}
            <UserMenu />
          </div>
        }
      />
      <div className="container mx-auto px-4 max-w-5xl space-y-3">
        {/* Workout input — hero heading in results, full form otherwise */}
        {state === 'results' ? (
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-heading text-xl font-bold uppercase tracking-wide leading-tight line-clamp-2 min-w-0">
              {result?.workout.workout_name || workoutText}
            </h2>
            <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
              <Button variant="outline" size="sm" onClick={handleEdit}>Edit</Button>
              <Button variant="outline" size="sm" onClick={handleNewWorkout}>New</Button>
            </div>
          </div>
        ) : (
          <>
            {state === 'error' && errorMessage && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300" role="alert">
                <p className="font-medium">Something went wrong</p>
                <p className="mt-1 text-red-600 dark:text-red-400">{errorMessage}</p>
              </div>
            )}
            <WorkoutForm
              onSubmit={async (text, img, mediaType) => {
                setErrorMessage(null)
                await handleSubmit(text, img, mediaType)
              }}
              isLoading={state === 'loading'}
              initialText={initialText}
              onTextChange={(text) => setWorkoutText(text)}
              slotBeforeSubmit={
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Music genre">
                  {GENRE_OPTIONS.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      role="radio"
                      aria-checked={selectedGenre === genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={`text-sm px-4 py-2 rounded-full border transition-colors min-h-[44px] ${
                        selectedGenre === genre
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)] glow-accent'
                          : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              }
            />
          </>
        )}

        {/* Loading state */}
        {state === 'loading' && (
          <div className="space-y-4" aria-live="polite">
            {/* Smooth asymptotic progress bar + stage label */}
            <div className="space-y-2">
              <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${smoothProgress}%` }}
                  role="progressbar"
                  aria-valuenow={Math.round(smoothProgress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p className="text-sm text-[var(--muted)]">
                {LOADING_STAGES[loadingStage].label}
              </p>
            </div>
            <GenerateSkeleton />
          </div>
        )}

        {/* Results state */}
        {state === 'results' && result && (
          <div className="space-y-4 animate-fade-slide-up">
            {/* Summary metrics bar */}
            <div className="flex items-center gap-3 text-xs text-[var(--muted)] font-mono">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {result.workout.total_duration_min} min
              </span>
              <span className="text-[var(--border)]">&middot;</span>
              <span className="flex items-center gap-1">
                <Music className="h-3 w-3" />
                {result.playlist.tracks.length} tracks
              </span>
              <span className="text-[var(--border)]">&middot;</span>
              <span className="capitalize">{selectedGenre}</span>
              <span className="text-[var(--border)]">&middot;</span>
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                Peak {Math.max(...result.playlist.tracks.map(t => t.bpm))} BPM
              </span>
            </div>

            {/* YOUR WORKOUT section */}
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)] mb-2">Your Workout</h3>
              <WorkoutDisplay workout={result.workout} playheadPosition={playheadPosition} />
            </div>

            {/* YOUR PLAYLIST section */}
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)] mb-2">Your Playlist</h3>
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

            {/* Action buttons — at bottom after reviewing playlist */}
            {session && (
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save to Library'}
                </Button>
                {result.playlist.tracks.some((t) => t.spotify_uri) && (
                  <Button
                    onClick={handleExportToSpotify}
                    disabled={isExporting}
                    variant="accent"
                    className="flex-1 min-h-[44px]"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export to Spotify'}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state — rich, branded */}
        {state === 'empty' && !result && !workoutText && !errorMessage && (
          <div className="flex flex-col items-center justify-center py-10 md:min-h-[30vh] md:py-0 text-center">
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center">
                <AudioLines className="h-10 w-10 text-[var(--accent)]" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--accent)] animate-pulse" />
            </div>
            <h3 className="font-heading text-xl font-bold uppercase tracking-wide mb-2">
              Drop your WOD. We'll bring the heat.
            </h3>
            <p className="text-sm text-[var(--muted)] max-w-xs leading-relaxed">
              Paste a workout, snap your whiteboard, or pick a named WOD. Crank matches tracks to every phase of your session.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
