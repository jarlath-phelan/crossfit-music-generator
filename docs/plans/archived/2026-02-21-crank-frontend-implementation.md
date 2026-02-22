# Crank Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use frontend-design:frontend-design skill when building each screen for production-grade aesthetics.

**Goal:** Rebuild the CrossFit Playlist Generator frontend as "Crank" — a data-rich, dashboard-style app with 29 screens across 4 phases, iPad-first for coaches, mobile-first for attendees.

**Architecture:** Next.js 15 App Router with tab-based navigation. Shared design system (tokens, fonts, data visualization components). Role-based routing: coach gets Generate/Library/Classes/Profile tabs, attendee gets Classes/Music/Stats/Profile tabs. Existing auth (Better Auth), database (Drizzle/Postgres), and Spotify SDK integration are preserved. New screens are added as routes within a tab layout shell.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, TypeScript, Plus Jakarta Sans + JetBrains Mono (Google Fonts), Lucide React icons, Sonner toasts, Better Auth, Drizzle ORM, Spotify Web Playback SDK.

**Design Doc:** `docs/plans/2026-02-21-frontend-design.md`

---

## Implementation Groups

| Group | Tasks | Screens | Depends On |
|-------|-------|---------|------------|
| 1. Design Foundation | 1–3 | — | Nothing |
| 2. App Shell & Navigation | 4–5 | — | Group 1 |
| 3. Phase 0 — Generate Flow | 6–10 | 0.1–0.4 | Group 2 |
| 4. Phase 1 — Coach Features | 11–16 | 1.1–1.7 | Group 3 |
| 5. Phase 2 — Coach Classes | 17–20 | 2.1–2.4 | Group 4 |
| 6. Phase 2 — Attendee | 21–25 | 2.5–2.9 | Group 4 |
| 7. Phase 3 — Real-Time | 26–31 | 3.1–3.9 | Groups 5+6 |

---

## Group 1: Design Foundation

### Task 1: Design Tokens & Typography

Replace the current HSL-based CSS variables and Inter font with the Crank design system.

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/tailwind.config.js`

**Step 1: Update globals.css with Crank color tokens**

Replace all CSS custom properties. New palette:
```css
/* Crank Design Tokens */
--background: #FAFAFA;
--foreground: #111111;
--accent: #E63946;        /* deep coral */
--accent-foreground: #FFFFFF;
--muted: #6B7280;
--muted-foreground: #9CA3AF;
--border: #E5E7EB;
--card: #FFFFFF;
--card-foreground: #111111;

/* Phase colors */
--phase-warmup: #3B82F6;
--phase-low: #10B981;
--phase-moderate: #F59E0B;
--phase-high: #F97316;
--phase-very-high: #EF4444;
--phase-cooldown: #8B5CF6;

