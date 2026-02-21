'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import type { GeneratePlaylistResponse } from '@crossfit-playlist/shared'
import { generatePlaylist, getSpotifyAccessToken, savePlaylist } from './actions'
import { WorkoutForm } from '@/components/workout-form'
import { WorkoutDisplay } from '@/components/workout-display'
import { PlaylistDisplay } from '@/components/playlist-display'
import { SpotifyPlayer } from '@/components/spotify-player'
import { useSpotifyPlayer } from '@/hooks/use-spotify-player'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState<GeneratePlaylistResponse | null>(null)
  const [workoutText, setWorkoutText] = useState('')
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null)
  const { data: session } = authClient.useSession()

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

    // Refresh token every 50 minutes
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
    setIsLoading(true)
    setResult(null)
    setWorkoutText(text)
    try {
      const data = await generatePlaylist(text, imageBase64, imageMediaType)
      setResult(data)
      toast.success('Playlist generated successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate playlist'
      toast.error(message)
    } finally {
      setIsLoading(false)
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Generate Your Workout Playlist
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Snap the whiteboard or type your workout. Get an intensity-matched playlist in seconds.
          </p>
        </div>

        <div className="mb-8">
          <WorkoutForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {session && (
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  variant="outline"
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Playlist'}
                </Button>
              </div>
            )}
            <WorkoutDisplay workout={result.workout} />
            <PlaylistDisplay
              playlist={result.playlist}
              spotifyToken={spotifyToken}
              onPlayTrack={spotifyPlayer.isReady ? handlePlayTrack : undefined}
              currentTrackUri={spotifyPlayer.currentTrackUri}
              isPlaying={spotifyPlayer.isPlaying}
            />
          </div>
        )}

        {spotifyPlayer.isReady && result && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur">
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

        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Powered by Claude AI for workout parsing</p>
        </footer>
      </div>
    </main>
  )
}
