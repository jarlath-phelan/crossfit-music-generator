'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface SpotifyPlayerState {
  isReady: boolean
  isPlaying: boolean
  currentTrackUri: string | null
  position: number // ms
  duration: number // ms
  error: string | null
}

interface UseSpotifyPlayerOptions {
  accessToken: string | null
  onError?: (error: string) => void
}

interface UseSpotifyPlayerReturn extends SpotifyPlayerState {
  play: (uri: string) => void
  pause: () => void
  resume: () => void
  seek: (positionMs: number) => void
  skipToNext: () => void
  skipToPrevious: () => void
}

/**
 * Hook for Spotify Web Playback SDK lifecycle management.
 *
 * Requires:
 * - A valid Spotify Premium access token with `streaming` scope
 * - The Spotify Web Playback SDK script loaded in the page
 *
 * When no access token is provided, the player won't initialize
 * and isReady will remain false (fallback to embed/links).
 */
export function useSpotifyPlayer({
  accessToken,
  onError,
}: UseSpotifyPlayerOptions): UseSpotifyPlayerReturn {
  const [state, setState] = useState<SpotifyPlayerState>({
    isReady: false,
    isPlaying: false,
    currentTrackUri: null,
    position: 0,
    duration: 0,
    error: null,
  })

  const playerRef = useRef<Spotify.Player | null>(null)
  const deviceIdRef = useRef<string | null>(null)

  // Initialize SDK
  useEffect(() => {
    if (!accessToken) return

    // Load Spotify SDK script if not present
    if (!document.getElementById('spotify-sdk')) {
      const script = document.createElement('script')
      script.id = 'spotify-sdk'
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      document.body.appendChild(script)
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new Spotify.Player({
        name: 'CrossFit Playlist Generator',
        getOAuthToken: (cb) => cb(accessToken),
        volume: 0.8,
      })

      player.addListener('ready', ({ device_id }) => {
        deviceIdRef.current = device_id
        setState((prev) => ({ ...prev, isReady: true, error: null }))
      })

      player.addListener('not_ready', () => {
        deviceIdRef.current = null
        setState((prev) => ({ ...prev, isReady: false }))
      })

      player.addListener('player_state_changed', (playerState) => {
        if (!playerState) return
        const currentTrack = playerState.track_window.current_track
        setState((prev) => ({
          ...prev,
          isPlaying: !playerState.paused,
          currentTrackUri: currentTrack?.uri || null,
          position: playerState.position,
          duration: playerState.duration,
        }))
      })

      player.addListener('initialization_error', ({ message }) => {
        const err = `Spotify init error: ${message}`
        setState((prev) => ({ ...prev, error: err }))
        onError?.(err)
      })

      player.addListener('authentication_error', ({ message }) => {
        const err = `Spotify auth error: ${message}`
        setState((prev) => ({ ...prev, error: err, isReady: false }))
        onError?.(err)
      })

      player.addListener('account_error', ({ message }) => {
        const err = `Spotify account error (Premium required): ${message}`
        setState((prev) => ({ ...prev, error: err, isReady: false }))
        onError?.(err)
      })

      player.connect()
      playerRef.current = player
    }

    // If SDK is already loaded, trigger manually
    if (window.Spotify) {
      window.onSpotifyWebPlaybackSDKReady?.()
    }

    return () => {
      playerRef.current?.disconnect()
      playerRef.current = null
      deviceIdRef.current = null
    }
  }, [accessToken, onError])

  const play = useCallback(
    (uri: string) => {
      if (!accessToken || !deviceIdRef.current) return

      fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ uris: [uri] }),
        }
      ).catch((err) => {
        const msg = `Failed to play: ${err.message}`
        setState((prev) => ({ ...prev, error: msg }))
        onError?.(msg)
      })
    },
    [accessToken, onError]
  )

  const pause = useCallback(() => {
    playerRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    playerRef.current?.resume()
  }, [])

  const seek = useCallback((positionMs: number) => {
    playerRef.current?.seek(positionMs)
  }, [])

  const skipToNext = useCallback(() => {
    playerRef.current?.nextTrack()
  }, [])

  const skipToPrevious = useCallback(() => {
    playerRef.current?.previousTrack()
  }, [])

  return {
    ...state,
    play,
    pause,
    resume,
    seek,
    skipToNext,
    skipToPrevious,
  }
}
