'use client'

import type { Playlist } from '@crossfit-playlist/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Music, Clock } from 'lucide-react'
import { formatDuration, formatTotalDuration } from '@/lib/utils'

interface PlaylistDisplayProps {
  playlist: Playlist
}

export function PlaylistDisplay({ playlist }: PlaylistDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          {playlist.name}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {playlist.tracks.length} tracks · {formatTotalDuration(playlist.tracks)} total
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {playlist.tracks.map((track, index) => (
            <div
              key={track.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-sm font-medium text-muted-foreground w-6 flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{track.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {track.artist}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                <div className="text-right">
                  <div className="font-mono">{track.bpm} BPM</div>
                  <div className="text-xs">
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
        
        {playlist.spotify_url && (
          <div className="mt-6">
            <iframe
              src={`https://open.spotify.com/embed/playlist/${playlist.spotify_url.split('/').pop()}`}
              width="100%"
              height="380"
              frameBorder="0"
              allow="encrypted-media"
              title="Spotify Playlist"
              className="rounded-lg"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

