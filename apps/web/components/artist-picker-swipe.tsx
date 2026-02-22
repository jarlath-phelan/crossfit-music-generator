'use client'

import { useState, useCallback } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CROSSFIT_ARTISTS } from './artist-picker-grid'

interface ArtistPickerSwipeProps {
  onComplete: (selected: string[]) => void
  onSkip: () => void
}

export function ArtistPickerSwipe({ onComplete, onSkip }: ArtistPickerSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [liked, setLiked] = useState<string[]>([])
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)

  const artist = CROSSFIT_ARTISTS[currentIndex]
  const remaining = CROSSFIT_ARTISTS.length - currentIndex
  const isDone = currentIndex >= CROSSFIT_ARTISTS.length

  const advance = useCallback((like: boolean) => {
    if (like) {
      setLiked((prev) => [...prev, CROSSFIT_ARTISTS[currentIndex].name])
      setDirection('right')
    } else {
      setDirection('left')
    }
    setTimeout(() => {
      setDirection(null)
      setCurrentIndex((prev) => prev + 1)
    }, 200)
  }, [currentIndex])

  if (isDone || liked.length >= 5) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-bold">
          {liked.length > 0 ? `Great taste! ${liked.length} artists selected.` : 'All done!'}
        </h2>
        <Button variant="accent" className="w-full" onClick={() => onComplete(liked)}>
          Continue
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-center">Like or skip</h2>
        <p className="text-sm text-[var(--muted)] text-center mt-1">
          {liked.length} liked · {remaining} remaining
        </p>
      </div>

      <div
        className={`relative bg-[var(--background)] rounded-2xl p-8 text-center transition-all duration-200 ${
          direction === 'right' ? 'translate-x-12 opacity-0 rotate-6' :
          direction === 'left' ? '-translate-x-12 opacity-0 -rotate-6' : ''
        }`}
      >
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold bg-[var(--border)] mb-4">
          {artist.name.charAt(0)}
        </div>
        <div className="text-lg font-semibold">{artist.name}</div>
        <div className="text-xs text-[var(--muted)] capitalize">{artist.genre}</div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-14"
          onClick={() => advance(false)}
        >
          <ThumbsDown className="h-5 w-5 mr-2" /> Skip
        </Button>
        <Button
          variant="accent"
          className="flex-1 h-14"
          onClick={() => advance(true)}
        >
          <ThumbsUp className="h-5 w-5 mr-2" /> Like
        </Button>
      </div>

      <button
        onClick={onSkip}
        className="w-full text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        Skip artist selection
      </button>
    </div>
  )
}
