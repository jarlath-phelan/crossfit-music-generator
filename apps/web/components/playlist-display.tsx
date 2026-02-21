'use client'

import type { Track, Playlist } from '@crossfit-playlist/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Music, Clock, Play, ExternalLink } from 'lucide-react'
import { formatDuration, formatTotalDuration } from '@/lib/utils'
import { SpotifyFallback } from '@/components/spotify-player'

interface PlaylistDisplayProps {
  playlist: Playlist
  /** Spotify access token for Web Playback SDK (optional) */
  spotifyToken?: string | null
  /** Called when user clicks play on a track with a spotify_uri */
  onPlayTrack?: (uri: string) => void
  /** URI of the currently playing track */
  currentTrackUri?: string | null
  /** Whether the player is currently playing */
  isPlaying?: boolean
}

export function PlaylistDisplay({
  playlist,
  spotifyToken,
  onPlayTrack,
  currentTrackUri,
  isPlaying,
}: PlaylistDisplayProps) {
  const hasSpotifyTracks = playlist.tracks.some((t) => t.spotify_uri || t.spotify_url)

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
          {playlist.tracks.map((track, index) => {
            const isCurrentTrack = currentTrackUri && track.spotify_uri === currentTrackUri
            const canPlay = !!onPlayTrack && !!track.spotify_uri

            return (
              <div
                key={track.id}
                role="listitem"
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors mb-2 last:mb-0 ${
                  isCurrentTrack
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-card hover:bg-accent/50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Track number / play button */}
                  <div className="w-8 flex-shrink-0 flex justify-center">
                    {canPlay ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onPlayTrack!(track.spotify_uri!)}
                        aria-label={`Play ${track.name}`}
                      >
                        {isCurrentTrack && isPlaying ? (
                          <span className="flex gap-0.5" aria-label="Playing">
                            <span className="w-0.5 h-3 bg-primary animate-pulse" />
                            <span className="w-0.5 h-3 bg-primary animate-pulse delay-75" />
                            <span className="w-0.5 h-3 bg-primary animate-pulse delay-150" />
                          </span>
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    ) : (
                      <span
                        className="text-sm font-medium text-muted-foreground"
                        aria-label={`Track ${index + 1}`}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Album art */}
                  {track.album_art_url && (
                    <img
                      src={track.album_art_url}
                      alt=""
                      className="w-10 h-10 rounded flex-shrink-0"
                      loading="lazy"
                    />
                  )}

                  {/* Track info */}
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
                  {/* Spotify link */}
                  {track.spotify_url && (
                    <a
                      href={track.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`Open ${track.name} in Spotify`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Spotify fallback for non-Premium or no SDK */}
        {hasSpotifyTracks && !spotifyToken && (
          <SpotifyFallback tracks={playlist.tracks} />
        )}
      </CardContent>
    </Card>
  )
}