/* HR Zone colors */
--zone-1: #D1D5DB;
--zone-2: #3B82F6;
--zone-3: #10B981;
--zone-4: #F59E0B;
--zone-5: #E63946;
```

Remove dark mode variables (not in design spec — can add later).

**Step 2: Update layout.tsx — swap Inter for Plus Jakarta Sans + JetBrains Mono**

```tsx
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
})
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})
```

Apply to `<body className={`${jakarta.variable} ${mono.variable} font-sans`}>`.

**Step 3: Update tailwind.config.js — extend theme with Crank tokens**

Add fontFamily: `sans: ['var(--font-jakarta)']`, `mono: ['var(--font-mono)']`.
Add colors referencing CSS variables.
Add custom animation keyframes for data visualizations (gauge sweep, bar fill, fade-slide-up, scale-in).

**Step 4: Verify fonts render**

Run: `cd apps/web && pnpm dev`
Open http://localhost:3000, confirm Plus Jakarta Sans renders for body text.

**Step 5: Commit**

```bash
git add apps/web/app/globals.css apps/web/app/layout.tsx apps/web/tailwind.config.js
git commit -m "feat(web): replace design tokens with Crank design system"
```

---

### Task 2: Core UI Primitives

Update existing UI components (button, card, textarea) to use Crank tokens, and add new primitives needed across all screens.

**Files:**
- Modify: `apps/web/components/ui/button.tsx`
- Modify: `apps/web/components/ui/card.tsx`
- Modify: `apps/web/components/ui/textarea.tsx`
- Create: `apps/web/components/ui/badge.tsx`
- Create: `apps/web/components/ui/toggle-pills.tsx`
- Create: `apps/web/components/ui/bottom-sheet.tsx`
- Create: `apps/web/components/ui/skeleton.tsx`

**Step 1: Update button.tsx**

Replace the default variant color with coral accent. Add an `accent` variant:
```tsx
accent: "bg-[var(--accent)] text-white hover:bg-[#D32F3F] shadow-sm"
```
Keep existing variants (outline, ghost, secondary) but update colors to use Crank tokens.

**Step 2: Update card.tsx**

Update background to `bg-white`, border to `border-[var(--border)]`, rounded to `rounded-xl`.

**Step 3: Create badge.tsx**

Used for phase badges (WARM-UP, WOD, COOLDOWN), status badges, RSVP badges.
```tsx
// Variants: phase-warmup, phase-wod, phase-cooldown, status-green, status-amber, status-gray
```

**Step 4: Create toggle-pills.tsx**

Text/Photo toggle, Upcoming/Past toggle, time filters. Reusable pill group component.
```tsx
interface TogglePillsProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
}
```

**Step 5: Create bottom-sheet.tsx**

Slide-up sheet for track swap (Screen 1.5), create class (Screen 2.2). Uses CSS transforms, backdrop overlay.

**Step 6: Create skeleton.tsx**

Skeleton loader primitives for loading states (Screen 0.2). Pulsing gray rectangles.

**Step 7: Commit**

```bash
git add apps/web/components/ui/
git commit -m "feat(web): update UI primitives for Crank design system"
```

---

### Task 3: Data Visualization Components

The distinctive visual elements from Approach B. Reusable across multiple screens.

**Files:**
- Create: `apps/web/components/viz/bpm-gauge.tsx`
- Create: `apps/web/components/viz/intensity-arc.tsx`
- Create: `apps/web/components/viz/energy-bar.tsx`
- Create: `apps/web/components/viz/bpm-bars.tsx`
- Create: `apps/web/components/viz/zone-distribution-bar.tsx`
- Create: `apps/web/components/viz/sparkline.tsx`
- Create: `apps/web/components/viz/mini-intensity-arc.tsx`

**Step 1: Create bpm-gauge.tsx**

SVG circular gauge. Used in Phase 0.3 workout phase cards.
```tsx
interface BpmGaugeProps {
  bpmRange: [number, number]  // e.g. [160, 175]
  maxBpm?: number             // scale max, default 200
  color: string               // phase color
  size?: number               // px, default 64
  animated?: boolean          // stroke-dashoffset animation
}
```
Renders an SVG circle with a colored arc proportional to BPM range within the max scale. Monospace BPM text centered.

**Step 2: Create intensity-arc.tsx**

SVG horizontal arc showing workout intensity over time. Used in Screens 0.3, 1.3, 1.4, 2.3, 2.4, 3.3, 3.5.
```tsx
interface IntensityArcProps {
  phases: Phase[]
  totalDuration: number
  showLabels?: boolean
  showGrid?: boolean
  showPeakMarker?: boolean
  playheadPosition?: number   // 0-1, for live mode (Phase 3)
  height?: number             // px, default 60
}
```
Each phase is a colored segment. Width proportional to duration. Gradient coloring per phase. Optional grid lines and PEAK marker.

**Step 3: Create energy-bar.tsx**

Horizontal fill bar showing energy 0–100%. Used in track rows.
```tsx
interface EnergyBarProps {
  energy: number  // 0-1
  animated?: boolean
}
```

**Step 4: Create bpm-bars.tsx**

Mini animated vertical bars (3–4 bars) representing BPM visually. Used in track rows.
```tsx
interface BpmBarsProps {
  bpm: number
  maxBpm?: number
  animated?: boolean
}
```

**Step 5: Create zone-distribution-bar.tsx**

Stacked horizontal bar showing % of class in each HR zone. Used in Screens 3.3, 3.5, 3.6.
```tsx
interface ZoneDistributionBarProps {
  zones: { zone: number; percentage: number }[]
  animated?: boolean
}
```

**Step 6: Create sparkline.tsx**

Tiny line chart for real-time HR data. Used in Screens 3.3, 3.5.
```tsx
interface SparklineProps {
  data: number[]        // last N readings
  color?: string
  width?: number
  height?: number
}
```

**Step 7: Create mini-intensity-arc.tsx**

Tiny version of intensity arc (no labels, just colored segments). Used in playlist cards (Screen 1.3).

**Step 8: Commit**

```bash
git add apps/web/components/viz/
git commit -m "feat(web): add data visualization components for Crank dashboard"
```

---

## Group 2: App Shell & Navigation

### Task 4: Tab Bar Layout & Routing

Replace the current top NavBar + single-page layout with a tab-based shell. The app shell handles role-based tab rendering (coach vs. attendee).

**Files:**
- Create: `apps/web/components/tab-bar.tsx`
- Create: `apps/web/app/(tabs)/layout.tsx`
- Create: `apps/web/app/(tabs)/generate/page.tsx` (move from `app/page.tsx`)
- Create: `apps/web/app/(tabs)/library/page.tsx` (move from `app/playlists/page.tsx`)
- Create: `apps/web/app/(tabs)/classes/page.tsx` (placeholder)
- Create: `apps/web/app/(tabs)/profile/page.tsx` (move from `app/profile/page.tsx`)
- Create: `apps/web/app/(tabs)/music/page.tsx` (placeholder, attendee)
- Create: `apps/web/app/(tabs)/stats/page.tsx` (placeholder, attendee)
- Modify: `apps/web/app/layout.tsx` — remove NavBar, keep Toaster
- Modify: `apps/web/components/nav-bar.tsx` — convert to inline header within tab content

**Step 1: Create tab-bar.tsx**

Fixed bottom bar with backdrop-blur. Renders different tabs based on user role.
```tsx
interface TabBarProps {
  role: 'coach' | 'attendee'
}
// Coach: Generate (Zap), Library (Bookmark), Classes (Calendar), Profile (User)
// Attendee: Classes (Calendar), Music (Music), Stats (BarChart3), Profile (User)
```
Active tab: coral accent color + dot indicator. Inactive: muted foreground.

**Step 2: Create (tabs)/layout.tsx**

Route group layout that wraps all tabbed pages. Fetches session, determines role, renders TabBar at bottom. Content area has padding-bottom for the tab bar.

**Step 3: Move existing pages into (tabs)/ route group**

- `app/page.tsx` logic → `app/(tabs)/generate/page.tsx`
- `app/playlists/page.tsx` → `app/(tabs)/library/page.tsx`
- `app/profile/page.tsx` → `app/(tabs)/profile/page.tsx`

Keep `app/playlist/[id]/page.tsx` outside the tab group (it's a detail view pushed on top).

**Step 4: Create placeholder pages for new tabs**

Classes, Music, Stats — simple "Coming soon" placeholders with the correct tab highlighted.

**Step 5: Update root layout.tsx**

Remove `<NavBar>` import. The tab layout handles its own header per page.

**Step 6: Verify navigation works**

Run dev server, confirm all 4 coach tabs are navigable, tab bar highlights correctly.

**Step 7: Commit**

```bash
git add apps/web/app/ apps/web/components/tab-bar.tsx
git commit -m "feat(web): add tab bar navigation and route group layout"
```

---

### Task 5: Crank Header Component

Each tab page gets a consistent inline header (not a global nav bar). Replaces the current NavBar.

**Files:**
- Create: `apps/web/components/page-header.tsx`
- Delete: `apps/web/components/nav-bar.tsx` (after migration)

**Step 1: Create page-header.tsx**

```tsx
interface PageHeaderProps {
  title: string                  // "Generate", "Library", "Classes", "Profile"
  showLogo?: boolean             // true for Generate tab
  rightContent?: React.ReactNode // badges, buttons, user menu
}
```
When `showLogo` is true: Crank logo mark + "Crank" text (left), music source badge (right).
Otherwise: title text (left), rightContent (right).

**Step 2: Update generate page to use PageHeader with logo**

**Step 3: Update library/profile pages to use PageHeader with title**

**Step 4: Remove old nav-bar.tsx**

**Step 5: Commit**

```bash
git add apps/web/components/page-header.tsx apps/web/app/
git rm apps/web/components/nav-bar.tsx
git commit -m "refactor(web): replace NavBar with per-page PageHeader"
```

---

## Group 3: Phase 0 — Generate Flow Redesign

### Task 6: Workout Input Component (Screens 0.1, 0.4)

Rebuild the workout input area with Crank styling. Handles both text and photo modes.

**Files:**
- Modify: `apps/web/components/workout-form.tsx`
- Modify: `apps/web/components/image-upload.tsx`

**Step 1: Redesign workout-form.tsx**

- Replace mode toggle buttons with `<TogglePills>` component (Text / Photo)
- Restyle textarea: Crank border, Plus Jakarta Sans, larger placeholder text
- Restyle example chips: compact pill buttons below textarea, gray outlined, tap fills input
- Generate button: full-width, coral accent, disabled state is muted gray. Text: "Generate Playlist" with Zap icon. No pulsing glow — solid and confident.
- Compact mode: when `isCompact` prop is true (after generation), textarea collapses to a single line showing workout text with "Edit" / "New Workout" buttons

**Step 2: Redesign image-upload.tsx**

- Dashed-border drop zone with Camera icon centered
- Two buttons side by side: "Take Photo" (coral, prominent on iPad) + "Upload Image" (outlined)
- Image preview: rounded thumbnail with X overlay
- Keep compression logic unchanged (max 1MB, 1568px)

**Step 3: Verify both input modes work**

Test text input with example chips. Test photo capture/upload.

**Step 4: Commit**

```bash
git add apps/web/components/workout-form.tsx apps/web/components/image-upload.tsx
git commit -m "feat(web): redesign workout input for Crank (Screens 0.1, 0.4)"
```

---

### Task 7: Workout Phase Cards (Screen 0.3)

Rebuild the workout display as horizontal phase cards with BPM gauges.

**Files:**
- Modify: `apps/web/components/workout-display.tsx`

**Step 1: Redesign workout-display.tsx**

Replace the current vertical phase list with horizontal cards:
- 3 cards in a flex row (equal width, except WOD can be wider via `flex-[2]` if longer duration)
- Each card: colored left border (4px), white background, rounded-xl, subtle shadow
- Content: Phase name (bold), duration (monospace), `<BpmGauge>` component, BPM range text (monospace)
- Staggered scale-in animation on mount (animation-delay per card)
- Below the cards: `<IntensityArc>` showing the full workout curve

**Step 2: Update intensity color mapping**

Replace the current `INTENSITY_COLORS` (Tailwind class strings) with CSS variable references:
```tsx
const PHASE_COLORS: Record<IntensityLevel, string> = {
  warm_up: 'var(--phase-warmup)',
  low: 'var(--phase-low)',
  moderate: 'var(--phase-moderate)',
  high: 'var(--phase-high)',
  very_high: 'var(--phase-very-high)',
  cooldown: 'var(--phase-cooldown)',
}
```

**Step 3: Verify phases render with gauges and arc**

Generate a playlist, confirm 3 horizontal cards with circular gauges + intensity arc below.

**Step 4: Commit**

```bash
git add apps/web/components/workout-display.tsx
git commit -m "feat(web): redesign workout phases with BPM gauges and intensity arc (Screen 0.3)"
```

---

### Task 8: Playlist Track Table (Screen 0.3)

Rebuild the playlist display as a dense data table with BPM bars and energy fills.

**Files:**
- Modify: `apps/web/components/playlist-display.tsx`

**Step 1: Redesign playlist-display.tsx**

Replace the current card-list with a compact table:
- Each row: track number (monospace, muted), track name (bold) + artist (muted, smaller), `<BpmBars>` + BPM number (monospace), `<EnergyBar>` + percentage (monospace), duration (monospace), phase badge (`<Badge variant="phase-warmup">`)
- Determine which phase each track belongs to by comparing track BPM against workout phases
- Staggered row entrance animation (slide-in from left, 50ms delay per row)
- Play button on each row (if spotify_uri exists): small coral circle with Play icon
- Current track highlighting: coral left border + subtle coral background tint
- Hover: subtle row highlight

**Step 2: Ensure everything fits on one iPad screen**

The key constraint: phase cards + intensity arc + playlist table must all be visible without scrolling at 1024x768. Use compact row heights (h-10 or h-12), tight padding.

**Step 3: Verify with generated playlist**

Generate a playlist, confirm dense table with BPM bars, energy fills, phase badges. Check iPad viewport (resize browser to 1024x768).

**Step 4: Commit**

```bash
git add apps/web/components/playlist-display.tsx
git commit -m "feat(web): redesign playlist as dense data table with visualizations (Screen 0.3)"
```

---

### Task 9: Loading State (Screen 0.2)

Add the loading/skeleton state for the generate flow.

**Files:**
- Modify: `apps/web/app/(tabs)/generate/page.tsx`
- Create: `apps/web/components/generate-skeleton.tsx`

**Step 1: Create generate-skeleton.tsx**

Skeleton loader matching the results layout:
- 3 skeleton rectangles in a row (phase card shapes) with pulse animation
- One wide skeleton rectangle (intensity arc shape)
- 5–6 skeleton rows (track table shape)

**Step 2: Update generate page to show skeleton during loading**

When `isLoading` is true:
- Input area collapses to compact mode (workout text shown, not editable)
- Generate button transforms: coral background with animated progress bar overlay, text cycles: "Parsing workout..." → "Finding tracks..." → "Composing playlist..."
- Below: render `<GenerateSkeleton>`

**Step 3: Verify loading state**

Generate a playlist, confirm skeleton appears during API call.

**Step 4: Commit**

```bash
git add apps/web/components/generate-skeleton.tsx apps/web/app/(tabs)/generate/page.tsx
git commit -m "feat(web): add loading skeleton for generate flow (Screen 0.2)"
```

---

### Task 10: Generate Page Assembly (Screens 0.1–0.4)

Wire everything together in the generate page. Handle all states: empty, loading, results.

**Files:**
- Modify: `apps/web/app/(tabs)/generate/page.tsx`

**Step 1: Implement state machine**

```tsx
type GenerateState = 'empty' | 'loading' | 'results'
```
- `empty`: Show full-size workout form + empty area message with waveform graphic
- `loading`: Compact form + skeleton
- `results`: Compact form (with Edit/New buttons) + phase cards + intensity arc + track table + save button (if authenticated)

**Step 2: Add empty state messaging**

When no results yet and not loading: show centered muted text "Your workout breakdown and playlist will appear here" with a subtle SVG waveform.

**Step 3: Add "New Workout" / "Edit" controls in results state**

"New Workout" clears results and resets to empty state. "Edit" expands the input area back to full size, pre-filled with current workout text.

**Step 4: Verify full flow**

Test: empty → enter text → generate → loading → results → new workout → back to empty. Test photo mode too.

**Step 5: Commit**

```bash
git add apps/web/app/(tabs)/generate/page.tsx
git commit -m "feat(web): complete generate page with all states (Screens 0.1-0.4)"
```

---

## Group 4: Phase 1 — Coach Features

### Task 11: Auth Modal (Screen 1.1)

Replace inline auth with a full-screen modal overlay.

**Files:**
- Create: `apps/web/components/auth/auth-modal.tsx`
- Modify: `apps/web/components/auth/sign-in-button.tsx`
- Modify: `apps/web/components/auth/user-menu.tsx`

**Step 1: Create auth-modal.tsx**

Full-screen overlay with dimmed backdrop. Centered white card.
- Crank logo + tagline at top
- Login / Sign up toggle pills
- Login: email + password fields, coral "Sign in" button, "Forgot password?" link, divider "or", Google + Apple social buttons (outlined)
- Sign up: name + email + password, same social buttons
- Close X in top-right corner
- Uses existing Better Auth client (`authClient`) for actual auth flow

**Step 2: Update sign-in-button.tsx to open modal instead of direct auth**

**Step 3: Update user-menu.tsx with Crank styling**

Coral accent on active items, Plus Jakarta Sans, monospace for any data shown.

**Step 4: Commit**

```bash
git add apps/web/components/auth/
git commit -m "feat(web): add auth modal overlay (Screen 1.1)"
```

---

### Task 12: Coach Profile Setup / Onboarding (Screen 1.2)

Multi-step onboarding flow after first signup.

**Files:**
- Create: `apps/web/components/onboarding/coach-onboarding.tsx`
- Create: `apps/web/components/ui/genre-chips.tsx`
- Create: `apps/web/components/ui/energy-slider.tsx`
- Create: `apps/web/components/ui/artist-tag-input.tsx`
- Modify: `apps/web/app/(tabs)/profile/page.tsx`

**Step 1: Create genre-chips.tsx**

Multi-select chip grid. Props: `genres: string[]`, `selected: string[]`, `onChange`. Chip styles: outlined inactive, coral-filled active. Genres: Rock, Metal, Hip-Hop, Electronic, Pop, Country, Punk, Indie, R&B, Latin, Classical.

**Step 2: Create energy-slider.tsx**

Range slider from 0.3 (Chill) to 1.0 (Intense). Shows current value. Coral accent on the filled track.

**Step 3: Create artist-tag-input.tsx**

Text input that converts entered text into tag chips. X to remove. Used for excluded artists.

**Step 4: Create coach-onboarding.tsx**

4-step stepper:
- Step indicator dots at top (coral for current, gray for others)
- Step 1: Display name + gym name fields
- Step 2: `<GenreChips>`
- Step 3: `<EnergySlider>` + explicit toggle + `<ArtistTagInput>`
- Step 4: Spotify connect button (Spotify green) + "Skip for now" link
- Back/Next navigation buttons at bottom
- Calls existing `updateProfile()` server action on completion

**Step 5: Hook into auth flow**

After signup, if no coach profile exists, show onboarding. Check in `(tabs)/layout.tsx`.

**Step 6: Commit**

```bash
git add apps/web/components/onboarding/ apps/web/components/ui/genre-chips.tsx apps/web/components/ui/energy-slider.tsx apps/web/components/ui/artist-tag-input.tsx
git commit -m "feat(web): add coach onboarding flow (Screen 1.2)"
```

---

### Task 13: Library — Saved Playlists (Screen 1.3)

Redesign the saved playlists grid.

**Files:**
- Modify: `apps/web/app/(tabs)/library/page.tsx`
- Modify: `apps/web/components/playlist-list.tsx`

**Step 1: Redesign playlist-list.tsx**

- Search bar at top: compact, rounded, magnifying glass icon
- 2-column grid (iPad), 1-column (phone) using CSS grid with responsive breakpoints
- Each card: white, rounded-xl, subtle shadow. Shows:
  - Playlist name (bold, truncated)
  - Workout text first line (muted, truncated)
  - Date (monospace, small)
  - Track count + duration (monospace)
  - `<MiniIntensityArc>` (tiny colored bar)
  - Coral play icon overlay (top-right corner, partially transparent)
- Empty state: centered message + link to Generate tab

**Step 2: Add search/filter functionality**

Client-side filter on playlist name and workout text.

**Step 3: Verify grid layout on iPad viewport**

Resize to 1024px, confirm 2-column grid. Resize to 375px, confirm single column.

**Step 4: Commit**

```bash
git add apps/web/app/(tabs)/library/page.tsx apps/web/components/playlist-list.tsx
git commit -m "feat(web): redesign library with playlist card grid (Screen 1.3)"
```

---

### Task 14: Playlist Detail View (Screen 1.4)

Full detail view for a saved playlist, with track management controls.

**Files:**
- Modify: `apps/web/app/playlist/[id]/page.tsx`

**Step 1: Build detail layout**

- Back arrow (top-left) → returns to Library
- Playlist name (large, editable — click to edit inline)
- Workout text (collapsible section)
- Workout phase cards + intensity arc (reuse components from Task 7, read-only)
- Track table (reuse from Task 8) with additional per-row controls:
  - Swap icon button (ArrowLeftRight from Lucide)
  - Thumbs up/down icons (ThumbsUp, ThumbsDown from Lucide)
  - Drag handle (GripVertical from Lucide) — left edge
- Action bar at bottom: "Regenerate" (ghost button), "Export to Spotify" (coral, if connected), "Share" (icon button)

**Step 2: Implement inline playlist rename**

Click playlist name → transforms to input field → blur or Enter saves via server action.

**Step 3: Commit**

```bash
git add apps/web/app/playlist/
git commit -m "feat(web): build playlist detail view with track controls (Screen 1.4)"
```

---

### Task 15: Track Swap Bottom Sheet (Screen 1.5) & Inline Feedback (Screen 1.6)

**Files:**
- Create: `apps/web/components/track-swap-sheet.tsx`
- Create: `apps/web/components/track-feedback.tsx`

**Step 1: Create track-swap-sheet.tsx**

Uses `<BottomSheet>` primitive from Task 2.
- Header: "Replace: [Track Name]" + phase badge + "Target: [BPM range]"
- Auto-focused search input
- Results list: tracks from the same phase BPM range
  - BPM number (monospace) with color coding: green (in range), amber (±10), red (far)
  - Energy bar
  - Preview play button (if Spotify connected)
- Tap to select → calls parent callback → sheet closes → row flashes coral

**Requires backend support**: Add `GET /api/v1/search-tracks?bpm_min=X&bpm_max=Y&query=Z` endpoint (or client-side search of existing mock data). This is a backend task — for now, wire to a TODO function.

**Step 2: Create track-feedback.tsx**

Inline component rendered in each track row.
- Two small icon buttons: ThumbsUp, ThumbsDown
- Default: muted/outlined. Tapped: ThumbsUp fills coral, ThumbsDown fills muted gray
- After ThumbsUp: small ArrowUp badge appears next to track name
- Calls `submitTrackFeedback(trackId, rating)` server action (uses existing `trackFeedback` table)

**Step 3: Commit**

```bash
git add apps/web/components/track-swap-sheet.tsx apps/web/components/track-feedback.tsx
git commit -m "feat(web): add track swap sheet and inline feedback (Screens 1.5, 1.6)"
```

---

### Task 16: Profile — Preferences & Stats (Screen 1.7)

Redesign the profile tab with both settings and analytics.

**Files:**
- Modify: `apps/web/app/(tabs)/profile/page.tsx`
- Modify: `apps/web/components/profile-form.tsx`
- Create: `apps/web/components/profile-stats.tsx`

**Step 1: Redesign profile page layout**

Top section: user avatar (circle, tappable), name (large), gym name, "Edit Profile" link.
Below: two sections — "Preferences" and "Stats".

**Step 2: Redesign profile-form.tsx as inline-editable preferences**

Show current preferences as a summary (genre chips, energy level, explicit toggle). Each is tappable to enter edit mode inline. Reuses `<GenreChips>`, `<EnergySlider>` from Task 12.

**Step 3: Create profile-stats.tsx**

- Top Artists: horizontal scroll row with artist names + play counts (monospace)
- Genre Distribution: CSS-only horizontal stacked bar chart
- Playlists Generated: large monospace number + weekly trend
- Most Boosted: top 5 boosted tracks from `trackFeedback` table
- All data fetched via server actions querying existing tables

**Step 4: Add "Sign out" + Spotify connection status at bottom**

**Step 5: Commit**

```bash
git add apps/web/app/(tabs)/profile/ apps/web/components/profile-form.tsx apps/web/components/profile-stats.tsx
git commit -m "feat(web): redesign profile with preferences and stats (Screen 1.7)"
```

---

## Group 5: Phase 2 — Coach Classes

### Task 17: Database Schema for Classes

Add tables needed for class sessions.

**Files:**
- Modify: `apps/web/lib/schema.ts`
- Run: Drizzle migration

**Step 1: Add class session tables**

```tsx
export const classSessions = pgTable('class_sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  coachId: text('coach_id').notNull().references(() => user.id),
  workoutText: text('workout_text').notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  rsvpDeadline: timestamp('rsvp_deadline'),
  playlistId: text('playlist_id').references(() => savedPlaylists.id),
  spotifyPlaylistId: text('spotify_playlist_id'),
  preferenceMode: text('preference_mode').notNull().default('coach_only'), // 'coach_only' | 'aggregated'
  coachWeight: integer('coach_weight').default(60),
  status: text('status').notNull().default('scheduled'), // 'scheduled' | 'live' | 'completed' | 'cancelled'
  createdAt: timestamp('created_at').defaultNow(),
})

