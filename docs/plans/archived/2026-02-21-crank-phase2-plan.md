# Crank Frontend — Phase 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply design panel feedback to the Generate screen, then build all remaining screens (Groups 4–7) from the original implementation plan.

**Architecture:** Same stack — Next.js 15 App Router, React 19, Tailwind v4. All Group 1–3 work is complete (design tokens, app shell, generate flow, viz components, UI primitives). This plan covers two tracks: (A) design refinements from the critic panel, and (B) new screens for Phases 1–3.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, TypeScript, Plus Jakarta Sans + JetBrains Mono → **Barlow Condensed** (new heading font), Lucide React, Sonner, Better Auth, Drizzle ORM, Spotify Web Playback SDK.

**Design Doc:** `docs/plans/2026-02-21-frontend-design.md`
**Previous Plan:** `docs/plans/2026-02-21-crank-frontend-implementation.md`

---

## What's Done (Groups 1–3)

| Group | Status | Notes |
|-------|--------|-------|
| 1. Design Foundation | ✅ Complete | Tokens, fonts, Tailwind config, animations |
| 2. App Shell & Navigation | ✅ Complete | Tab bar, route groups, page headers |
| 3. Phase 0 — Generate Flow | ✅ Complete | All 4 screens (0.1–0.4) built and working |

All 7 viz components built: BpmGauge, IntensityArc, EnergyBar, BpmBars, ZoneDistributionBar, Sparkline, MiniIntensityArc.
All UI primitives built: Button, Badge, TogglePills, BottomSheet, Skeleton, Card, Textarea.

---

## Design Panel Feedback Summary

Five design critics reviewed the Generate screen. Consensus items:

| # | Issue | Critics | Priority |
|---|-------|---------|----------|
| 1 | Touch targets too small (play=24px, chips=28px vs 44px min) | Mei-Lin, Jake, Tomás | Must-fix |
| 2 | Track rows too dense (11 data points, 36px rows) | Jake, Katrin, Tomás | Must-fix |
| 3 | No "Play All" button after generation | Jake (x2) | Must-fix |
| 4 | Text floors at 9px — illegible at arm's length | Adrien, Jake | Must-fix |
| 5 | Plus Jakarta Sans wrong for "Crank" brand | Adrien | Should-fix |
| 6 | BPM bars are decorative (hash-derived, not real audio) | Katrin, Tomás | Should-fix |
| 7 | Phase colors are raw Tailwind defaults; amber/orange too close; accent red collides with very_high red | Adrien | Should-fix |
| 8 | Flat type hierarchy — everything same volume | Adrien | Should-fix |
| 9 | Phase-grouped tracks instead of flat table | Jake (x2) | Nice-to-have |
| 10 | Two-panel iPad layout (workout left, playlist right) | Mei-Lin | Nice-to-have |

---

## Implementation Groups

| Group | Tasks | Focus | Depends On |
|-------|-------|-------|------------|
| A. Design Refinements | 1–5 | Critic feedback on Generate screen | Nothing |
| B. Phase 1 — Coach Features | 6–11 | Screens 1.1–1.7 | Group A |
| C. Phase 2 — Coach Classes | 12–15 | Screens 2.1–2.4 | Group B |
| D. Phase 2 — Attendee | 16–20 | Screens 2.5–2.9 | Group B |
| E. Phase 3 — Real-Time | 21–26 | Screens 3.1–3.9 | Groups C+D |

---

## Group A: Design Refinements (Critic Feedback)

### Task 1: Typography Overhaul

Replace Plus Jakarta Sans for headings with Barlow Condensed. Establish a 5-level type scale. Set 12px minimum floor.

**Files:**
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/tailwind.config.js`

**Step 1: Add Barlow Condensed as heading font**

In `layout.tsx`, add:
```tsx
import { Plus_Jakarta_Sans, Barlow_Condensed, JetBrains_Mono } from 'next/font/google'

