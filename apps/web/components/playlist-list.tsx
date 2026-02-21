'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Trash2, ListMusic } from 'lucide-react'
import { deletePlaylist, type SavedPlaylistSummary } from '@/app/actions'

interface PlaylistListProps {
  playlists: SavedPlaylistSummary[]
}

export function PlaylistList({ playlists: initialPlaylists }: PlaylistListProps) {
  const [playlists, setPlaylists] = useState(initialPlaylists)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deletePlaylist(id)
      setPlaylists((prev) => prev.filter((p) => p.id !== id))
      toast.success('Playlist deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  if (playlists.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ListMusic className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No saved playlists yet</p>
        <p className="text-sm mt-1">Generate a playlist and save it to see it here.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {playlists.map((playlist) => (
        <Card key={playlist.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <Link href={`/playlist/${playlist.id}`} className="hover:underline">
                <CardTitle className="text-lg">{playlist.name}</CardTitle>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(playlist.id)}
                disabled={deletingId === playlist.id}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              {playlist.trackCount} tracks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {playlist.workoutText && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {playlist.workoutText}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(playlist.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
