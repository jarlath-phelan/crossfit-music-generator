'use client'

import type { Playlist } from '@crossfit-playlist/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Music, Clock } from 'lucide-react'
import { formatDuration, formatTotalDuration } from '@/lib/utils'

interface PlaylistDisplayProps {
  playlist: Playlist
}

export function PlaylistDisplay({ playlist }: PlaylistDisplayProps) {
  // Safely extract Spotify playlist ID
  const getSpotifyEmbedUrl = (url: string): string | null => {
    try {
      const playlistId = url.split('/').pop()?.split('?')[0]
      if (playlistId && /^[a-zA-Z0-9]+$/.test(playlistId)) {
        return `https://open.spotify.com/embed/playlist/${encodeURIComponent(playlistId)}`
      }
      return null
    } catch {
      return null
    }
  }

  const embedUrl = playlist.spotify_url ? getSpotifyEmbedUrl(playlist.spotify_url) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" aria-hidden="true" />
          {playlist.name}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span>{playlist.tracks.length} tracks · {formatTotalDuration(playlist.tracks)} total</span>
        </div>
      </CardHeader>
      <CardContent>
        <div role="list" aria-label={`Playlist tracks, ${playlist.tracks.length} total`}>
          {playlist.tracks.map((track, index) => (
            <div
              key={track.id}
              role="listitem"
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors mb-2 last:mb-0"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="text-sm font-medium text-muted-foreground w-6 flex-shrink-0"
                  aria-label={`Track ${index + 1}`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate" title={track.name}>
                    {track.name}
                  </div>
                  <div className="text-sm text-muted-foreground truncate" title={track.artist}>
                    {track.artist}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                <div className="text-right">
                  <div className="font-mono" aria-label={`${track.bpm} beats per minute`}>
                    {track.bpm} BPM
                  </div>
                  <div className="text-xs" aria-label={`${Math.round(track.energy * 100)} percent energy`}>
                    {Math.round(track.energy * 100)}% energy
                  </div>
                </div>
                <div className="font-mono w-12 text-right">
                  {formatDuration(track.duration_ms)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {embedUrl && (
          <div className="mt-6">
            <iframe
              src={embedUrl}
              width="100%"
              height="380"
              style={{ border: 0 }}
              allow="encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              title="Spotify Playlist Embed"
              className="rounded-lg"
              loading="lazy"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

