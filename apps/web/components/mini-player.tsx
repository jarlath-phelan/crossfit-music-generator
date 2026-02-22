'use client'

import { Play, Pause, SkipForward } from 'lucide-react'
import type { Track } from '@crossfit-playlist/shared'

interface MiniPlayerProps {
  currentTrack: Track | null
  isPlaying: boolean
  onPlayPause: () => void
  onSkipNext: () => void
  position: number
  duration: number
}

export function MiniPlayer({
  currentTrack,
  isPlaying,
  onPlayPause,
  onSkipNext,
  position,
  duration,
}: MiniPlayerProps) {
  if (!currentTrack) return null

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0

  return (
    <div className="relative">
      {/* Progress bar — thin line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--surface-3)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 pt-2 pb-1">
        {/* Album art */}
        {currentTrack.album_art_url ? (
          <img
            src={currentTrack.album_art_url}
            alt=""
            className="w-10 h-10 rounded flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-[var(--surface-3)] flex-shrink-0" />
        )}

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate leading-tight">
            {currentTrack.name}
          </div>
          <div className="text-xs text-[var(--muted)] truncate leading-tight">
            {currentTrack.artist}
          </div>
        </div>

        {/* Play/Pause — 44px touch target */}
        <button
          onClick={onPlayPause}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--surface-3)] transition-colors flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        {/* Skip — 44px touch target */}
        <button
          onClick={onSkipNext}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] transition-colors flex-shrink-0"
          aria-label="Next track"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
