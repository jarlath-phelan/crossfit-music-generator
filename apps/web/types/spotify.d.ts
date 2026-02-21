// Spotify Web Playback SDK type declarations

interface Window {
  onSpotifyWebPlaybackSDKReady?: () => void
  Spotify?: typeof Spotify
}

declare namespace Spotify {
  interface PlayerOptions {
    name: string
    getOAuthToken: (cb: (token: string) => void) => void
    volume?: number
  }

  interface Player {
    connect(): Promise<boolean>
    disconnect(): void
    pause(): Promise<void>
    resume(): Promise<void>
    seek(positionMs: number): Promise<void>
    nextTrack(): Promise<void>
    previousTrack(): Promise<void>
    getCurrentState(): Promise<PlaybackState | null>
    setVolume(volume: number): Promise<void>
    addListener(event: 'ready', cb: (data: { device_id: string }) => void): void
    addListener(event: 'not_ready', cb: (data: { device_id: string }) => void): void
    addListener(event: 'player_state_changed', cb: (state: PlaybackState | null) => void): void
    addListener(event: 'initialization_error', cb: (data: { message: string }) => void): void
    addListener(event: 'authentication_error', cb: (data: { message: string }) => void): void
    addListener(event: 'account_error', cb: (data: { message: string }) => void): void
    addListener(event: 'playback_error', cb: (data: { message: string }) => void): void
    removeListener(event: string, cb?: Function): void
  }

  interface PlaybackState {
    paused: boolean
    position: number
    duration: number
    track_window: {
      current_track: Track
      previous_tracks: Track[]
      next_tracks: Track[]
    }
  }

  interface Track {
    uri: string
    id: string
    type: string
    name: string
    duration_ms: number
    artists: { name: string; uri: string }[]
    album: {
      name: string
      uri: string
      images: { url: string; width: number; height: number }[]
    }
  }

  // Constructor
  const Player: {
    new (options: PlayerOptions): Player
  }
}
