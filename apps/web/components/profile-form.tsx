'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { updateProfile, type CoachProfileData } from '@/app/actions'

const GENRE_OPTIONS = [
  'rock', 'pop', 'hip-hop', 'electronic', 'metal',
  'country', 'punk', 'indie', 'r&b', 'latin',
]

interface ProfileFormProps {
  initialData: CoachProfileData | null
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [saving, setSaving] = useState(false)
  const [gymName, setGymName] = useState(initialData?.gymName ?? '')
  const [defaultGenre, setDefaultGenre] = useState(initialData?.defaultGenre ?? 'rock')
  const [excludeArtists, setExcludeArtists] = useState(
    (initialData?.excludeArtists ?? []).join(', ')
  )
  const [minEnergy, setMinEnergy] = useState(initialData?.minEnergy ?? 0.5)
  const [allowExplicit, setAllowExplicit] = useState(initialData?.allowExplicit ?? false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile({
        gymName: gymName || undefined,
        defaultGenre,
        excludeArtists: excludeArtists
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        minEnergy,
        allowExplicit,
      })
      toast.success('Preferences saved!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Gym / Box Name</label>
        <input
          type="text"
          value={gymName}
          onChange={(e) => setGymName(e.target.value)}
          placeholder="e.g. CrossFit Delaware Valley"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Default Genre</label>
        <select
          value={defaultGenre}
          onChange={(e) => setDefaultGenre(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {GENRE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Exclude Artists</label>
        <input
          type="text"
          value={excludeArtists}
          onChange={(e) => setExcludeArtists(e.target.value)}
          placeholder="Comma-separated, e.g. Nickelback, Creed"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          These artists will never appear in your playlists.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Minimum Energy: {Math.round(minEnergy * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={minEnergy}
          onChange={(e) => setMinEnergy(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Chill</span>
          <span>High Energy</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="allowExplicit"
          checked={allowExplicit}
          onChange={(e) => setAllowExplicit(e.target.checked)}
          className="rounded border-input"
        />
        <label htmlFor="allowExplicit" className="text-sm">
          Allow explicit tracks
        </label>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </form>
  )
}
