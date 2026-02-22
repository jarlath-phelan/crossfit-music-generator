'use client'

import type { Track } from '@crossfit-playlist/shared'
import { ExternalLink } from 'lucide-react'

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
