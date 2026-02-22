# Tier 1 Design Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the 6 critical design fixes from the expert panel (C1–C6) to bring Crank from 4.6/10 to ~7/10 overall design score.

**Architecture:** Fix surface-level styling bugs first (white cards, skeleton), then restructure the playlist display into collapsible phase sections, merge the player into the tab bar as a mini-player, upgrade the loading indicator, and finish with a brand voice copywriting pass.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, CSS custom properties (design tokens in `globals.css`), Tailwind config keyframes/animations, Lucide icons, `class-variance-authority` for button variants.

---

### Task 1: Fix White Phase Cards (C3)

The phase cards in `workout-display.tsx` and `generate-skeleton.tsx` use hardcoded `bg-white` which looks wrong on the dark theme. Also the skeleton uses `bg-gray-*` colors. Fix to use design tokens.

**Files:**
- Modify: `apps/web/components/workout-display.tsx:47`
- Modify: `apps/web/components/generate-skeleton.tsx:15,19-21,23,30,40-41,43-44`

**Step 1: Fix workout-display.tsx phase card background**

In `apps/web/components/workout-display.tsx`, line 47, change:
```
bg-white rounded-xl border border-[var(--border)] border-l-4
```
to:
```
bg-[var(--surface-1)] rounded-xl border border-[var(--border)] border-l-4
```

**Step 2: Fix generate-skeleton.tsx card backgrounds**

In `apps/web/components/generate-skeleton.tsx`:

Line 15 — change `bg-white` to `bg-[var(--surface-1)]`:
```tsx
className={`${i === 2 ? 'flex-[2]' : 'flex-1'} bg-[var(--surface-1)] rounded-xl border border-[var(--border)] p-3 animate-pulse`}
```

Lines 19-21 — change `bg-gray-200`, `bg-gray-100` to `bg-[var(--surface-3)]` and `bg-[var(--surface-2)]`:
```tsx
<div className="h-4 w-16 bg-[var(--surface-3)] rounded" />
<div className="h-3 w-12 bg-[var(--surface-2)] rounded" />
<div className="h-3 w-8 bg-[var(--surface-2)] rounded" />
```

Line 23 — change `bg-gray-100` to `bg-[var(--surface-2)]`:
```tsx
<div className="h-12 w-12 rounded-full bg-[var(--surface-2)]" />
```

Line 30 — change `bg-gray-50` to `bg-[var(--surface-1)]`:
```tsx
<div className="h-14 bg-[var(--surface-1)] rounded-lg animate-pulse" />
```

Lines 40-41 — change `bg-gray-100` to `bg-[var(--surface-2)]`:
```tsx
<div className="w-7 h-4 bg-[var(--surface-2)] rounded" />
<div className="w-8 h-8 bg-[var(--surface-2)] rounded" />
```

Lines 43-44 — change `bg-gray-200`/`bg-gray-100` to tokens:
```tsx
<div className="h-3.5 w-32 bg-[var(--surface-3)] rounded" />
<div className="h-3 w-20 bg-[var(--surface-2)] rounded" />
```

Line 46 — change remaining `bg-gray-*`:
```tsx
<div className="h-4 w-16 bg-[var(--surface-2)] rounded" />
<div className="h-3 w-10 bg-[var(--surface-2)] rounded" />
```

**Step 3: Fix button outline variant**

In `apps/web/components/ui/button.tsx`, line 15, the `outline` variant uses `bg-white`. Change:
```
"border border-[var(--border)] bg-white hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
```
to:
```
"border border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
```

**Step 4: Verify visually**

Run: `pnpm dev --filter=web`

Open http://localhost:3000/generate. Verify:
- Phase cards have dark backgrounds matching the theme (no white cards)
- Skeleton loader uses dark token colors (no gray-200 flashes)
- Outline buttons are dark, not white
- Works in both dark and light mode (tokens handle both via CSS)

**Step 5: Commit**

```bash
git add apps/web/components/workout-display.tsx apps/web/components/generate-skeleton.tsx apps/web/components/ui/button.tsx
git commit -m "fix(web): white phase cards → use surface tokens (C3)"
```

---

### Task 2: Fix Player Bar Accessibility (C2)