export const classAttendees = pgTable('class_attendees', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  classId: text('class_id').notNull().references(() => classSessions.id),
  userId: text('user_id').references(() => user.id),
  email: text('email').notNull(),
  rsvpStatus: text('rsvp_status').notNull().default('pending'), // 'pending' | 'confirmed' | 'declined'
  createdAt: timestamp('created_at').defaultNow(),
})
```

**Step 2: Generate and run migration**

```bash
cd apps/web && npx drizzle-kit generate && npx drizzle-kit push
```

**Step 3: Add server actions for class CRUD**

Add to `apps/web/app/actions.ts`:
- `createClass(data)`, `listClasses(filter)`, `getClass(id)`, `updateClass(id, data)`, `cancelClass(id)`
- `inviteAttendee(classId, email)`, `updateRsvp(classId, status)`

**Step 4: Commit**

```bash
git add apps/web/lib/schema.ts apps/web/app/actions.ts apps/web/drizzle/
git commit -m "feat(web): add class session database schema and server actions"
```

---

### Task 18: Classes Tab — Upcoming & History (Screens 2.1, 2.4)

**Files:**
- Modify: `apps/web/app/(tabs)/classes/page.tsx`
- Create: `apps/web/components/classes/class-list.tsx`
- Create: `apps/web/components/classes/class-card.tsx`

**Step 1: Build class-list.tsx**

- `<TogglePills>` at top: "Upcoming" / "Past"
- Groups classes by date with sticky monospace date headers ("MON 24 FEB")
- Renders `<ClassCard>` for each

**Step 2: Build class-card.tsx**

- Time (large monospace), workout snippet (truncated)
- Avatar stack (2-3 overlapping circles) + count monospace
- Playlist status badge: gray "No playlist", green "Playlist ready", coral pulse "Generating..."
- Past variant: shows feedback rating "4.2 ★" instead of playlist status

**Step 3: Wire up classes page**

- Fetch classes via `listClasses()` server action
- Upcoming tab: filter `status === 'scheduled'`, sort by `scheduledAt` ascending
- Past tab: filter `status === 'completed'`, sort by `scheduledAt` descending
- "+ New Class" coral button (top-right) opens create class sheet (Task 19)
- Tap card → navigate to `/classes/[id]`

**Step 4: Commit**

```bash
git add apps/web/app/(tabs)/classes/ apps/web/components/classes/
git commit -m "feat(web): build classes tab with upcoming and past views (Screens 2.1, 2.4)"
```

---

### Task 19: Create Class Bottom Sheet (Screen 2.2)

**Files:**
- Create: `apps/web/components/classes/create-class-sheet.tsx`

**Step 1: Build create-class-sheet.tsx**

Uses `<BottomSheet>` at ~80% height.
- Date + time: native `<input type="date">` and `<input type="time">` side by side
- Workout: textarea OR "Use saved" button (opens mini playlist picker)
- Invite attendees: `<ArtistTagInput>` repurposed for emails + "Copy invite link" button
- RSVP deadline: optional date picker, defaults to 2hr before class
- Preference mode: toggle between "My preferences only" / "Aggregate with attendees". Aggregated shows a coach/attendee weight slider.
- Actions: "Schedule Class" (coral) + "Save as draft" (ghost)
- Calls `createClass()` server action on submit

**Step 2: Commit**

```bash
git add apps/web/components/classes/create-class-sheet.tsx
git commit -m "feat(web): add create class bottom sheet (Screen 2.2)"
```

---

### Task 20: Class Detail — Coach View (Screen 2.3)

**Files:**
- Create: `apps/web/app/classes/[id]/page.tsx`
- Create: `apps/web/components/classes/attendee-list.tsx`
- Create: `apps/web/components/classes/class-playlist-section.tsx`

**Step 1: Build class detail page**

- Back arrow → `/classes` (tab)
- Top: date/time (large monospace), workout text (collapsible), edit icon
- `<AttendeeList>`: rows with avatar, name, RSVP badge (green/amber/muted), genre chips for confirmed attendees. "Invite more" link.
- `<ClassPlaylistSection>`: if no playlist → "Generate Playlist" coral button. If playlist → compact intensity arc + track list + "Regenerate" + "Export to Spotify" buttons.
- Bottom action bar: "Start Class" (coral, Phase 3), "Cancel Class" (ghost + confirmation dialog)

**Step 2: Commit**

```bash
git add apps/web/app/classes/ apps/web/components/classes/
git commit -m "feat(web): build class detail view for coaches (Screen 2.3)"
```

---

## Group 6: Phase 2 — Attendee Screens

### Task 21: Attendee Role & Onboarding (Screen 2.5)

**Files:**
- Modify: `apps/web/lib/schema.ts` — add `role` field to user or coach_profiles
- Create: `apps/web/components/onboarding/attendee-onboarding.tsx`
- Modify: `apps/web/app/(tabs)/layout.tsx` — role-based tab rendering

**Step 1: Add role support**

Add `role: text('role').notNull().default('coach')` to `coachProfiles` table (or create an `attendeeProfiles` table). The tab layout reads the role to determine which tabs to show.

**Step 2: Create attendee-onboarding.tsx**

Simplified 3-step flow:
- Step 1: Name only
- Step 2: Genre chips with framing "What do you like to work out to?"
- Step 3: Connect Spotify (optional, auto-imports top artists if connected)
- Reuses `<GenreChips>` from Task 12

**Step 3: Update tab layout for role-based rendering**

`(tabs)/layout.tsx` checks profile role → passes to `<TabBar role={...}>`.

**Step 4: Commit**

```bash
git add apps/web/lib/schema.ts apps/web/components/onboarding/ apps/web/app/(tabs)/layout.tsx
git commit -m "feat(web): add attendee role support and onboarding (Screen 2.5)"
```

---

### Task 22: Attendee Classes Tab (Screen 2.6)

**Files:**
- Create: `apps/web/app/(tabs)/classes/attendee-classes.tsx`

**Step 1: Build attendee class view**

Different from coach view — no management, focused on RSVP and viewing.
- "Next Up" highlighted card: large format, nearest class, RSVP button
- Upcoming list: class cards with coach name, gym, date/time, RSVP status buttons
- Past list: compact, with "Leave feedback" badge if window open
- RSVP buttons: "Going" (green fill), "Can't make it" (outlined), "Pending" (amber)

**Step 2: Conditionally render coach vs attendee view in classes page**

`classes/page.tsx` checks role and renders either coach or attendee class list.

**Step 3: Commit**

```bash
git add apps/web/app/(tabs)/classes/
git commit -m "feat(web): build attendee classes tab (Screen 2.6)"
```

---

### Task 23: Attendee Class Detail (Screen 2.7)

**Files:**
- Create: `apps/web/app/classes/[id]/attendee-view.tsx`

**Step 1: Build attendee class detail**

- Top: coach name, gym, date/time, workout text
- RSVP: large toggle buttons
- Playlist (if published): read-only track table (reuse from Task 8, no swap/reorder). "Open in Spotify" button. Thumbs up/down per track.
- Info card: "Your music preferences influenced this playlist" (if aggregation on)

**Step 2: Class detail page renders coach or attendee view based on role**

**Step 3: Commit**

```bash
git add apps/web/app/classes/
git commit -m "feat(web): build attendee class detail view (Screen 2.7)"
```

---

### Task 24: Post-Class Feedback (Screen 2.8)

**Files:**
- Create: `apps/web/app/classes/[id]/feedback/page.tsx`
- Create: `apps/web/components/classes/feedback-form.tsx`
- Modify: `apps/web/lib/schema.ts` — ensure trackFeedback supports class context

**Step 1: Create feedback-form.tsx**

- Track-by-track cards: track name, artist, phase badge
- 5-star rating (tappable stars, coral fill) OR thumbs up/down toggle
- Optional comment field (collapsed by default)
- Overall rating at bottom: "How was the music overall?" with 5 stars
- "Submit" coral button. "Skip feedback" ghost link.
- Calls server action to save feedback to `trackFeedback` table with `classId`

**Step 2: Create feedback page**

Route: `/classes/[id]/feedback`. Fetches class + playlist data, renders feedback form.

**Step 3: Commit**

```bash
git add apps/web/app/classes/ apps/web/components/classes/feedback-form.tsx apps/web/lib/schema.ts
git commit -m "feat(web): add post-class feedback flow (Screen 2.8)"
```

---

### Task 25: Attendee Music Tab (Screen 2.9)

**Files:**
- Modify: `apps/web/app/(tabs)/music/page.tsx`

**Step 1: Build music tab**

- "My Taste": `<GenreChips>` (editable), Spotify connection badge
- "My Influence": count of tracks that matched preferences in recent classes (query from saved data)
- "Liked Tracks": list of thumbs-up'd tracks from `trackFeedback` table. Each shows track name, artist, BPM (monospace). Tap to open Spotify link.
- Lighter feel than coach profile — encouraging copy, less data density

**Step 2: Commit**

```bash
git add apps/web/app/(tabs)/music/
git commit -m "feat(web): build attendee music tab (Screen 2.9)"
```

---

## Group 7: Phase 3 — Real-Time

> **Note:** Phase 3 requires significant backend infrastructure (WebSocket server, wearable integrations, playlist adjustment agent) that is NOT covered in this frontend plan. The screens below are built with mock/placeholder data and will connect to real backends when those are built.

### Task 26: Database Schema for Biometrics

**Files:**
- Modify: `apps/web/lib/schema.ts`

**Step 1: Add biometric tables**

```tsx
export const connectedDevices = pgTable('connected_devices', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => user.id),
  deviceType: text('device_type').notNull(), // 'apple_watch' | 'whoop' | 'fitbit'
  status: text('status').notNull().default('connected'),
  lastSyncAt: timestamp('last_sync_at'),
  permissions: jsonb('permissions'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const biometricData = pgTable('biometric_data', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  classId: text('class_id').notNull().references(() => classSessions.id),
  userId: text('user_id').notNull().references(() => user.id),
  heartRate: integer('heart_rate').notNull(),
  timestamp: timestamp('timestamp').notNull(),
})

