import type { TasteProfileData } from '@/app/actions'

const TASTE_CACHE_KEY = 'crank_taste_profile'
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

interface CachedTaste {
  data: TasteProfileData
  cachedAt: number
}

export function getCachedTasteProfile(): TasteProfileData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(TASTE_CACHE_KEY)
    if (!raw) return null
    const cached: CachedTaste = JSON.parse(raw)
    if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(TASTE_CACHE_KEY)
      return null
    }
    return cached.data
  } catch {
    return null
  }
}

export function setCachedTasteProfile(data: TasteProfileData): void {
  if (typeof window === 'undefined') return
  try {
    const cached: CachedTaste = { data, cachedAt: Date.now() }
    localStorage.setItem(TASTE_CACHE_KEY, JSON.stringify(cached))
  } catch {
    // localStorage may be full or blocked
  }
}

export function clearTasteCache(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TASTE_CACHE_KEY)
}
