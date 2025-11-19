'use server'

import type { GeneratePlaylistResponse } from '@crossfit-playlist/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function generatePlaylist(workoutText: string): Promise<GeneratePlaylistResponse> {
  try {
    const response = await fetch(`${API_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workout_text: workoutText }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `API error: ${response.status}`)
    }

    const data: GeneratePlaylistResponse = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate playlist: ${error.message}`)
    }
    throw new Error('Failed to generate playlist: Unknown error')
  }
}