export const playlistAdjustments = pgTable('playlist_adjustments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  classId: text('class_id').notNull().references(() => classSessions.id),
  reason: text('reason').notNull(),
  avgHeartRate: integer('avg_heart_rate'),
  action: text('action').notNull(), // 'skip' | 'boost' | 'maintain'
  fromTrackId: text('from_track_id'),
  toTrackId: text('to_track_id'),
  timestamp: timestamp('timestamp').notNull(),
})
```

**Step 2: Generate migration and commit**

```bash
git add apps/web/lib/schema.ts apps/web/drizzle/
git commit -m "feat(web): add biometric and device schema for Phase 3"
```

---

### Task 27: Wearable Connection (Screen 3.1) & Device Check Modal (Screen 3.2)

**Files:**
- Create: `apps/web/app/(tabs)/profile/devices/page.tsx`
- Create: `apps/web/components/devices/device-card.tsx`
- Create: `apps/web/components/devices/device-check-modal.tsx`

**Step 1: Build devices page**

Profile sub-page. List of device cards (Apple Watch, Whoop, Fitbit). Each: logo, name, connect/connected status, last sync time, permission toggles. Privacy info card at bottom.

**Step 2: Build device-check-modal.tsx**

Modal shown when joining a biometric class. Pulsing circle with BPM reading, consent toggle, "Join Class" button. Uses mock data initially.

**Step 3: Commit**

```bash
git add apps/web/app/(tabs)/profile/devices/ apps/web/components/devices/
git commit -m "feat(web): add wearable connection and device check (Screens 3.1, 3.2)"
```

---

### Task 28: Live Class Dashboard (Screens 3.3, 3.4)

The most complex screen. Coach's iPad view during a live class.

**Files:**
- Create: `apps/web/app/live/[classId]/page.tsx`
- Create: `apps/web/components/live/live-header.tsx`
- Create: `apps/web/components/live/now-playing.tsx`
- Create: `apps/web/components/live/heart-rate-grid.tsx`
- Create: `apps/web/components/live/hr-card.tsx`
- Create: `apps/web/components/live/class-aggregate.tsx`
- Create: `apps/web/components/live/adjustment-toast.tsx`
- Create: `apps/web/hooks/use-live-class.ts`

**Step 1: Create use-live-class.ts hook**

Manages WebSocket connection for real-time data. Initially uses mock data that simulates HR readings with `setInterval`. Interface:
```tsx
interface LiveClassState {
  elapsed: number
  currentPhase: Phase
  attendees: { name: string; hr: number; history: number[] }[]
  classAvgHr: number
  zoneDistribution: { zone: number; percentage: number }[]
  adjustments: Adjustment[]
}
```

**Step 2: Build components**

- `live-header.tsx`: class name, elapsed timer (monospace), attendee count (green pulse), "End Class" button
- `now-playing.tsx`: track name + artist, BPM badge, progress bar, skip controls
- `hr-card.tsx`: name, large HR number (monospace), `<Sparkline>`, zone color background
- `heart-rate-grid.tsx`: 2-3 column CSS grid of `<HrCard>` components
- `class-aggregate.tsx`: "Class Avg" monospace number + `<ZoneDistributionBar>` + auto-adjustment indicator
- `adjustment-toast.tsx`: slide-in notification with reason, action, undo button

**Step 3: Assemble live page**

`/live/[classId]` — no tab bar. Full-screen dashboard.
- Top: `<LiveHeader>`
- Phase bar: `<IntensityArc>` with `playheadPosition` prop
- `<NowPlaying>`
- `<HeartRateGrid>` (~50% of screen)
- `<ClassAggregate>`

**Step 4: Verify with mock data**

Start live view, confirm HR cards update, timer ticks, sparklines draw.

**Step 5: Commit**

```bash
git add apps/web/app/live/ apps/web/components/live/ apps/web/hooks/use-live-class.ts
git commit -m "feat(web): build live class dashboard with mock data (Screens 3.3, 3.4)"
```

---

### Task 29: Gym Display Mode (Screen 3.5)

**Files:**
- Create: `apps/web/app/display/[classId]/page.tsx`
- Create: `apps/web/components/live/gym-display.tsx`

**Step 1: Build gym display page**

Separate route, dark theme (#111 background), no tab bar or navigation.
- Layout: CSS grid, left 60% + right 40%
- Left: HR leaderboard — large rows. Name, giant monospace HR (~80px), zone color, sparkline
- Right: now playing (large album art placeholder, track name, BPM), class average (giant number), zone bar, phase + countdown, intensity arc with playhead
- All typography oversized for TV readability (48px+ for numbers)

**Step 2: Reuse use-live-class.ts hook for real-time data**

Same WebSocket/mock data connection as the coach dashboard.

**Step 3: Add auto-reconnect indicator**

If data stops: "Reconnecting..." overlay with retry logic.

**Step 4: Commit**

```bash
git add apps/web/app/display/ apps/web/components/live/gym-display.tsx
git commit -m "feat(web): build gym display mode for TV screens (Screen 3.5)"
```

---

### Task 30: Post-Workout Analysis (Screens 3.6, 3.7)

**Files:**
- Create: `apps/web/components/analytics/hr-graph.tsx`
- Create: `apps/web/components/analytics/zone-breakdown.tsx`
- Create: `apps/web/components/analytics/track-correlation.tsx`
- Create: `apps/web/components/analytics/coach-class-analytics.tsx`
- Modify: `apps/web/app/classes/[id]/page.tsx` — add biometric section for past classes

**Step 1: Build hr-graph.tsx**

SVG line chart. X: time, Y: heart rate. Features:
- HR curve line (smooth path)
- Background zone color bands
- Track change markers (vertical dashed lines)
- Phase overlay along x-axis
- Peak marker flag
- Stats row below: avg HR, max HR, Zone 4+ time, est. calories (all monospace)

**Step 2: Build zone-breakdown.tsx**

Horizontal stacked bar with time labels per zone.

**Step 3: Build track-correlation.tsx**

Track list showing avg HR during each track + HR delta on track change. Highlights biggest boost.

**Step 4: Build coach-class-analytics.tsx**

For coach past class detail:
- Aggregate HR graph (class avg line + min-max shaded band)
- Track engagement table: avg HR, % Zone 4+, heat score (monospace)
- Phase accuracy: target vs actual with green/amber indicators
- AI insight card (placeholder text)

**Step 5: Add analytics sections to past class detail**

If biometric data exists for a past class, render the analytics components.

**Step 6: Commit**

```bash
git add apps/web/components/analytics/ apps/web/app/classes/
git commit -m "feat(web): add post-workout biometric analysis (Screens 3.6, 3.7)"
```

---

### Task 31: Leaderboards & AI Insights (Screens 3.8, 3.9)

**Files:**
- Modify: `apps/web/app/(tabs)/stats/page.tsx`
- Create: `apps/web/components/stats/my-stats-card.tsx`
- Create: `apps/web/components/stats/leaderboard.tsx`
- Create: `apps/web/components/stats/achievements.tsx`
- Create: `apps/web/app/(tabs)/profile/insights/page.tsx`
- Create: `apps/web/components/profile/ai-insights.tsx`

**Step 1: Build stats tab (attendee Screen 3.8)**

- Time filter pills: "This Week" / "This Month" / "All Time"
- `<MyStatsCard>`: classes attended, avg HR, Zone 4+ time, streak — all large monospace
- `<Leaderboard>`: collapsible sections (Most Consistent, Hardest Worker, Most Classes). Each: rank, name, metric. Current user highlighted coral. "Show me on leaderboards" toggle.
- `<Achievements>`: badge grid. Unlocked: full color. Locked: gray. Tap for detail.

**Step 2: Build AI insights (coach Screen 3.9)**

Profile sub-page at `/profile/insights`.
- "What Crank has learned" header
- BPM optimization table: default vs. learned ranges per phase (monospace)
- Top performing tracks by heat score
- Genre effectiveness bar chart (CSS-only)
- "Reset learning" ghost button with confirmation

**Step 3: Commit**

```bash
git add apps/web/app/(tabs)/stats/ apps/web/components/stats/ apps/web/app/(tabs)/profile/insights/ apps/web/components/profile/
git commit -m "feat(web): add leaderboards, achievements, and AI insights (Screens 3.8, 3.9)"
```

---

## Post-Implementation

### Final Integration Test

After all tasks complete:

1. Run `pnpm build` — verify no TypeScript errors
2. Run `pnpm lint` — verify no lint errors
3. Manual walkthrough: generate flow → save → library → detail → classes → live (mock) → display
4. Test on iPad viewport (1024x768) — verify no scrolling on generate results
5. Test on mobile viewport (375x812) — verify all screens are usable

### Cleanup

- Remove old `app/page.tsx` if fully migrated to `(tabs)/generate/page.tsx`
- Remove `mockups/` directory (or move to `.gitignore`)
- Update `CLAUDE.md` with new routing structure
- Update metadata in `layout.tsx`: title "Crank", description updated
