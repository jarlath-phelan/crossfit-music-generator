'use client'

import { useCallback, useRef, useState } from 'react'
import type { Track, Phase, IntensityLevel } from '@crossfit-playlist/shared'
import { Button } from '@/components/ui/button'
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, ExternalLink } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

const INTENSITY_LABELS: Record<IntensityLevel, string> = {
  warm_up: 'Warm Up',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
  cooldown: 'Cooldown',
}

interface SpotifyPlayerProps {
  tracks: Track[]
  /** Spotify player state from useSpotifyPlayer hook */
  isReady: boolean
  isPlaying: boolean
  currentTrackUri: string | null
  position: number
  duration: number
  onPlay: (uri: string, allUris?: string[]) => void
  onPause: () => void
  onResume: () => void
  onSkipNext: () => void
  onSkipPrevious: () => void
  onSeek?: (positionMs: number) => void
  onVolumeChange?: (volume: number) => void
  /** Workout phases for phase-aware display */
  phases?: Phase[]
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
  onSeek,
  onVolumeChange,
  phases,
}: SpotifyPlayerProps) {
  const currentTrackIndex = tracks.findIndex((t) => t.spotify_uri === currentTrackUri)
  const currentTrack = currentTrackIndex >= 0 ? tracks[currentTrackIndex] : null
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)

  // Determine the current phase based on track index
  const currentPhase = phases && currentTrack
    ? getPhaseForTrackIndex(currentTrackIndex, tracks, phases)
    : null

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause()
    } else if (currentTrackUri) {
      onResume()
    } else if (tracks.length > 0 && tracks[0].spotify_uri) {
      // Play all tracks starting from the first one
      const allUris = tracks
        .map((t) => t.spotify_uri)
        .filter((uri): uri is string => !!uri)
      onPlay(tracks[0].spotify_uri, allUris)
    }
  }, [isPlaying, currentTrackUri, tracks, onPlay, onPause, onResume])

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onSeek || !progressBarRef.current || duration <= 0) return
      const rect = progressBarRef.current.getBoundingClientRect()
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      onSeek(Math.round(fraction * duration))
    },
    [onSeek, duration]
  )

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVol = parseFloat(e.target.value)
      setVolume(newVol)
      setIsMuted(newVol === 0)
      onVolumeChange?.(newVol)
    },
    [onVolumeChange]
  )

  const handleMuteToggle = useCallback(() => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    onVolumeChange?.(newMuted ? 0 : volume)
  }, [isMuted, volume, onVolumeChange])

  if (!isReady) return null

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Album art */}
      {currentTrack?.album_art_url && (
        <img
          src={currentTrack.album_art_url}
          alt=""
          className="w-10 h-10 rounded flex-shrink-0"
        />
      )}

      {/* Track info + progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate text-sm leading-tight">
              {currentTrack?.name || 'No track playing'}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
              <span className="truncate">
                {currentTrack?.artist || 'Select a track to play'}
              </span>
              {currentTrack && (
                <>
                  <span className="text-[var(--border)]">·</span>
                  <span className="font-mono flex-shrink-0">
                    {currentTrackIndex + 1}/{tracks.length}
                  </span>
                </>
              )}
              {currentPhase && (
                <>
                  <span className="text-[var(--border)]">·</span>
                  <span className="flex-shrink-0">{INTENSITY_LABELS[currentPhase]}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Seekable progress bar */}
        {currentTrack && (
          <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--muted)] font-mono">
            <span className="w-8 text-right">{formatDuration(position)}</span>
            <div
              ref={progressBarRef}
              className="flex-1 h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden cursor-pointer group"
              onClick={handleSeek}
              role="slider"
              tabIndex={0}
              aria-label="Seek position"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              onKeyDown={(e) => {
                if (!onSeek || duration <= 0) return
                const step = duration * 0.05
                if (e.key === 'ArrowRight') onSeek(Math.min(duration, position + step))
                else if (e.key === 'ArrowLeft') onSeek(Math.max(0, position - step))
              }}
            >
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-300 group-hover:bg-[var(--accent-hover)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="w-8">{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onSkipPrevious}
          aria-label="Previous track"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-4.5 w-4.5" />
          ) : (
            <Play className="h-4.5 w-4.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onSkipNext}
          aria-label="Next track"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Volume */}
      <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleMuteToggle}
          className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-16 h-1 accent-[var(--accent)] cursor-pointer"
          aria-label="Volume"
        />
      </div>
    </div>
  )
}

/**
 * Determine which workout phase a track at a given index belongs to.
 * Maps track indices to phases by distributing tracks proportionally.
 */
function getPhaseForTrackIndex(
  trackIndex: number,
  tracks: Track[],
  phases: Phase[]
): IntensityLevel | null {
  if (phases.length === 0 || tracks.length === 0) return null

  const totalDuration = phases.reduce((sum, p) => sum + p.duration_min, 0)
  if (totalDuration === 0) return null

  // Accumulate track durations and map to phase boundaries
  let accumulated = 0
  const trackMidpoints: number[] = tracks.map((t) => {
    const mid = accumulated + t.duration_ms / 2
    accumulated += t.duration_ms
    return mid
  })

  const totalMs = accumulated
  const trackMidpoint = trackMidpoints[trackIndex] ?? 0
  const trackFraction = totalMs > 0 ? trackMidpoint / totalMs : 0

  // Map fraction to phase
  let phaseFraction = 0
  for (const phase of phases) {
    phaseFraction += phase.duration_min / totalDuration
    if (trackFraction <= phaseFraction) return phase.intensity
  }

  return phases[phases.length - 1]?.intensity ?? null
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