const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-heading',
})
```

Apply to body: `${barlow.variable} ${jakarta.variable} ${mono.variable} font-sans`.

**Step 2: Add heading font to Tailwind config**

Add `heading: ['var(--font-heading)']` to `fontFamily` in tailwind config.

**Step 3: Define the 5-level type scale in globals.css**

```css
/* Type Scale */
/* Display: 24-28px Barlow Condensed 700 — logo, workout name */
/* Title: 14-16px Jakarta 600 — phase names, track names */
/* Body: 12-13px Jakarta 500 — metadata, labels, artist */
/* Mono: 12-13px JetBrains Mono — BPM, duration, percentages */
/* Micro: 11px Jakarta 600 uppercase tracking-wide — badges only */
```

**Step 4: Update page-header.tsx logo wordmark**

Change "Crank" text from `text-xl font-bold` to `font-heading text-2xl font-bold uppercase tracking-wider`.

**Step 5: Enforce 12px minimum across components**

- `playlist-display.tsx`: Change `text-[9px]` phase badges to `text-[11px]`
- `playlist-display.tsx`: Change `text-[11px]` artist to `text-xs` (12px)
- `generate/page.tsx`: Change `text-[10px]` MOCK badge to `text-xs`

**Step 6: Commit**

```bash
git add apps/web/app/layout.tsx apps/web/app/globals.css apps/web/tailwind.config.js apps/web/components/
git commit -m "feat(web): typography overhaul — Barlow Condensed headings, 5-level scale, 12px floor"
```

---

### Task 2: Phase Color Refinement & Red Collision Fix

Fix the amber/orange similarity and the accent-red / very_high-red collision.

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/components/workout-display.tsx` (PHASE_BORDER_CLASSES uses hardcoded hex — convert to tokens)

**Step 1: Update phase color tokens**

In `globals.css`, change:
```css
/* Phase colors — curated palette, not raw Tailwind defaults */
--phase-warmup: #3B82F6;     /* blue — keep */
--phase-low: #06B6D4;         /* cyan — more distinct from blue */
--phase-moderate: #F59E0B;    /* amber — keep */
--phase-high: #E63946;        /* brand coral — high intensity = brand accent */
--phase-very-high: #BE123C;   /* deep rose — darker than accent, clearly distinct */
--phase-cooldown: #8B5CF6;    /* violet — keep */
```

**Step 2: Fix hardcoded hex in workout-display.tsx**

Replace `PHASE_BORDER_CLASSES` hardcoded values with CSS variable approach. Use inline `style={{ borderLeftColor: PHASE_COLORS[phase.intensity] }}` instead of Tailwind arbitrary classes.

**Step 3: Commit**

```bash
git add apps/web/app/globals.css apps/web/components/workout-display.tsx
git commit -m "fix(web): curate phase colors — fix amber/orange similarity and red collision"
```

---

### Task 3: Touch Targets & Track Row Density

Increase all interactive elements to 44px minimum. Simplify track rows.

**Files:**
- Modify: `apps/web/components/playlist-display.tsx`
- Modify: `apps/web/components/workout-form.tsx`

**Step 1: Increase play button from 24px to 40px**

In `playlist-display.tsx`, change play button from `h-6 w-6` to `h-10 w-10`. Change icon from `h-3 w-3` to `h-4 w-4`.

**Step 2: Increase track row height**

Change track row padding from `py-1` to `py-2`. This brings rows from ~36px to ~44px.

**Step 3: Replace BPM bars with BPM-in-range indicator**

Remove `<BpmBars>` (hash-derived, decorative). Replace with a simple text indicator:
- If track BPM falls within a phase's BPM range: render BPM in foreground color (bold)
- If outside range: render BPM in muted color
- The phase badge already shows the mapping, so BPM just needs to be readable

**Step 4: Simplify track columns**

Remove energy bar + energy percentage from default view (was already `hidden sm:flex`; now remove entirely from default, keep available behind a toggle or detail view later). This cuts 2 columns and reduces visual noise.

New track row structure: play button | album art | name+artist | BPM | duration | phase badge | spotify link

**Step 5: Increase example workout chip targets**

In `workout-form.tsx`, change chip styles from `text-xs px-2.5 py-1` to `text-sm px-3 py-2` to meet ~44px height.

**Step 6: Increase compact mode button targets**

Change Edit/New buttons from `size="sm"` to default size.

**Step 7: Commit**

