'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { GeneratePlaylistResponse } from '@crossfit-playlist/shared'
import { generatePlaylist } from './actions'
import { WorkoutForm } from '@/components/workout-form'
import { WorkoutDisplay } from '@/components/workout-display'
import { PlaylistDisplay } from '@/components/playlist-display'
import { SpotifyPlayer } from '@/components/spotify-player'
import { useSpotifyPlayer } from '@/hooks/use-spotify-player'
import { Music } from 'lucide-react'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GeneratePlaylistResponse | null>(null)

  // Spotify token will come from auth (Phase 4).
  // For now, null means Spotify playback is disabled and fallback links are shown.
  const [spotifyToken] = useState<string | null>(null)

  const spotifyPlayer = useSpotifyPlayer({
    accessToken: spotifyToken,
    onError: (error) => toast.error(error),
  })

  const handleSubmit = async (
    workoutText: string,
    imageBase64?: string,
    imageMediaType?: string
  ) => {
    setIsLoading(true)
    setResult(null)

    try {
      const data = await generatePlaylist(workoutText, imageBase64, imageMediaType)
      setResult(data)
      toast.success('Playlist generated successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate playlist'
      toast.error(message)
      console.error('Error generating playlist:', error)
    } finally {
      setIsLoading(false)
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
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="h-10 w-10" />
            <h1 className="text-4xl font-bold tracking-tight">
              CrossFit Playlist Generator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Snap the whiteboard or type your workout. Get an intensity-matched playlist in seconds.
          </p>
        </div>

        {/* Workout Form */}
        <div className="mb-8">
          <WorkoutForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

        {/* Spotify player bar (sticky bottom when playing) */}
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

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>
            Powered by Claude AI for workout parsing
          </p>
        </footer>
      </div>
    </main>
  )
}
