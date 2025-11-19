import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function formatTotalDuration(tracks: Array<{ duration_ms: number }>): string {
  const totalMs = tracks.reduce((sum, track) => sum + track.duration_ms, 0)
  const totalMinutes = Math.floor(totalMs / 60000)
  const totalSeconds = Math.floor((totalMs % 60000) / 1000)
  return `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`
}