```bash
git add apps/web/components/playlist-display.tsx apps/web/components/workout-form.tsx
git commit -m "fix(web): increase touch targets to 44px, simplify track rows, remove BPM bars"
```

---

### Task 4: Add "Play All" Button

Add a prominent play-all action at the top of the playlist.

**Files:**
- Modify: `apps/web/components/playlist-display.tsx`
- Modify: `apps/web/app/(tabs)/generate/page.tsx`

**Step 1: Add Play All button to playlist header**

In `playlist-display.tsx`, after the track count / duration header, add a "Play All" button:
```tsx
{onPlayTrack && (
  <Button
    variant="accent"
    size="sm"
    onClick={() => onPlayTrack(playlist.tracks[0]?.spotify_uri!)}
    className="h-10"
  >
    <Play className="h-4 w-4 mr-1.5" />
    Play All
  </Button>
)}
```

**Step 2: Add onPlayAll callback to playlist display props**

Add an optional `onPlayAll` prop that triggers sequential playback from track 1.

**Step 3: Wire up in generate page**

Pass the `onPlayAll` handler from the generate page.

**Step 4: Commit**

```bash
git add apps/web/components/playlist-display.tsx apps/web/app/(tabs)/generate/page.tsx
git commit -m "feat(web): add Play All button to playlist header"
```

---

### Task 5: Workout Name as Hero Text

Make the workout name the loudest typographic element in results view.

**Files:**
- Modify: `apps/web/components/workout-form.tsx` (compact mode)
- Modify: `apps/web/app/(tabs)/generate/page.tsx`

**Step 1: Redesign compact workout display in results**

Instead of showing the workout text in a muted truncated line, show it as a hero heading:
```tsx
// Replace the compact bar with:
<div className="flex items-center justify-between">
  <h2 className="font-heading text-xl font-bold uppercase tracking-wide truncate">
    {result?.workout.workout_name || workoutText}
  </h2>
  <div className="flex items-center gap-2 flex-shrink-0">
    <Button variant="outline" size="sm" onClick={handleEdit}>Edit</Button>
    <Button variant="outline" size="sm" onClick={handleNewWorkout}>New</Button>
  </div>
</div>
```

This uses the Barlow Condensed heading font at 20px bold uppercase — immediately creates a visual anchor.

**Step 2: Commit**

```bash
git add apps/web/components/workout-form.tsx apps/web/app/(tabs)/generate/page.tsx
git commit -m "feat(web): show workout name as hero heading in results view"
```

---

## Group B: Phase 1 — Coach Features

### Task 6: Auth Modal (Screen 1.1)

Full-screen modal overlay for login/signup. Replace inline auth.

**Files:**
- Create: `apps/web/components/auth/auth-modal.tsx`
- Modify: `apps/web/components/auth/sign-in-button.tsx`
- Modify: `apps/web/components/auth/user-menu.tsx`

**Step 1: Create auth-modal.tsx**

Full-screen overlay with dimmed backdrop. Centered white card.
- Crank logo (Barlow Condensed) + tagline at top
- Login / Sign up toggle pills
- Login: email + password fields, coral "Sign in" button, "Forgot password?" link
- Divider "or", Google + Apple social buttons (outlined)
- Sign up: name + email + password, same social buttons
- Close X in top-right corner
- Uses existing Better Auth client (`authClient`)

**Step 2: Update sign-in-button.tsx to open modal instead of direct auth**

**Step 3: Update user-menu.tsx with Barlow heading font**

**Step 4: Commit**

```bash
git add apps/web/components/auth/
git commit -m "feat(web): add auth modal overlay (Screen 1.1)"
```

---

### Task 7: Coach Onboarding (Screen 1.2)

Multi-step stepper after first signup.

**Files:**
- Create: `apps/web/components/onboarding/coach-onboarding.tsx`
- Create: `apps/web/components/ui/genre-chips.tsx`
- Create: `apps/web/components/ui/energy-slider.tsx`
- Create: `apps/web/components/ui/artist-tag-input.tsx`

**Step 1: Create genre-chips.tsx**

