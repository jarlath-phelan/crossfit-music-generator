'use client'

import { useState, useTransition } from 'react'
import type { Track, Playlist, Phase, IntensityLevel } from '@crossfit-playlist/shared'
import { Button } from '@/components/ui/button'
import { Badge, getPhaseVariant } from '@/components/ui/badge'
import { Play, Pause, ExternalLink, Music, ThumbsUp, ThumbsDown } from 'lucide-react'
import { formatDuration, formatTotalDuration } from '@/lib/utils'
import { SpotifyFallback } from '@/components/spotify-player'
import { submitTrackFeedback, type TrackFeedbackMap } from '@/app/actions'

interface PlaylistDisplayProps {
  playlist: Playlist
  /** Workout phases — used to assign tracks to phases */
  phases?: Phase[]
  spotifyToken?: string | null
  onPlayTrack?: (uri: string) => void
  currentTrackUri?: string | null
  isPlaying?: boolean
  /** Current user's track feedback (trackId → rating) */
  feedbackMap?: TrackFeedbackMap
  /** Saved playlist ID (null if not yet saved) */
  playlistId?: string | null
  /** Whether the user is authenticated (shows feedback buttons) */
  isAuthenticated?: boolean
}

const INTENSITY_LABELS: Record<IntensityLevel, string> = {
  warm_up: 'Warm Up',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
  cooldown: 'Cooldown',
}

/** Match a track's BPM to the closest workout phase */
function matchTrackToPhase(bpm: number, phases: Phase[]): IntensityLevel | null {
  for (const phase of phases) {
    const [min, max] = phase.bpm_range
    if (bpm >= min && bpm <= max) return phase.intensity
  }
  // Find closest if no exact match
  let closest: Phase | null = null
  let minDist = Infinity
  for (const phase of phases) {
    const mid = (phase.bpm_range[0] + phase.bpm_range[1]) / 2
    const dist = Math.abs(bpm - mid)
    if (dist < minDist) {
      minDist = dist
      closest = phase
    }
  }
  return closest?.intensity ?? null
}

export function PlaylistDisplay({
  playlist,
  phases,
  spotifyToken,
  onPlayTrack,
  currentTrackUri,
  isPlaying,
  feedbackMap: initialFeedback = {},
  playlistId = null,
  isAuthenticated = false,
}: PlaylistDisplayProps) {
  const hasSpotifyTracks = playlist.tracks.some((t) => t.spotify_uri || t.spotify_url)
  const [feedbackMap, setFeedbackMap] = useState<TrackFeedbackMap>(initialFeedback)
  const [isPending, startTransition] = useTransition()

  const handleFeedback = (trackId: string, rating: number) => {
    // Toggle: if already rated the same, remove it (set to 0 then delete)
    const current = feedbackMap[trackId]
    const newRating = current === rating ? 0 : rating

    // Optimistic update
    setFeedbackMap((prev) => {
      const next = { ...prev }
      if (newRating === 0) {
        delete next[trackId]
      } else {
        next[trackId] = newRating
      }
      return next
    })

    // Persist
    startTransition(async () => {
      try {
        await submitTrackFeedback(playlistId, trackId, newRating)
      } catch {
        // Revert on error
        setFeedbackMap((prev) => {
          const next = { ...prev }
          if (current) {
            next[trackId] = current
          } else {
            delete next[trackId]
          }
          return next
        })
      }
    })
  }

  return (
    <div className="space-y-1">
      {/* Header row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <Music className="h-3.5 w-3.5" />
          <span>{playlist.tracks.length} tracks</span>
          <span className="text-[var(--border)]">/</span>
          <span className="font-mono">{formatTotalDuration(playlist.tracks)}</span>
        </div>
        {onPlayTrack && playlist.tracks[0]?.spotify_uri && (
          <Button variant="accent" size="sm" onClick={() => onPlayTrack(playlist.tracks[0].spotify_uri!)}>
            <Play className="h-4 w-4 mr-1.5" /> Play All
          </Button>
        )}
      </div>

      {/* Track rows */}
      <div role="list" aria-label={`Playlist tracks, ${playlist.tracks.length} total`}>
        {playlist.tracks.map((track, index) => {
          const isCurrentTrack = currentTrackUri && track.spotify_uri === currentTrackUri
          const canPlay = !!onPlayTrack && !!track.spotify_uri
          const phaseIntensity = phases ? matchTrackToPhase(track.bpm, phases) : null

          return (
            <div
              key={track.id}
              role="listitem"
              className={`
                flex items-center gap-2 px-2 py-2 rounded-lg transition-colors
                ${isCurrentTrack
                  ? 'bg-[var(--accent)]/5 border-l-2 border-l-[var(--accent)]'
                  : 'hover:bg-[var(--secondary)] border-l-2 border-l-transparent'
                }
                animate-fade-slide-up
              `}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {/* Track number / play button */}
              <div className="w-10 flex-shrink-0 flex justify-center">
                {canPlay ? (
                  <button
                    onClick={() => onPlayTrack!(track.spotify_uri!)}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                    aria-label={`Play ${track.name}`}
                  >
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                  </button>
                ) : (
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Album art */}
              {track.album_art_url && (
                <img
                  src={track.album_art_url}
                  alt=""
                  className="w-8 h-8 rounded flex-shrink-0"
                  loading="lazy"
                />
              )}

              {/* Track name + artist */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate leading-tight" title={track.name}>
                  {track.name}
                </div>
                <div className="text-xs text-[var(--muted)] truncate leading-tight" title={track.artist}>
                  {track.artist}
                </div>
              </div>

              {/* BPM */}
              <span className="font-mono text-xs w-7 text-right flex-shrink-0">{track.bpm}</span>

              {/* Duration */}
              <span className="font-mono text-xs text-[var(--muted)] w-10 text-right flex-shrink-0">
                {formatDuration(track.duration_ms)}
              </span>

              {/* Phase dot — always visible, even on mobile */}
              {phaseIntensity && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `var(--phase-${phaseIntensity === 'warm_up' ? 'warmup' : phaseIntensity === 'very_high' ? 'very-high' : phaseIntensity})` }}
                  title={INTENSITY_LABELS[phaseIntensity]}
                />
              )}

              {/* Phase badge — desktop only, text label */}
              {phaseIntensity && (
                <Badge
                  variant={getPhaseVariant(phaseIntensity, true)}
                  className="text-[11px] px-1.5 py-0 hidden md:inline-flex flex-shrink-0"
                >
                  {INTENSITY_LABELS[phaseIntensity]}
                </Badge>
              )}

              {/* Feedback buttons — 44px touch targets */}
              {isAuthenticated && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => handleFeedback(track.id, 1)}
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded transition-colors ${
                      feedbackMap[track.id] === 1
                        ? 'text-green-400 bg-green-400/10'
                        : 'text-[var(--muted)] hover:text-green-400'
                    }`}
                    aria-label={`Thumbs up ${track.name}`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback(track.id, -1)}
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded transition-colors ${
                      feedbackMap[track.id] === -1
                        ? 'text-red-400 bg-red-400/10'
                        : 'text-[var(--muted)] hover:text-red-400'
                    }`}
                    aria-label={`Thumbs down ${track.name}`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Spotify link — 44px touch target */}
              {track.spotify_url && (
                <a
                  href={track.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
                  aria-label={`Open ${track.name} in Spotify`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )
        })}
      </div>

      {/* Spotify fallback for non-Premium or no SDK */}
      {hasSpotifyTracks && !spotifyToken && (
        <SpotifyFallback tracks={playlist.tracks} />
      )}
    </div>
  )
}
