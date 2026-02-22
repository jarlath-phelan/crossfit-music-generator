'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Track } from '@crossfit-playlist/shared'

interface SpotifyMiniPlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  position: number
  duration: number
  onPlayPause: () => void
  onSkipNext: () => void
}

interface SpotifyMiniPlayerContextValue {
  state: SpotifyMiniPlayerState | null
  setState: (state: SpotifyMiniPlayerState | null) => void
}

const SpotifyMiniPlayerContext = createContext<SpotifyMiniPlayerContextValue>({
  state: null,
  setState: () => {},
})

export function useSpotifyMiniPlayer() {
  return useContext(SpotifyMiniPlayerContext)
}

export function SpotifyMiniPlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SpotifyMiniPlayerState | null>(null)

  return (
    <SpotifyMiniPlayerContext.Provider value={{ state, setState }}>
      {children}
    </SpotifyMiniPlayerContext.Provider>
  )
}