Multi-select chip grid. 11 genres: Rock, Metal, Hip-Hop, Electronic, Pop, Country, Punk, Indie, R&B, Latin, Classical. Outlined inactive, coral-filled active. Min 44px tap target per chip.

**Step 2: Create energy-slider.tsx**

Range slider from 0.3 (Chill) to 1.0 (Intense). Coral accent track fill.

**Step 3: Create artist-tag-input.tsx**

Text input that creates tag chips on Enter. X to remove.

**Step 4: Create coach-onboarding.tsx**

4-step stepper:
- Step 1: Display name + gym name
- Step 2: GenreChips
- Step 3: EnergySlider + explicit toggle + ArtistTagInput
- Step 4: Spotify connect + "Skip for now"
- Step dots, Back/Next buttons
- Calls existing profile update server action

**Step 5: Hook into auth flow in (tabs)/layout.tsx**

After signup, if no coach profile, redirect to onboarding.

**Step 6: Commit**

```bash
git add apps/web/components/onboarding/ apps/web/components/ui/
git commit -m "feat(web): add coach onboarding flow (Screen 1.2)"
```

---

### Task 8: Library Redesign (Screen 1.3)

Redesign saved playlists as a card grid with mini arcs.

**Files:**
- Modify: `apps/web/app/(tabs)/library/page.tsx`
- Modify: `apps/web/components/playlist-list.tsx`

**Step 1: Add search bar**

Compact rounded search field at top with magnifying glass icon. Client-side filter on name + workout text.

**Step 2: Redesign playlist cards**

2-column grid (iPad), 1-column (phone). Each card: white, rounded-xl, shadow-sm.
- Playlist name (Barlow Condensed, bold)
- Workout text (first line, truncated, muted)
- Date (monospace), track count + duration (monospace)
- MiniIntensityArc (colored bar)
- Coral play icon overlay (top-right)

**Step 3: Verify grid on iPad viewport**

**Step 4: Commit**

```bash
git add apps/web/app/(tabs)/library/ apps/web/components/playlist-list.tsx
git commit -m "feat(web): redesign library with search and card grid (Screen 1.3)"
```

---

### Task 9: Playlist Detail (Screen 1.4)

Full detail view for saved playlists with track management.

**Files:**
- Modify: `apps/web/app/playlist/[id]/page.tsx`

**Step 1: Build detail layout**

- Back arrow → Library
- Playlist name (large, Barlow Condensed, editable inline)
- Workout text (collapsible)
- Phase cards + intensity arc (reuse components, read-only)
- Track table (reuse from generate) with additional controls:
  - Swap icon button (opens bottom sheet — wired to TODO for now)
  - Thumbs up/down (inline feedback)
  - Drag handle (left edge, visual only for now)
- Action bar: "Regenerate" (ghost), "Export to Spotify" (coral), "Share" (icon)

**Step 2: Implement inline playlist rename**

Click name → transforms to input → blur/Enter saves.

**Step 3: Commit**

```bash
git add apps/web/app/playlist/
git commit -m "feat(web): build playlist detail view with track controls (Screen 1.4)"
```

---

### Task 10: Track Swap Sheet & Feedback (Screens 1.5, 1.6)

**Files:**
- Create: `apps/web/components/track-swap-sheet.tsx`
- Create: `apps/web/components/track-feedback.tsx`

**Step 1: Create track-swap-sheet.tsx**

Uses BottomSheet. Shows "Replace: [Track Name]" + target BPM range. Search input. Results list with BPM color coding (green=in range, amber=close, red=far). Tap to replace. Uses mock data for now.

**Step 2: Create track-feedback.tsx**

Inline thumbs up/down per track row. Coral fill on up, muted on down. Calls server action to save to trackFeedback table.

**Step 3: Commit**

```bash
git add apps/web/components/track-swap-sheet.tsx apps/web/components/track-feedback.tsx
git commit -m "feat(web): add track swap sheet and inline feedback (Screens 1.5, 1.6)"
```

---

### Task 11: Profile Redesign (Screen 1.7)

Combine preferences + stats in profile tab.

**Files:**
- Modify: `apps/web/app/(tabs)/profile/page.tsx`
- Modify: `apps/web/components/profile-form.tsx`
- Create: `apps/web/components/profile-stats.tsx`

