'use server'

import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import type { GeneratePlaylistResponse } from '@crossfit-playlist/shared'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { coachProfiles, savedPlaylists } from '@/lib/schema'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const REQUEST_TIMEOUT_MS = 30000
const MAX_WORKOUT_TEXT_LENGTH = 5000

// ============================================================================
// Auth helpers
// ============================================================================

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

async function requireSession() {
  const session = await getSession()
  if (!session) throw new Error('Authentication required')
  return session
}

// ============================================================================
// Spotify token
// ============================================================================

export async function getSpotifyAccessToken(): Promise<string | null> {
  try {
    const session = await getSession()
    if (!session) return null

    const result = await auth.api.getAccessToken({
      body: { providerId: 'spotify' },
      headers: await headers(),
    })

    return result?.accessToken ?? null
  } catch {
    return null
  }
}

// ============================================================================
// Playlist generation
// ============================================================================

export async function generatePlaylist(
  workoutText: string,
  imageBase64?: string,
  imageMediaType?: string
): Promise<GeneratePlaylistResponse> {
  const hasText = workoutText?.trim()
  const hasImage = imageBase64 && imageMediaType

  if (!hasText && !hasImage) throw new Error('Either workout text or an image is required')
  if (hasText && workoutText.length > MAX_WORKOUT_TEXT_LENGTH)
    throw new Error(`Workout text is too long (max ${MAX_WORKOUT_TEXT_LENGTH} characters)`)

  const body: Record<string, string | undefined> = {}
  if (hasText) body.workout_text = workoutText
  if (hasImage) {
    body.workout_image_base64 = imageBase64
    body.image_media_type = imageMediaType
    if (hasText) body.workout_text = workoutText
  }

  // Build headers — pass user preferences to FastAPI if authenticated
  const fetchHeaders: Record<string, string> = { 'Content-Type': 'application/json' }

  const session = await getSession()
  if (session) {
    fetchHeaders['X-User-ID'] = session.user.id

    const profile = await db.query.coachProfiles.findFirst({
      where: eq(coachProfiles.userId, session.user.id),
    })

    if (profile) {
      if (profile.defaultGenre) fetchHeaders['X-User-Genre'] = profile.defaultGenre
      if (profile.excludeArtists && (profile.excludeArtists as string[]).length > 0) {
        fetchHeaders['X-User-Exclude-Artists'] = (profile.excludeArtists as string[]).join(',')
      }
      if (profile.minEnergy !== null && profile.minEnergy !== undefined) {
        fetchHeaders['X-User-Min-Energy'] = String(profile.minEnergy)
      }
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_URL}/api/v1/generate`, {
      method: 'POST',
      headers: fetchHeaders,
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') throw new Error('Request timed out. Please try again.')
      throw new Error(`Failed to generate playlist: ${error.message}`)
    }
    throw new Error('Failed to generate playlist: Unknown error')
  } finally {
    clearTimeout(timeoutId)
  }
}

// ============================================================================
// Coach profile
// ============================================================================

export interface CoachProfileData {
  gymName?: string
  defaultGenre?: string
  preferredGenres?: string[]
  excludeArtists?: string[]
  minEnergy?: number
  allowExplicit?: boolean
}

export async function getProfile(): Promise<CoachProfileData | null> {
  const session = await getSession()
  if (!session) return null

  const profile = await db.query.coachProfiles.findFirst({
    where: eq(coachProfiles.userId, session.user.id),
  })

  if (!profile) return null

  return {
    gymName: profile.gymName ?? undefined,
    defaultGenre: profile.defaultGenre ?? 'rock',
    preferredGenres: (profile.preferredGenres as string[]) ?? [],
    excludeArtists: (profile.excludeArtists as string[]) ?? [],
    minEnergy: profile.minEnergy ?? 0.5,
    allowExplicit: profile.allowExplicit ?? false,
  }
}

export async function updateProfile(data: CoachProfileData): Promise<CoachProfileData> {
  const session = await requireSession()

  const now = new Date()
  await db
    .insert(coachProfiles)
    .values({
      userId: session.user.id,
      gymName: data.gymName ?? null,
      defaultGenre: data.defaultGenre ?? 'rock',
      preferredGenres: data.preferredGenres ?? [],
      excludeArtists: data.excludeArtists ?? [],
      minEnergy: data.minEnergy ?? 0.5,
      allowExplicit: data.allowExplicit ?? false,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: coachProfiles.userId,
      set: {
        gymName: data.gymName ?? null,
        defaultGenre: data.defaultGenre ?? 'rock',
        preferredGenres: data.preferredGenres ?? [],
        excludeArtists: data.excludeArtists ?? [],
        minEnergy: data.minEnergy ?? 0.5,
        allowExplicit: data.allowExplicit ?? false,
        updatedAt: now,
      },
    })

  return data
}

// ============================================================================
// Saved playlists
// ============================================================================

export interface SavePlaylistInput {
  name: string
  workoutText?: string
  workoutStructure: unknown
  playlistData: unknown
}

export async function savePlaylist(input: SavePlaylistInput): Promise<{ id: string }> {
  const session = await requireSession()

  const [inserted] = await db
    .insert(savedPlaylists)
    .values({
      userId: session.user.id,
      name: input.name,
      workoutText: input.workoutText ?? null,
      workoutStructure: input.workoutStructure,
      playlistData: input.playlistData,
    })
    .returning({ id: savedPlaylists.id })

  return { id: inserted.id }
}

export interface SavedPlaylistSummary {
  id: string
  name: string
  workoutText: string | null
  trackCount: number
  createdAt: string
}

export async function listPlaylists(): Promise<SavedPlaylistSummary[]> {
  const session = await requireSession()

  const rows = await db.query.savedPlaylists.findMany({
    where: eq(savedPlaylists.userId, session.user.id),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })

  return rows.map((row) => {
    const data = row.playlistData as { tracks?: unknown[] } | null
    return {
      id: row.id,
      name: row.name,
      workoutText: row.workoutText,
      trackCount: data?.tracks?.length ?? 0,
      createdAt: row.createdAt.toISOString(),
    }
  })
}

export async function getPlaylistById(id: string) {
  const session = await requireSession()

  const row = await db.query.savedPlaylists.findFirst({
    where: eq(savedPlaylists.id, id),
  })

  if (!row || row.userId !== session.user.id) return null

  return {
    id: row.id,
    name: row.name,
    workoutText: row.workoutText,
    workoutStructure: row.workoutStructure,
    playlistData: row.playlistData,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function deletePlaylist(id: string): Promise<void> {
  const session = await requireSession()

  const row = await db.query.savedPlaylists.findFirst({
    where: eq(savedPlaylists.id, id),
  })

  if (!row || row.userId !== session.user.id) {
    throw new Error('Playlist not found')
  }

  await db.delete(savedPlaylists).where(eq(savedPlaylists.id, id))
}