The Spotify player has sub-44px touch targets (skip buttons: 28px, play/pause: 36px) and sub-12px text (11px, 10px). Fix sizes and use themed colors.

**Files:**
- Modify: `apps/web/components/spotify-player.tsx:129,153,183-214,219-239`

**Step 1: Fix text sizes to meet 12px minimum**

In `apps/web/components/spotify-player.tsx`:

Line 129 — change `text-[11px]` to `text-xs` (12px):
```tsx
<div className="flex items-center gap-2 text-xs text-[var(--muted)]">
```

Line 153 — change `text-[10px]` to `text-xs` (12px):
```tsx
<div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)] font-mono">
```

**Step 2: Fix button touch targets to meet 44px minimum**

Lines 184-192 — skip previous button, change `h-7 w-7` to `min-h-[44px] min-w-[44px]` and icon from `h-3.5 w-3.5` to `h-4 w-4`:
```tsx
<Button
  variant="ghost"
  size="icon"
  className="min-h-[44px] min-w-[44px]"
  onClick={onSkipPrevious}
  aria-label="Previous track"
>
  <SkipBack className="h-4 w-4" />
</Button>
```

Lines 193-205 — play/pause button, change `h-9 w-9` to `min-h-[44px] min-w-[44px]` and icon from `h-4.5 w-4.5` to `h-5 w-5`:
```tsx
<Button
  variant="ghost"
  size="icon"
  className="min-h-[44px] min-w-[44px]"
  onClick={handlePlayPause}
  aria-label={isPlaying ? 'Pause' : 'Play'}
>
  {isPlaying ? (
    <Pause className="h-5 w-5" />
  ) : (
    <Play className="h-5 w-5" />
  )}
</Button>
```

Lines 206-214 — skip next button, same treatment as skip previous:
```tsx
<Button
  variant="ghost"
  size="icon"
  className="min-h-[44px] min-w-[44px]"
  onClick={onSkipNext}
  aria-label="Next track"
>
  <SkipForward className="h-4 w-4" />
</Button>
```

**Step 3: Fix volume mute button touch target**

Lines 219-229 — change the `<button>` with `p-1` to have 44px target:
```tsx
<button
  onClick={handleMuteToggle}
  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
  aria-label={isMuted ? 'Unmute' : 'Mute'}
>
```

**Step 4: Verify visually**

Run: `pnpm dev --filter=web`

Generate a playlist, sign in with Spotify, and play a track. Verify:
- All player buttons are at least 44×44px (use browser DevTools to check)
- Text is at least 12px (artist name, timestamps)
- Controls are easily tappable on mobile

**Step 5: Commit**

```bash
git add apps/web/components/spotify-player.tsx
git commit -m "fix(web): player bar accessibility — 44px buttons, 12px+ text (C2)"
```

---

### Task 3: Collapsible Phase Sections in Playlist (C1)

Group tracks by workout phase with collapsible section headers. Each section shows: phase color dot, phase name, track count, section duration. Tap to collapse/expand. All sections start expanded.

**Files:**
- Modify: `apps/web/components/playlist-display.tsx`

**Step 1: Add phase grouping logic**

At the top of `playlist-display.tsx`, after the existing `matchTrackToPhase` function, add a helper to group tracks into phase sections:

```tsx
interface PhaseGroup {
  intensity: IntensityLevel
  name: string
  tracks: { track: Track; originalIndex: number }[]
  totalDurationMs: number
}

function groupTracksByPhase(tracks: Track[], phases: Phase[]): PhaseGroup[] {
  // If no phases, return a single group with all tracks
  if (!phases || phases.length === 0) {
    return [{
      intensity: 'moderate' as IntensityLevel,
      name: 'All Tracks',
      tracks: tracks.map((track, i) => ({ track, originalIndex: i })),
      totalDurationMs: tracks.reduce((sum, t) => sum + t.duration_ms, 0),
    }]
  }

  const groups = new Map<IntensityLevel, PhaseGroup>()

  // Initialize groups in phase order
  for (const phase of phases) {
    if (!groups.has(phase.intensity)) {
      groups.set(phase.intensity, {
        intensity: phase.intensity,
        name: phase.name,
        tracks: [],
        totalDurationMs: 0,
      })
    }
  }

  // Assign each track to a group
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i]
    const intensity = matchTrackToPhase(track.bpm, phases)
    if (intensity && groups.has(intensity)) {
      const group = groups.get(intensity)!
      group.tracks.push({ track, originalIndex: i })
      group.totalDurationMs += track.duration_ms
    } else {
      // Fallback: add to first group
      const firstGroup = groups.values().next().value
      if (firstGroup) {
        firstGroup.tracks.push({ track, originalIndex: i })
        firstGroup.totalDurationMs += track.duration_ms
      }
    }
  }

  // Return only groups that have tracks, in phase order
  return Array.from(groups.values()).filter(g => g.tracks.length > 0)
}
```

