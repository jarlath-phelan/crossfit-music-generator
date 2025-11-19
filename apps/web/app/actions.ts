'use server'

import type { GeneratePlaylistResponse } from '@crossfit-playlist/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const REQUEST_TIMEOUT_MS = 30000 // 30 seconds
const MAX_WORKOUT_TEXT_LENGTH = 5000

export async function generatePlaylist(workoutText: string): Promise<GeneratePlaylistResponse> {
  // Input validation
  if (!workoutText?.trim()) {
    throw new Error('Workout text is required')
  }

  if (workoutText.length > MAX_WORKOUT_TEXT_LENGTH) {
    throw new Error(`Workout text is too long (max ${MAX_WORKOUT_TEXT_LENGTH} characters)`)
  }

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workout_text: workoutText }),
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `API error: ${response.status}`)
    }

    const data: GeneratePlaylistResponse = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.')
      }
      throw new Error(`Failed to generate playlist: ${error.message}`)
    }
    throw new Error('Failed to generate playlist: Unknown error')
  } finally {
    clearTimeout(timeoutId)
  }
}