**Step 1: Redesign profile layout**

Top: avatar (circle), name (Barlow Condensed), gym name, "Edit Profile" link.
Two sections: "Preferences" (inline-editable using genre chips, energy slider) and "Stats".

**Step 2: Create profile-stats.tsx**

- Top Artists: horizontal scroll row
- Genre Distribution: CSS stacked bar
- Playlists Generated: large monospace number + trend
- Most Boosted: top 5 thumbed-up tracks
- All from existing server actions / tables

**Step 3: Add sign-out + Spotify connection at bottom**

**Step 4: Commit**

```bash
git add apps/web/app/(tabs)/profile/ apps/web/components/
git commit -m "feat(web): redesign profile with preferences and stats (Screen 1.7)"
```

---

## Group C: Phase 2 — Coach Classes

### Task 12: Class Session Schema

Add database tables for classes.

**Files:**
- Modify: `apps/web/lib/schema.ts`
- Modify: `apps/web/app/actions.ts`

**Step 1: Add classSessions and classAttendees tables**

```tsx
export const classSessions = pgTable('class_sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  coachId: text('coach_id').notNull().references(() => user.id),
  workoutText: text('workout_text').notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  rsvpDeadline: timestamp('rsvp_deadline'),
  playlistId: text('playlist_id').references(() => savedPlaylists.id),
  preferenceMode: text('preference_mode').notNull().default('coach_only'),
  coachWeight: integer('coach_weight').default(60),
  status: text('status').notNull().default('scheduled'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const classAttendees = pgTable('class_attendees', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  classId: text('class_id').notNull().references(() => classSessions.id),
  userId: text('user_id').references(() => user.id),
  email: text('email').notNull(),
  rsvpStatus: text('rsvp_status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
})
```

**Step 2: Add server actions**

`createClass()`, `listClasses()`, `getClass()`, `updateClass()`, `cancelClass()`, `inviteAttendee()`, `updateRsvp()`.

**Step 3: Generate migration and commit**

```bash
git add apps/web/lib/schema.ts apps/web/app/actions.ts
git commit -m "feat(web): add class session schema and server actions"
```

---

### Task 13: Classes Tab (Screens 2.1, 2.4)

**Files:**
- Create: `apps/web/app/(tabs)/classes/page.tsx`
- Create: `apps/web/components/classes/class-list.tsx`
- Create: `apps/web/components/classes/class-card.tsx`

**Step 1: Build class-list.tsx**

TogglePills "Upcoming" / "Past". Date-grouped sticky headers (monospace). ClassCard per item.

**Step 2: Build class-card.tsx**

Time (large monospace), workout snippet, avatar stack + count, playlist status badge. Past variant: feedback rating.

**Step 3: Wire up classes page**

Fetch via `listClasses()`. "+ New Class" button top-right. Tap → `/classes/[id]`.

**Step 4: Commit**

```bash
git add apps/web/app/(tabs)/classes/ apps/web/components/classes/
git commit -m "feat(web): build classes tab with upcoming and past views (Screens 2.1, 2.4)"
```

---

### Task 14: Create Class Sheet (Screen 2.2)

**Files:**
- Create: `apps/web/components/classes/create-class-sheet.tsx`

**Step 1: Build create-class-sheet.tsx**

BottomSheet at ~80%. Date+time pickers, workout textarea or "Use saved", email invite input, RSVP deadline, preference mode toggle, coach/attendee weight slider. "Schedule Class" (coral) + "Save as draft" (ghost).

**Step 2: Commit**

```bash
git add apps/web/components/classes/
git commit -m "feat(web): add create class bottom sheet (Screen 2.2)"
```

---

### Task 15: Class Detail — Coach (Screen 2.3)

**Files:**
- Create: `apps/web/app/classes/[id]/page.tsx`
- Create: `apps/web/components/classes/attendee-list.tsx`
- Create: `apps/web/components/classes/class-playlist-section.tsx`

**Step 1: Build class detail page**

Back arrow, date/time (monospace), workout text, AttendeeList (avatars + RSVP badges), ClassPlaylistSection (generate or view playlist), "Start Class" / "Cancel Class" actions.

