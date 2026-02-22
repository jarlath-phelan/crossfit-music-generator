'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { updateAppSetting, type AppSettingsMap } from '@/app/actions'

const MUSIC_STRATEGIES = [
  { value: 'claude', label: 'Claude Generator', description: 'Claude suggests songs from memory (current)' },
  { value: 'claude_deezer_verify', label: 'Claude + Deezer Verify', description: 'Claude suggests, Deezer confirms existence + real BPM' },
  { value: 'deezer_claude_rerank', label: 'Deezer + Claude Re-rank', description: 'Deezer finds candidates by BPM, Claude re-ranks top 15-20' },
  { value: 'claude_two_step', label: 'Two-Step Claude', description: 'Claude generates 40-50 candidates, then re-ranks top 15-20' },
  { value: 'hybrid', label: 'Hybrid', description: 'Deezer first per phase, Claude fallback if too few results' },
]

const ONBOARDING_STYLES = [
  { value: 'grid', label: 'Artist Grid', description: 'Tappable grid of ~20 artists with album art' },
  { value: 'swipe', label: 'Swipe Cards', description: 'Tinder-style one-at-a-time yes/no cards' },
]

const ARTIST_EXPANSION_OPTIONS = [
  { value: 'lastfm', label: 'Last.fm', description: 'Expand via Last.fm getSimilar API' },
  { value: 'claude', label: 'Claude', description: 'Ask Claude for similar artists' },
  { value: 'hybrid', label: 'Hybrid', description: 'Last.fm primary, Claude fallback' },
]

interface SettingsFormProps {
  initialSettings: AppSettingsMap
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState<string | null>(null)

  const handleChange = async (key: string, value: string) => {
    setSaving(key)
    try {
      await updateAppSetting(key, value)
      setSettings((prev) => ({ ...prev, [key]: value }))
      toast.success(`Updated ${key.replace(/_/g, ' ')}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-8 max-w-lg">
      <SettingGroup
        title="Music Pipeline Strategy"
        description="Controls how tracks are discovered and ranked for playlists."
        options={MUSIC_STRATEGIES}
        currentValue={settings.music_strategy ?? 'claude'}
        settingKey="music_strategy"
        saving={saving}
        onChange={handleChange}
      />

      <SettingGroup
        title="Onboarding Style"
        description="How new users pick their favorite artists during onboarding."
        options={ONBOARDING_STYLES}
        currentValue={settings.onboarding_style ?? 'grid'}
        settingKey="onboarding_style"
        saving={saving}
        onChange={handleChange}
      />

      <SettingGroup
        title="Artist Expansion"
        description="How liked artists are expanded to discover similar artists."
        options={ARTIST_EXPANSION_OPTIONS}
        currentValue={settings.artist_expansion ?? 'claude'}
        settingKey="artist_expansion"
        saving={saving}
        onChange={handleChange}
      />
    </div>
  )
}

function SettingGroup({
  title,
  description,
  options,
  currentValue,
  settingKey,
  saving,
  onChange,
}: {
  title: string
  description: string
  options: { value: string; label: string; description: string }[]
  currentValue: string
  settingKey: string
  saving: string | null
  onChange: (key: string, value: string) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-[var(--muted)]">{description}</p>
      </div>
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(settingKey, opt.value)}
            disabled={saving === settingKey}
            className={`w-full text-left rounded-lg border p-3 transition-colors ${
              currentValue === opt.value
                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--border)] hover:border-[var(--accent)]/50'
            }`}
          >
            <div className="text-sm font-medium">{opt.label}</div>
            <div className="text-xs text-[var(--muted)]">{opt.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
