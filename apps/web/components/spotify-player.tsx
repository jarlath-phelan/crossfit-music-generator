'use client'

import { useCallback } from 'react'
import type { Track } from '@crossfit-playlist/shared'
import { Button } from '@/components/ui/button'
import { Play, Pause, SkipForward, SkipBack, ExternalLink } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

interface SpotifyPlayerProps {
  tracks: Track[]
  /** Spotify player state from useSpotifyPlayer hook */
  isReady: boolean
  isPlaying: boolean
  currentTrackUri: string | null
  position: number
  duration: number
  onPlay: (uri: string) => void
  onPause: () => void
  onResume: () => void
  onSkipNext: () => void
  onSkipPrevious: () => void
}

/**
 * Spotify Web Playback SDK player controls.
 * Only renders when the player is ready (Premium user with valid token).
 */
export function SpotifyPlayer({
  tracks,
  isReady,
  isPlaying,
  currentTrackUri,
  position,
  duration,
  onPlay,
  onPause,
  onResume,
  onSkipNext,
  onSkipPrevious,
}: SpotifyPlayerProps) {
  const currentTrack = tracks.find((t) => t.spotify_uri === currentTrackUri)
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause()
    } else if (currentTrackUri) {
      onResume()
    } else if (tracks.length > 0 && tracks[0].spotify_uri) {
      onPlay(tracks[0].spotify_uri)
    }
  }, [isPlaying, currentTrackUri, tracks, onPlay, onPause, onResume])

  if (!isReady) return null

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
      {/* Album art */}
      {currentTrack?.album_art_url && (
        <img
          src={currentTrack.album_art_url}
          alt=""
          className="w-12 h-12 rounded"
        />
      )}

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate text-sm">
          {currentTrack?.name || 'No track playing'}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {currentTrack?.artist || 'Select a track to play'}
        </div>
        {/* Progress bar */}
        {currentTrack && (
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{formatDuration(position)}</span>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono">{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSkipPrevious}
          aria-label="Previous track"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSkipNext}
          aria-label="Next track"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Fallback for non-Premium users or when SDK is not available.
 * Shows individual track links to open in Spotify.
 */
interface SpotifyFallbackProps {
  tracks: Track[]
}

export function SpotifyFallback({ tracks }: SpotifyFallbackProps) {
  const spotifyTracks = tracks.filter((t) => t.spotify_url)
  if (spotifyTracks.length === 0) return null

  return (
    <div className="mt-4 p-3 rounded-lg border bg-muted/50">
      <p className="text-sm text-muted-foreground mb-2">
        Open tracks in Spotify:
      </p>
      <div className="flex flex-wrap gap-2">
        {spotifyTracks.map((track) => (
          <a
            key={track.id}
            href={track.spotify_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border bg-card hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {track.name}
          </a>
        ))}
      </div>
    </div>
  )
}