**Step 2: Commit**

```bash
git add apps/web/app/classes/ apps/web/components/classes/
git commit -m "feat(web): build class detail view for coaches (Screen 2.3)"
```

---

## Group D: Phase 2 — Attendee Screens

### Task 16: Attendee Role & Onboarding (Screen 2.5)

**Files:**
- Modify: `apps/web/lib/schema.ts` — add role field
- Create: `apps/web/components/onboarding/attendee-onboarding.tsx`
- Modify: `apps/web/app/(tabs)/layout.tsx` — role-based tab rendering

**Step 1: Add role support to schema**

Add `role` field. Tab layout reads role to determine tabs.

**Step 2: Create attendee-onboarding.tsx**

3-step: Name → Genre chips → Connect Spotify (optional).

**Step 3: Commit**

```bash
git add apps/web/lib/schema.ts apps/web/components/onboarding/ apps/web/app/(tabs)/layout.tsx
git commit -m "feat(web): add attendee role and onboarding (Screen 2.5)"
```

---

### Task 17: Attendee Classes Tab (Screen 2.6)

**Files:**
- Create: `apps/web/app/(tabs)/classes/attendee-classes.tsx`

**Step 1: Build attendee view**

"Next Up" highlighted card, upcoming list with RSVP buttons, past list with "Leave feedback" badge. Conditionally render in classes page based on role.

**Step 2: Commit**

```bash
git add apps/web/app/(tabs)/classes/
git commit -m "feat(web): build attendee classes tab (Screen 2.6)"
```

---

### Task 18: Attendee Class Detail (Screen 2.7)

**Files:**
- Create: `apps/web/app/classes/[id]/attendee-view.tsx`

**Step 1: Build attendee class detail**

Coach info, date/time, workout, RSVP toggles, read-only playlist + "Open in Spotify", thumbs up/down per track. Role-based rendering in class detail page.

**Step 2: Commit**

```bash
git add apps/web/app/classes/
git commit -m "feat(web): build attendee class detail view (Screen 2.7)"
```

---

### Task 19: Post-Class Feedback (Screen 2.8)

**Files:**
- Create: `apps/web/app/classes/[id]/feedback/page.tsx`
- Create: `apps/web/components/classes/feedback-form.tsx`

**Step 1: Build feedback form**

Track-by-track cards with 5-star or thumbs rating, optional comment, overall rating. Submit saves to trackFeedback table.

**Step 2: Commit**

```bash
git add apps/web/app/classes/ apps/web/components/classes/
git commit -m "feat(web): add post-class feedback flow (Screen 2.8)"
```

---

### Task 20: Attendee Music Tab (Screen 2.9)

**Files:**
- Modify: `apps/web/app/(tabs)/music/page.tsx`

**Step 1: Build music tab**

"My Taste" (editable genre chips), "My Influence" (track match count), "Liked Tracks" (thumbed-up list). Lighter feel than coach profile.

**Step 2: Commit**

```bash
git add apps/web/app/(tabs)/music/
git commit -m "feat(web): build attendee music tab (Screen 2.9)"
```

---

## Group E: Phase 3 — Real-Time (Mock Data)

> All Phase 3 screens use mock data. Real WebSocket/wearable backends are not in scope.

### Task 21: Biometric Schema

**Files:**
- Modify: `apps/web/lib/schema.ts`

Add `connectedDevices`, `biometricData`, `playlistAdjustments` tables per original plan Task 26.

**Step 1: Add tables and commit**

```bash
git add apps/web/lib/schema.ts
git commit -m "feat(web): add biometric and device schema for Phase 3"
```

---

### Task 22: Wearable Connection & Device Check (Screens 3.1, 3.2)

**Files:**
- Create: `apps/web/app/(tabs)/profile/devices/page.tsx`
- Create: `apps/web/components/devices/device-card.tsx`
- Create: `apps/web/components/devices/device-check-modal.tsx`

Device cards (Apple Watch, Whoop, Fitbit), privacy info. Device check modal with HR pulse, consent toggle.

**Step 1: Build and commit**

