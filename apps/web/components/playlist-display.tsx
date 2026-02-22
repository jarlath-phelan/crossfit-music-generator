'use client'

import type { Track, Playlist, Phase, IntensityLevel } from '@crossfit-playlist/shared'
import { Button } from '@/components/ui/button'
import { Badge, getPhaseVariant } from '@/components/ui/badge'
import { BpmBars } from '@/components/viz/bpm-bars'
import { EnergyBar } from '@/components/viz/energy-bar'
import { Play, Pause, ExternalLink, Music } from 'lucide-react'
import { formatDuration, formatTotalDuration } from '@/lib/utils'
import { SpotifyFallback } from '@/components/spotify-player'

interface PlaylistDisplayProps {
  playlist: Playlist
  /** Workout phases — used to assign tracks to phases */
  phases?: Phase[]
  spotifyToken?: string | null
  onPlayTrack?: (uri: string) => void
  currentTrackUri?: string | null
  isPlaying?: boolean
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
}: PlaylistDisplayProps) {
  const hasSpotifyTracks = playlist.tracks.some((t) => t.spotify_uri || t.spotify_url)

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Music className="h-3.5 w-3.5" />
          <span>{playlist.tracks.length} tracks</span>
          <span className="text-[var(--border)]">/</span>
          <span className="font-mono">{formatTotalDuration(playlist.tracks)}</span>
        </div>
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
                flex items-center gap-2 px-2 py-1 rounded-lg transition-colors
                ${isCurrentTrack
                  ? 'bg-[var(--accent)]/5 border-l-2 border-l-[var(--accent)]'
                  : 'hover:bg-[var(--secondary)] border-l-2 border-l-transparent'
                }
                animate-fade-slide-up
              `}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {/* Track number / play button */}
              <div className="w-7 flex-shrink-0 flex justify-center">
                {canPlay ? (
                  <button
                    onClick={() => onPlayTrack!(track.spotify_uri!)}
                    className="h-6 w-6 flex items-center justify-center rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                    aria-label={`Play ${track.name}`}
                  >
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3 ml-0.5" />
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
                <div className="text-sm font-medium truncate" title={track.name}>
                  {track.name}
                </div>
                <div className="text-xs text-[var(--muted)] truncate" title={track.artist}>
                  {track.artist}
                </div>
              </div>

              {/* BPM bars + value */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <BpmBars bpm={track.bpm} />
                <span className="font-mono text-xs w-7 text-right">{track.bpm}</span>
              </div>

              {/* Energy bar + value */}
              <div className="flex items-center gap-1.5 flex-shrink-0 hidden sm:flex">
                <EnergyBar energy={track.energy} width={36} height={3} />
                <span className="font-mono text-xs w-7 text-right text-[var(--muted)]">
                  {Math.round(track.energy * 100)}%
                </span>
              </div>

              {/* Duration */}
              <span className="font-mono text-xs text-[var(--muted)] w-10 text-right flex-shrink-0">
                {formatDuration(track.duration_ms)}
              </span>

              {/* Phase badge */}
              {phaseIntensity && (
                <Badge
                  variant={getPhaseVariant(phaseIntensity, true)}
                  className="text-[9px] px-1.5 py-0 hidden md:inline-flex flex-shrink-0"
                >
                  {INTENSITY_LABELS[phaseIntensity]}
                </Badge>
              )}

              {/* Spotify link */}
              {track.spotify_url && (
                <a
                  href={track.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
                  aria-label={`Open ${track.name} in Spotify`}
                >
                  <ExternalLink className="h-3 w-3" />
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