**Step 2: Add collapsible state and render phase sections**

Replace the `{/* Track rows */}` section (the `<div role="list">` block, approximately lines 125–256) with phase-grouped rendering:

```tsx
function PhaseSection({
  group,
  phases,
  spotifyToken,
  onPlayTrack,
  currentTrackUri,
  isPlaying,
  feedbackMap,
  playlistId,
  isAuthenticated,
  handleFeedback,
  isPending,
}: {
  group: PhaseGroup
  phases?: Phase[]
  spotifyToken?: string | null
  onPlayTrack?: (uri: string) => void
  currentTrackUri?: string | null
  isPlaying?: boolean
  feedbackMap: TrackFeedbackMap
  playlistId?: string | null
  isAuthenticated: boolean
  handleFeedback: (trackId: string, rating: number) => void
  isPending: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const phaseColor = `var(--phase-${group.intensity === 'warm_up' ? 'warmup' : group.intensity === 'very_high' ? 'very-high' : group.intensity})`

  return (
    <div className="mb-2">
      {/* Section header — always visible, tappable to toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-2 py-2 min-h-[44px] rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`phase-${group.intensity}`}
      >
        {/* Phase color dot */}
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: phaseColor }}
        />
        {/* Phase name */}
        <span className="text-sm font-semibold uppercase tracking-wide flex-1 text-left">
          {INTENSITY_LABELS[group.intensity]}
        </span>
        {/* Track count + duration */}
        <span className="text-xs text-[var(--muted)] font-mono">
          {group.tracks.length} {group.tracks.length === 1 ? 'track' : 'tracks'} · {formatTotalDuration(group.tracks.map(t => t.track))}
        </span>
        {/* Chevron */}
        <svg
          className={`h-4 w-4 text-[var(--muted)] transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible track list */}
      <div
        id={`phase-${group.intensity}`}
        className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div role="list" aria-label={`${INTENSITY_LABELS[group.intensity]} tracks`} className="mt-1">
          {group.tracks.map(({ track, originalIndex }) => {
            const isCurrentTrack = currentTrackUri && track.spotify_uri === currentTrackUri
            const canPlay = !!onPlayTrack && !!track.spotify_uri

            return (
              <div
                key={track.id}
                role="listitem"
                className={`
                  flex items-center gap-2 px-2 py-2 rounded-lg transition-colors
                  ${isCurrentTrack
                    ? 'bg-[var(--accent)]/5 border-l-2 border-l-[var(--accent)]'
                    : 'hover:bg-[var(--secondary)] border-l-2 border-l-transparent'
                  }
                `}
              >
                {/* Track number / play button */}
                <div className="w-10 flex-shrink-0 flex justify-center">
                  {canPlay ? (
                    <button
                      onClick={() => onPlayTrack!(track.spotify_uri!)}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                      aria-label={`Play ${track.name}`}
                    >
                      {isCurrentTrack && isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                      )}
                    </button>
                  ) : (
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {originalIndex + 1}
                    </span>
                  )}
                </div>

                {/* Album art */}
                {track.album_art_url && (
                  <img
                    src={track.album_art_url}
                    alt=""
                    className="w-8 h-8 rounded flex-shrink-0"
                    loading="lazy"
                  />
                )}

                {/* Track name + artist */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate leading-tight" title={track.name}>
                    {track.name}
                  </div>
                  <div className="text-xs text-[var(--muted)] truncate leading-tight" title={track.artist}>
                    {track.artist}
                  </div>
                </div>

                {/* BPM */}
                <span className="font-mono text-xs w-7 text-right flex-shrink-0">{track.bpm}</span>

                {/* Duration */}
                <span className="font-mono text-xs text-[var(--muted)] w-10 text-right flex-shrink-0">
                  {formatDuration(track.duration_ms)}
                </span>

                {/* Feedback buttons — 44px touch targets */}
                {isAuthenticated && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleFeedback(track.id, 1)}
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded transition-colors ${
                        feedbackMap[track.id] === 1
                          ? 'text-green-400 bg-green-400/10'
                          : 'text-[var(--muted)] hover:text-green-400'
                      }`}
                      aria-label={`Thumbs up ${track.name}`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(track.id, -1)}
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded transition-colors ${
                        feedbackMap[track.id] === -1
                          ? 'text-red-400 bg-red-400/10'
                          : 'text-[var(--muted)] hover:text-red-400'
                      }`}
                      aria-label={`Thumbs down ${track.name}`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Spotify link — 44px touch target */}
                {track.spotify_url && (
                  <a
                    href={track.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
                    aria-label={`Open ${track.name} in Spotify`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Update PlaylistDisplay to use phase groups**

In the `PlaylistDisplay` component's return, replace the `{/* Track rows */}` div (lines 124–256) with:

```tsx
{/* Phase-grouped track sections */}
{phases && phases.length > 0 ? (
  <div>
    {groupTracksByPhase(playlist.tracks, phases).map((group) => (
      <PhaseSection
        key={group.intensity}
        group={group}
        phases={phases}
        spotifyToken={spotifyToken}
        onPlayTrack={onPlayTrack}
        currentTrackUri={currentTrackUri}
        isPlaying={isPlaying}
        feedbackMap={feedbackMap}
        playlistId={playlistId}
        isAuthenticated={isAuthenticated}
        handleFeedback={handleFeedback}
        isPending={isPending}
      />
    ))}
  </div>
) : (
  /* Flat list fallback when no phases */
  <div role="list" aria-label={`Playlist tracks, ${playlist.tracks.length} total`}>
    {playlist.tracks.map((track, index) => {
      /* ... keep existing flat track row rendering as fallback ... */
    })}
  </div>
)}
```

For the fallback flat list, keep the existing track row JSX from the original code (the same `map` over `playlist.tracks` that's currently there, minus the phase dot and phase badge since there are no phases).

**Step 4: Remove per-track phase dot and badge from phase-grouped view**

Since tracks are now grouped under phase headers, the per-track phase dot (`<span className="w-2 h-2 rounded-full">`) and desktop phase badge (`<Badge>`) are redundant in the `PhaseSection` component. They are already removed in the `PhaseSection` code above.

**Step 5: Verify visually**

Run: `pnpm dev --filter=web`

Generate a playlist. Verify:
- Tracks are grouped under phase headers (WARM UP, HIGH, COOLDOWN, etc.)
- Each header shows phase color dot, name, track count, duration
- Tapping a header collapses/expands the section
- All sections start expanded
- The flat list still works if somehow phases are missing

**Step 6: Commit**

```bash
git add apps/web/components/playlist-display.tsx
git commit -m "feat(web): collapsible phase sections for track grouping (C1)"
```

---

### Task 4: Mini-Player Merged into Tab Bar (C2/I1)

Merge the Spotify player into the tab bar as a compact mini-player row above the tab icons. When no track is playing, only the tab icons show. When playing, a mini-player row appears above with: album art, track name/artist, play/pause button.

**Files:**
- Create: `apps/web/components/mini-player.tsx`
- Modify: `apps/web/components/tab-bar.tsx`
- Modify: `apps/web/app/(tabs)/layout.tsx`
- Modify: `apps/web/app/(tabs)/generate/page.tsx` (remove standalone player bar)

**Step 1: Create the MiniPlayer component**

Create `apps/web/components/mini-player.tsx`:

```tsx
'use client'

import { Play, Pause, SkipForward } from 'lucide-react'
import type { Track } from '@crossfit-playlist/shared'

interface MiniPlayerProps {
  currentTrack: Track | null
  isPlaying: boolean
  onPlayPause: () => void
  onSkipNext: () => void
  position: number
  duration: number
}

export function MiniPlayer({
  currentTrack,
  isPlaying,
  onPlayPause,
  onSkipNext,
  position,
  duration,
}: MiniPlayerProps) {
  if (!currentTrack) return null

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0

  return (
    <div className="relative">
      {/* Progress bar — thin line at top of mini-player */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--surface-3)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 pt-2 pb-1">
        {/* Album art */}
        {currentTrack.album_art_url ? (
          <img
            src={currentTrack.album_art_url}
            alt=""
            className="w-10 h-10 rounded flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-[var(--surface-3)] flex-shrink-0" />
        )}

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate leading-tight">
            {currentTrack.name}
          </div>
          <div className="text-xs text-[var(--muted)] truncate leading-tight">
            {currentTrack.artist}
          </div>
        </div>

        {/* Play/Pause — 44px touch target */}
        <button
          onClick={onPlayPause}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--surface-3)] transition-colors flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        {/* Skip — 44px touch target */}
        <button
          onClick={onSkipNext}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] transition-colors flex-shrink-0"
          aria-label="Next track"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Update TabBar to accept mini-player content**

Modify `apps/web/components/tab-bar.tsx` to accept an optional `miniPlayer` slot:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Zap, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabConfig {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: TabConfig[] = [
  { label: 'Generate', href: '/generate', icon: Zap },
  { label: 'Library', href: '/library', icon: Bookmark },
]

interface TabBarProps {
  miniPlayer?: React.ReactNode
}

export function TabBar({ miniPlayer }: TabBarProps) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface-1)]/90 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      {/* Mini-player slot — renders above tabs when playing */}
      {miniPlayer}

      {/* Safe area padding for iOS notch */}
      <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href))

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 min-w-[64px] transition-colors duration-150',
                isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
              )}
            >
              <tab.icon
                className={cn(
                  'h-5 w-5 transition-colors duration-150',
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                )}
              />
              <span className="text-xs font-semibold leading-none mt-0.5">
                {tab.label}
              </span>
              {/* Active dot indicator */}
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-[var(--accent)] mt-0.5" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

Note: tab label text changed from `text-[10px]` to `text-xs` (12px) to fix the accessibility violation.

**Step 3: Create a SpotifyMiniPlayerProvider**

To share Spotify player state between the generate page and the tab bar, create a React context. Create `apps/web/components/spotify-context.tsx`:

```tsx
'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Track } from '@crossfit-playlist/shared'

interface SpotifyMiniPlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  position: number
  duration: number
  tracks: Track[]
  onPlayPause: () => void
  onSkipNext: () => void
}

const SpotifyMiniPlayerContext = createContext<SpotifyMiniPlayerState | null>(null)

export function useSpotifyMiniPlayer() {
  return useContext(SpotifyMiniPlayerContext)
}

interface SpotifyMiniPlayerProviderProps {
  children: ReactNode
  value: SpotifyMiniPlayerState | null
}

export function SpotifyMiniPlayerProvider({ children, value }: SpotifyMiniPlayerProviderProps) {
  return (
    <SpotifyMiniPlayerContext.Provider value={value}>
      {children}
    </SpotifyMiniPlayerContext.Provider>
  )
}
```

**Step 4: Wire it up in the tab layout**

Modify `apps/web/app/(tabs)/layout.tsx`:

```tsx
'use client'

import { TabBar } from '@/components/tab-bar'
import { MiniPlayer } from '@/components/mini-player'
import { useSpotifyMiniPlayer } from '@/components/spotify-context'

export default function TabLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const miniPlayerState = useSpotifyMiniPlayer()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="pb-32">
        {children}
      </main>
      <TabBar
        miniPlayer={miniPlayerState?.currentTrack ? (
          <MiniPlayer
            currentTrack={miniPlayerState.currentTrack}
            isPlaying={miniPlayerState.isPlaying}
            onPlayPause={miniPlayerState.onPlayPause}
            onSkipNext={miniPlayerState.onSkipNext}
            position={miniPlayerState.position}
            duration={miniPlayerState.duration}
          />
        ) : undefined}
      />
    </div>
  )
}
```

Note: `pb-20` changed to `pb-32` to accommodate the taller tab bar when mini-player is showing.

**Step 5: Wrap the app in the provider from generate page**

In `apps/web/app/(tabs)/generate/page.tsx`:

1. Import `SpotifyMiniPlayerProvider` at the top
2. Remove the entire `{/* Spotify player bar */}` block (the `fixed bottom-20` div near line 358)
3. Wrap the page's return in the provider, passing Spotify player state

Add near the top of `GeneratePage`, after `spotifyPlayer` is created:

```tsx
const miniPlayerState = useMemo(() => {
  if (!spotifyPlayer.isReady || !result) return null
  const currentIndex = result.playlist.tracks.findIndex(
    (t) => t.spotify_uri === spotifyPlayer.currentTrackUri
  )
  return {
    currentTrack: currentIndex >= 0 ? result.playlist.tracks[currentIndex] : null,
    isPlaying: spotifyPlayer.isPlaying,
    position: spotifyPlayer.position,
    duration: spotifyPlayer.duration,
    tracks: result.playlist.tracks,
    onPlayPause: () => {
      if (spotifyPlayer.isPlaying) {
        spotifyPlayer.pause()
      } else if (spotifyPlayer.currentTrackUri) {
        spotifyPlayer.resume()
      }
    },
    onSkipNext: spotifyPlayer.skipToNext,
  }
}, [spotifyPlayer, result])
```

Then wrap the entire return JSX:

```tsx
return (
  <SpotifyMiniPlayerProvider value={miniPlayerState}>
    <div>
      {/* ... existing JSX, but WITHOUT the fixed bottom-20 Spotify player bar ... */}
    </div>
  </SpotifyMiniPlayerProvider>
)
```

**Step 6: Add SpotifyMiniPlayerProvider to the root tab layout**

Actually, the context provider needs to be above the layout to bridge generate page → layout. Move it to the `(tabs)/layout.tsx` wrapper. The simplest approach:

The generate page sets state via the context. The layout reads it. Since the provider must wrap both, place it in a parent layout or in `(tabs)/layout.tsx` itself with state lifted.

Simpler approach — just use the provider in `(tabs)/layout.tsx` as a wrapper with its own state, and have the generate page push state into it via a setter exposed through context:

Update `apps/web/components/spotify-context.tsx`:

```tsx
'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Track } from '@crossfit-playlist/shared'

interface SpotifyMiniPlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  position: number
  duration: number
  onPlayPause: () => void
  onSkipNext: () => void
}

interface SpotifyMiniPlayerContextValue {
  state: SpotifyMiniPlayerState | null
  setState: (state: SpotifyMiniPlayerState | null) => void
}

const SpotifyMiniPlayerContext = createContext<SpotifyMiniPlayerContextValue>({
  state: null,
  setState: () => {},
})

export function useSpotifyMiniPlayer() {
  return useContext(SpotifyMiniPlayerContext)
}

export function SpotifyMiniPlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SpotifyMiniPlayerState | null>(null)

  return (
    <SpotifyMiniPlayerContext.Provider value={{ state, setState }}>
      {children}
    </SpotifyMiniPlayerContext.Provider>
  )
}
```

Then in `(tabs)/layout.tsx`, wrap with `<SpotifyMiniPlayerProvider>` and read `state` from context for the mini-player.

In the generate page, use `useEffect` to push state into the context:

```tsx
const { setState: setMiniPlayerState } = useSpotifyMiniPlayer()

useEffect(() => {
  if (!spotifyPlayer.isReady || !result) {
    setMiniPlayerState(null)
    return
  }
  const currentIndex = result.playlist.tracks.findIndex(
    (t) => t.spotify_uri === spotifyPlayer.currentTrackUri
  )
  setMiniPlayerState({
    currentTrack: currentIndex >= 0 ? result.playlist.tracks[currentIndex] : null,
    isPlaying: spotifyPlayer.isPlaying,
    position: spotifyPlayer.position,
    duration: spotifyPlayer.duration,
    onPlayPause: () => {
      if (spotifyPlayer.isPlaying) {
        spotifyPlayer.pause()
      } else if (spotifyPlayer.currentTrackUri) {
        spotifyPlayer.resume()
      }
    },
    onSkipNext: spotifyPlayer.skipToNext,
  })
}, [spotifyPlayer.isReady, spotifyPlayer.isPlaying, spotifyPlayer.currentTrackUri, spotifyPlayer.position, spotifyPlayer.duration, result, setMiniPlayerState])

// Clean up on unmount
useEffect(() => {
  return () => setMiniPlayerState(null)
}, [setMiniPlayerState])
```

**Step 7: Remove the standalone player bar from generate page**

In `apps/web/app/(tabs)/generate/page.tsx`, delete the entire `{/* Spotify player bar */}` block (approximately lines 358-379):

```tsx
// DELETE THIS ENTIRE BLOCK:
{spotifyPlayer.isReady && result && (
  <div className="fixed bottom-20 left-0 right-0 z-30 border-t border-[var(--border)] bg-[var(--surface-1)]/95 backdrop-blur">
    <div className="container mx-auto px-4 max-w-5xl">
      <SpotifyPlayer ... />
    </div>
  </div>
)}
```

The `SpotifyPlayer` import can remain for now (the full player might be used in an expanded view later).

**Step 8: Verify visually**

Run: `pnpm dev --filter=web`

1. Navigate to Generate, generate a playlist
2. Sign in with Spotify, play a track
3. Verify: mini-player appears above tab icons in the tab bar
4. Verify: album art, track name, artist, play/pause, skip next all show
5. Verify: progress bar thin line at top of mini-player
6. Navigate to Library tab — mini-player persists
7. Verify: no more standalone player bar floating above tab bar
8. Verify: bottom padding is enough that content isn't hidden behind tab bar

**Step 9: Commit**

```bash
git add apps/web/components/mini-player.tsx apps/web/components/spotify-context.tsx apps/web/components/tab-bar.tsx apps/web/app/\(tabs\)/layout.tsx apps/web/app/\(tabs\)/generate/page.tsx
git commit -m "feat(web): mini-player merged into tab bar (C2/I1)"
```

---

### Task 5: Real Loading Indicator (C5)

Replace the fake progress bar (hardcoded 60% width with pulse) with a 3-stage indicator that shows real progress: parsing → finding tracks → composing.

**Files:**
- Modify: `apps/web/app/(tabs)/generate/page.tsx:23-27,276-286`

**Step 1: Update loading messages with stage data**

Replace the `LOADING_MESSAGES` array and the loading UI in `generate/page.tsx`:

```tsx
const LOADING_STAGES = [
  { label: 'Parsing your workout...', progress: 20 },
  { label: 'Finding tracks by BPM...', progress: 55 },
  { label: 'Composing your playlist...', progress: 85 },
]
```

**Step 2: Update the loading state to track stage index**

Change the loading message cycling logic. Replace the `loadingMessage` state and its `useEffect`:

```tsx
const [loadingStage, setLoadingStage] = useState(0)

// Cycle through loading stages
useEffect(() => {
  if (state !== 'loading') {
    setLoadingStage(0)
    return
  }
  const timers = [
    setTimeout(() => setLoadingStage(1), 2500),
    setTimeout(() => setLoadingStage(2), 5500),
  ]
  return () => timers.forEach(clearTimeout)
}, [state])
```

**Step 3: Update the loading UI**

Replace the `{/* Loading state */}` block (lines ~276-286) with:

```tsx
{/* Loading state */}
{state === 'loading' && (
  <div className="space-y-4" aria-live="polite">
    {/* 3-stage progress */}
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${LOADING_STAGES[loadingStage].progress}%` }}
          />
        </div>
        <span className="text-xs text-[var(--muted)] font-mono w-8 text-right">
          {LOADING_STAGES[loadingStage].progress}%
        </span>
      </div>
      <p className="text-sm text-[var(--muted)]">
        {LOADING_STAGES[loadingStage].label}
      </p>
    </div>
    <GenerateSkeleton />
  </div>
)}
```

**Step 4: Clean up unused state**

Remove the old `loadingMessage` state variable and its setter. Remove the old `LOADING_MESSAGES` constant.

**Step 5: Verify visually**

Run: `pnpm dev --filter=web`

Generate a playlist. Verify:
- Progress bar starts at 20%, jumps to 55% at ~2.5s, then 85% at ~5.5s
- Smooth transitions between stages
- Labels change: "Parsing your workout..." → "Finding tracks by BPM..." → "Composing your playlist..."
- Percentage number shows on the right
- When results arrive, loading state disappears

**Step 6: Commit**

```bash
git add apps/web/app/\(tabs\)/generate/page.tsx
git commit -m "feat(web): real 3-stage loading indicator (C5)"
```

---

### Task 6: Brand Voice Copywriting Pass (C6)

Update generic copy throughout the app to have Crank's personality: punchy, athletic, action-oriented. Fix: loading messages, empty state, onboarding, button labels.

**Files:**
- Modify: `apps/web/app/(tabs)/generate/page.tsx` (loading stages, empty state)
- Modify: `apps/web/components/onboarding.tsx`

**Step 1: Update loading stage labels**

In `apps/web/app/(tabs)/generate/page.tsx`, update `LOADING_STAGES`:

```tsx
const LOADING_STAGES = [
  { label: 'Breaking down your WOD...', progress: 20 },
  { label: 'Matching tracks to your tempo...', progress: 55 },
  { label: 'Dialing in the perfect playlist...', progress: 85 },
]
```

**Step 2: Update empty state copy**

In `apps/web/app/(tabs)/generate/page.tsx`, update the empty state section (around line 348):

Change the heading from:
```
Paste your WOD. Get your playlist.
```
to:
```
Drop your WOD. We'll bring the heat.
```

Change the description from:
```
Type a workout or snap your whiteboard. We'll match the music to every phase — warm-up through cooldown.
```
to:
```
Paste a workout, snap your whiteboard, or pick a named WOD. Crank matches tracks to every phase of your session.
```

**Step 3: Update onboarding copy**

Read `apps/web/components/onboarding.tsx` and update the step titles and descriptions to be more punchy and brand-consistent. Change generic "Welcome" language to Crank-branded language.

**Step 4: Update toast messages**

In `generate/page.tsx`, update:
- `'Playlist generated!'` → `'Your playlist is locked in.'`
- `'Playlist saved!'` → `'Saved to your library.'`
- `'Playlist exported!'` → `'Exported to Spotify.'`

**Step 5: Verify**

Run: `pnpm dev --filter=web`

Walk through the app flow:
- Empty state shows punchy copy
- Loading shows athletic-themed stage labels
- Success toast is branded
- Onboarding feels like a fitness app, not a SaaS dashboard

**Step 6: Commit**

```bash
git add apps/web/app/\(tabs\)/generate/page.tsx apps/web/components/onboarding.tsx
git commit -m "feat(web): brand voice copywriting pass (C6)"
```

---

## Execution Summary

| Task | What | Time Est. | Commit |
|------|------|-----------|--------|
| 1 | Fix white phase cards → surface tokens | 30 min | `fix(web): white phase cards → use surface tokens (C3)` |
| 2 | Fix player bar accessibility | 30 min | `fix(web): player bar accessibility — 44px buttons, 12px+ text (C2)` |
| 3 | Collapsible phase sections | 2-3 hrs | `feat(web): collapsible phase sections for track grouping (C1)` |
| 4 | Mini-player in tab bar | 3-4 hrs | `feat(web): mini-player merged into tab bar (C2/I1)` |
| 5 | Real loading indicator | 30 min | `feat(web): real 3-stage loading indicator (C5)` |
| 6 | Brand voice pass | 45 min | `feat(web): brand voice copywriting pass (C6)` |

**Total: ~7-9 hours**

## Dependencies

- Tasks 1 and 2 have no dependencies (can be done in parallel)
- Task 3 depends on nothing
- Task 4 depends on Task 2 being done (player accessibility fixes inform mini-player sizing)
- Tasks 5 and 6 have no dependencies (can be done in parallel with 3/4)