```bash
git add apps/web/app/(tabs)/profile/devices/ apps/web/components/devices/
git commit -m "feat(web): add wearable connection and device check (Screens 3.1, 3.2)"
```

---

### Task 23: Live Class Dashboard (Screens 3.3, 3.4)

**Files:**
- Create: `apps/web/app/live/[classId]/page.tsx`
- Create: `apps/web/components/live/live-header.tsx`
- Create: `apps/web/components/live/now-playing.tsx`
- Create: `apps/web/components/live/heart-rate-grid.tsx`
- Create: `apps/web/components/live/hr-card.tsx`
- Create: `apps/web/components/live/class-aggregate.tsx`
- Create: `apps/web/components/live/adjustment-toast.tsx`
- Create: `apps/web/hooks/use-live-class.ts`

The most complex screen. Full-screen dashboard: elapsed timer, phase bar with playhead, now playing, HR grid, class aggregate, adjustment toasts. `use-live-class.ts` hook simulates HR data with `setInterval`.

**Step 1: Build all components and commit**

```bash
git add apps/web/app/live/ apps/web/components/live/ apps/web/hooks/
git commit -m "feat(web): build live class dashboard with mock data (Screens 3.3, 3.4)"
```

---

### Task 24: Gym Display Mode (Screen 3.5)

**Files:**
- Create: `apps/web/app/display/[classId]/page.tsx`
- Create: `apps/web/components/live/gym-display.tsx`

Dark theme (#111), no tab bar. Left 60%: HR leaderboard (giant monospace). Right 40%: now playing, class avg, zone bar, phase countdown, intensity arc with playhead. Min 48px for HR numbers. Reuses `use-live-class.ts`.

**Step 1: Build and commit**

```bash
git add apps/web/app/display/ apps/web/components/live/
git commit -m "feat(web): build gym display mode for TV screens (Screen 3.5)"
```

---

### Task 25: Post-Workout Analysis (Screens 3.6, 3.7)

**Files:**
- Create: `apps/web/components/analytics/hr-graph.tsx`
- Create: `apps/web/components/analytics/zone-breakdown.tsx`
- Create: `apps/web/components/analytics/track-correlation.tsx`
- Create: `apps/web/components/analytics/coach-class-analytics.tsx`
- Modify: `apps/web/app/classes/[id]/page.tsx`

SVG HR graph (time vs HR, zone bands, track markers, peak flag). Zone breakdown bar. Track correlation list. Coach analytics (aggregate HR, engagement table, phase accuracy, AI insight card).

**Step 1: Build all analytics components and commit**

```bash
git add apps/web/components/analytics/ apps/web/app/classes/
git commit -m "feat(web): add post-workout biometric analysis (Screens 3.6, 3.7)"
```

---

### Task 26: Leaderboards & AI Insights (Screens 3.8, 3.9)

**Files:**
- Modify: `apps/web/app/(tabs)/stats/page.tsx`
- Create: `apps/web/components/stats/my-stats-card.tsx`
- Create: `apps/web/components/stats/leaderboard.tsx`
- Create: `apps/web/components/stats/achievements.tsx`
- Create: `apps/web/app/(tabs)/profile/insights/page.tsx`
- Create: `apps/web/components/profile/ai-insights.tsx`

Stats tab: time filter pills, MyStatsCard, Leaderboard sections, Achievements grid. AI Insights: BPM optimization table, top tracks, genre effectiveness, reset learning.

**Step 1: Build all components and commit**

```bash
git add apps/web/app/(tabs)/stats/ apps/web/components/stats/ apps/web/app/(tabs)/profile/insights/ apps/web/components/profile/
git commit -m "feat(web): add leaderboards, achievements, and AI insights (Screens 3.8, 3.9)"
```

---

## Post-Implementation Checklist

1. `pnpm build` — no TypeScript errors
2. `pnpm lint` — no lint errors
3. Manual walkthrough: generate → save → library → detail → classes → live (mock) → display
4. iPad viewport (1024x768): no scrolling on generate results
5. Mobile viewport (375x812): all screens usable
6. All touch targets ≥ 44px
7. No text below 11px
8. Update `CLAUDE.md` with new routing structure
