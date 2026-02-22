'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export const CROSSFIT_ARTISTS = [
  { name: 'Foo Fighters', genre: 'rock' },
  { name: 'AC/DC', genre: 'rock' },
  { name: 'Metallica', genre: 'metal' },
  { name: 'Eminem', genre: 'hip-hop' },
  { name: 'Rage Against the Machine', genre: 'rock' },
  { name: 'System of a Down', genre: 'metal' },
  { name: 'Run the Jewels', genre: 'hip-hop' },
  { name: 'The Prodigy', genre: 'edm' },
  { name: 'Kendrick Lamar', genre: 'hip-hop' },
  { name: 'Led Zeppelin', genre: 'rock' },
  { name: 'DMX', genre: 'hip-hop' },
  { name: 'Avenged Sevenfold', genre: 'metal' },
  { name: 'Lizzo', genre: 'pop' },
  { name: 'Muse', genre: 'rock' },
  { name: 'Daft Punk', genre: 'edm' },
  { name: 'Rise Against', genre: 'punk' },
  { name: 'Linkin Park', genre: 'rock' },
  { name: 'Beyonce', genre: 'pop' },
  { name: 'Pantera', genre: 'metal' },
  { name: 'Skrillex', genre: 'edm' },
]

interface ArtistPickerGridProps {
  onComplete: (selected: string[]) => void
  onSkip: () => void
}

export function ArtistPickerGrid({ onComplete, onSkip }: ArtistPickerGridProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-center">Pick artists you love</h2>
        <p className="text-sm text-[var(--muted)] text-center mt-1">
          Select at least 3 to personalize your playlists
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 max-h-[50vh] overflow-y-auto p-1">
        {CROSSFIT_ARTISTS.map((artist) => (
          <button
            key={artist.name}
            onClick={() => toggle(artist.name)}
            className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all text-center ${
              selected.has(artist.name)
                ? 'bg-[var(--accent)]/20 ring-2 ring-[var(--accent)] scale-95'
                : 'bg-[var(--card)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
              selected.has(artist.name)
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--border)]'
            }`}>
              {artist.name.charAt(0)}
            </div>
            <span className="text-[10px] leading-tight line-clamp-2">{artist.name}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onSkip}>
          Skip
        </Button>
        <Button
          variant="accent"
          className="flex-1"
          onClick={() => onComplete(Array.from(selected))}
          disabled={selected.size < 3}
        >
          Continue ({selected.size} selected)
        </Button>
      </div>
    </div>
  )
}
