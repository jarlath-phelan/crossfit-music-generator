'use client'

import { useState, useTransition, useId } from 'react'
import type { Track, Playlist, Phase, IntensityLevel } from '@crossfit-playlist/shared'
import { Button } from '@/components/ui/button'
import { Play, Pause, ExternalLink, Music, ThumbsUp, ThumbsDown, ChevronDown } from 'lucide-react'
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

const PHASE_COLORS: Record<IntensityLevel, string> = {
  warm_up: 'var(--phase-warmup)',
  low: 'var(--phase-low)',
  moderate: 'var(--phase-moderate)',
  high: 'var(--phase-high)',
  very_high: 'var(--phase-very-high)',
  cooldown: 'var(--phase-cooldown)',
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

/** A group of tracks belonging to a single workout phase */
interface PhaseGroup {
  intensity: IntensityLevel
  tracks: Track[]
}

/** Group tracks by workout phase, preserving phase order from the workout */
function groupTracksByPhase(tracks: Track[], phases: Phase[]): PhaseGroup[] {
  // Build an ordered list of unique phase intensities (preserving workout order)
  const seenIntensities = new Set<IntensityLevel>()
  const orderedIntensities: IntensityLevel[] = []
  for (const phase of phases) {
    if (!seenIntensities.has(phase.intensity)) {
      seenIntensities.add(phase.intensity)
      orderedIntensities.push(phase.intensity)
    }
  }

  // Bucket tracks into phases
  const buckets = new Map<IntensityLevel, Track[]>()
  for (const intensity of orderedIntensities) {
    buckets.set(intensity, [])
  }

  for (const track of tracks) {
    const intensity = matchTrackToPhase(track.bpm, phases)
    if (intensity && buckets.has(intensity)) {
      buckets.get(intensity)!.push(track)
    } else if (intensity) {
      // Phase wasn't in the ordered list (shouldn't happen, but be safe)
      if (!buckets.has(intensity)) {
        orderedIntensities.push(intensity)
        buckets.set(intensity, [])
      }
      buckets.get(intensity)!.push(track)
    } else {
      // Track doesn't match any phase — put it in the first phase as fallback
      if (orderedIntensities.length > 0) {
        buckets.get(orderedIntensities[0])!.push(track)
      }
    }
  }

  // Build result in phase order, skipping empty groups
  return orderedIntensities
    .filter((intensity) => buckets.get(intensity)!.length > 0)
    .map((intensity) => ({
      intensity,
      tracks: buckets.get(intensity)!,
    }))
}

// ─── PhaseSection sub-component ─────────────────────────────────────────────

interface PhaseSectionProps {
  group: PhaseGroup
  /** Global track index offset (for numbering continuity across sections) */
  trackIndexOffset: number
  onPlayTrack?: (uri: string) => void
  currentTrackUri?: string | null
  isPlaying?: boolean
  feedbackMap: TrackFeedbackMap
  handleFeedback: (trackId: string, rating: number) => void
  isAuthenticated: boolean
}

function PhaseSection({
  group,
  trackIndexOffset,
  onPlayTrack,
  currentTrackUri,
  isPlaying,
  feedbackMap,
  handleFeedback,
  isAuthenticated,
}: PhaseSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const sectionId = useId()
  const headerId = `phase-header-${sectionId}`
  const panelId = `phase-panel-${sectionId}`

  const { intensity, tracks } = group

  return (
    <div className="rounded-lg overflow-hidden">
      {/* Section header — collapsible button */}
      <button
        id={headerId}
        onClick={() => setExpanded((prev) => !prev)}
        className="min-h-[44px] w-full flex items-center gap-2.5 px-3 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer select-none"
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        {/* Phase color dot */}
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: PHASE_COLORS[intensity] }}
        />

        {/* Phase label */}
        <span className="text-sm font-semibold flex-1 text-left">
          {INTENSITY_LABELS[intensity]}
        </span>

        {/* Track count + total duration */}
        <span className="text-xs text-[var(--muted)] font-mono flex-shrink-0">
          {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} &middot; {formatTotalDuration(tracks)}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`h-4 w-4 text-[var(--muted)] flex-shrink-0 transition-transform duration-200 ${
            expanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>

      {/* Collapsible track list */}
      <div
        id={panelId}
        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${
          expanded ? 'max-h-[2000px]' : 'max-h-0'
        }`}
        role="region"
        aria-labelledby={headerId}
      >
        <div role="list" aria-label={`${INTENSITY_LABELS[intensity]} tracks`}>
          {tracks.map((track, index) => {
            const globalIndex = trackIndexOffset + index
            const isCurrentTrack = currentTrackUri && track.spotify_uri === currentTrackUri
            const canPlay = !!onPlayTrack && !!track.spotify_uri

            return (
              <div
                key={track.id}
                role="listitem"
                className={`
                  flex items-center gap-1.5 sm:gap-2 px-2 py-2 rounded-lg transition-colors
                  ${isCurrentTrack
                    ? 'bg-[var(--accent)]/5 border-l-2 border-l-[var(--accent)]'
                    : 'hover:bg-[var(--secondary)] border-l-2 border-l-transparent'
                  }
                  animate-fade-slide-up
                `}
                style={{ animationDelay: `${globalIndex * 40}ms` }}
              >
                {/* Track number / play button */}
                <div className="w-9 sm:w-10 flex-shrink-0 flex justify-center">
                  {canPlay ? (
                    <button
                      onClick={() => onPlayTrack!(track.spotify_uri!)}
                      className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
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
                      {globalIndex + 1}
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

                {/* Track name + artist — wraps to 2 lines on mobile */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-tight line-clamp-2" title={track.name}>
                    {track.name}
                  </div>
                  <div className="text-xs text-[var(--muted)] leading-tight line-clamp-1 mt-0.5" title={track.artist}>
                    {track.artist}
                  </div>
                </div>

                {/* BPM — hidden on mobile, visible on sm+ */}
                <span className="hidden sm:block font-mono text-xs w-7 text-right flex-shrink-0">{track.bpm}</span>

                {/* Duration */}
                <span className="font-mono text-xs text-[var(--muted)] w-9 sm:w-10 text-right flex-shrink-0">
                  {formatDuration(track.duration_ms)}
                </span>

                {/* No per-track phase dot or badge — redundant under phase header */}

                {/* Feedback buttons — 44px touch targets */}
                {isAuthenticated && (
                  <div className="flex items-center gap-0 flex-shrink-0">
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
      </div>
    </div>
  )
}

// ─── Main PlaylistDisplay component ─────────────────────────────────────────

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
      } catch (error) {
        console.error('[feedback] Failed to submit track feedback:', error instanceof Error ? error.message : error)
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

  // Determine whether to use grouped or flat rendering
  const useGroupedView = phases && phases.length > 0
  const phaseGroups = useGroupedView ? groupTracksByPhase(playlist.tracks, phases) : []

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

      {/* Track list — grouped by phase or flat */}
      {useGroupedView ? (
        <div className="space-y-2">
          {phaseGroups.map((group, groupIndex) => {
            // Calculate the global track index offset for this group
            const trackIndexOffset = phaseGroups
              .slice(0, groupIndex)
              .reduce((sum, g) => sum + g.tracks.length, 0)

            return (
              <PhaseSection
                key={group.intensity}
                group={group}
                trackIndexOffset={trackIndexOffset}
                onPlayTrack={onPlayTrack}
                currentTrackUri={currentTrackUri}
                isPlaying={isPlaying}
                feedbackMap={feedbackMap}
                handleFeedback={handleFeedback}
                isAuthenticated={isAuthenticated}
              />
            )
          })}
        </div>
      ) : (
        /* Flat list fallback — when no phases provided */
        <div role="list" aria-label={`Playlist tracks, ${playlist.tracks.length} total`}>
          {playlist.tracks.map((track, index) => {
            const isCurrentTrack = currentTrackUri && track.spotify_uri === currentTrackUri
            const canPlay = !!onPlayTrack && !!track.spotify_uri

            return (
              <div
                key={track.id}
                role="listitem"
                className={`
                  flex items-center gap-1.5 sm:gap-2 px-2 py-2 rounded-lg transition-colors
                  ${isCurrentTrack
                    ? 'bg-[var(--accent)]/5 border-l-2 border-l-[var(--accent)]'
                    : 'hover:bg-[var(--secondary)] border-l-2 border-l-transparent'
                  }
                  animate-fade-slide-up
                `}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* Track number / play button */}
                <div className="w-9 sm:w-10 flex-shrink-0 flex justify-center">
                  {canPlay ? (
                    <button
                      onClick={() => onPlayTrack!(track.spotify_uri!)}
                      className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
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

                {/* Track name + artist — wraps to 2 lines on mobile */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-tight line-clamp-2" title={track.name}>
                    {track.name}
                  </div>
                  <div className="text-xs text-[var(--muted)] leading-tight line-clamp-1 mt-0.5" title={track.artist}>
                    {track.artist}
                  </div>
                </div>

                {/* BPM — hidden on mobile, visible on sm+ */}
                <span className="hidden sm:block font-mono text-xs w-7 text-right flex-shrink-0">{track.bpm}</span>

                {/* Duration */}
                <span className="font-mono text-xs text-[var(--muted)] w-9 sm:w-10 text-right flex-shrink-0">
                  {formatDuration(track.duration_ms)}
                </span>

                {/* Feedback buttons — 44px touch targets */}
                {isAuthenticated && (
                  <div className="flex items-center gap-0 flex-shrink-0">
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
      )}

      {/* Spotify fallback for non-Premium or no SDK */}
      {hasSpotifyTracks && !spotifyToken && (
        <SpotifyFallback tracks={playlist.tracks} />
      )}
    </div>
  )
}
