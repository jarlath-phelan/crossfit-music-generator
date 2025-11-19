'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { GeneratePlaylistResponse } from '@crossfit-playlist/shared'
import { generatePlaylist } from './actions'
import { WorkoutForm } from '@/components/workout-form'
import { WorkoutDisplay } from '@/components/workout-display'
import { PlaylistDisplay } from '@/components/playlist-display'
import { Music } from 'lucide-react'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GeneratePlaylistResponse | null>(null)

  const handleSubmit = async (workoutText: string) => {
    setIsLoading(true)
    setResult(null)

    try {
      const data = await generatePlaylist(workoutText)
      setResult(data)
      toast.success('Playlist generated successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate playlist'
      toast.error(message)
      console.error('Error generating playlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="h-10 w-10" />
            <h1 className="text-4xl font-bold tracking-tight">
              CrossFit Playlist Generator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate custom workout playlists from your CrossFit workout descriptions.
            Powered by AI-driven music curation matching your workout intensity.
          </p>
        </div>

        {/* Workout Form */}
        <div className="mb-8">
          <WorkoutForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WorkoutDisplay workout={result.workout} />
            <PlaylistDisplay playlist={result.playlist} />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>
            MVP powered by mock APIs · No Spotify or Anthropic keys required
          </p>
          <p className="mt-2">
            Future features: Coach profiles, Multi-user sessions, Real-time biometric adjustment
          </p>
        </footer>
      </div>
    </main>
  )
}

