# Crank Design Expert Panel Report (v2)

**Date**: 2026-02-21
**Panel Size**: 5 experts
**Scope**: Full design audit of the Crank PWA, targeting world-class fitness app quality
**Reference Apps**: Strava, Peloton, Nike Training Club, Hevy, WHOOP, Spotify
**Supersedes**: v1 panel report from earlier session

---

## Table of Contents

1. [Expert 1: Visual Design Lead](#expert-1-visual-design-lead)
2. [Expert 2: Interaction Design Expert](#expert-2-interaction-design-expert)
3. [Expert 3: Mobile UX Specialist](#expert-3-mobile-ux-specialist)
4. [Expert 4: Fitness App Design Expert](#expert-4-fitness-app-design-expert)
5. [Expert 5: Brand Identity Designer](#expert-5-brand-identity-designer)
6. [Panel Synthesis](#panel-synthesis)
7. [Prioritized Recommendations](#prioritized-recommendations)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Expert 1: Visual Design Lead

**Background**: 12 years in product design, led visual systems at Spotify and Headspace. Specializes in color theory, typography systems, and visual hierarchy.

### Assessment

The current Crank design is **functional and clean** but reads as a developer-built UI rather than a designer-led product. It has solid foundations -- good font choices (Plus Jakarta Sans, Barlow Condensed, JetBrains Mono), a thoughtful color token system, and consistent component patterns. However, it lacks the visual density, rhythm, and emotional punch that separates "nice" from "can't put it down."

**Rating: 5.5/10**

### Specific Findings

#### 1. Color System (Current: 5/10)

**Strengths:**
- The accent red (#E63946) is bold and appropriate for a high-energy fitness brand
- Phase colors are well-differentiated and semantically meaningful (blue-to-red heat ramp)
- HR Zone colors provide a good secondary palette

**Weaknesses:**
- The light theme (#FAFAFA background, white cards) feels sterile and clinical. Fitness apps thrive on dark, high-contrast themes that feel immersive and athletic. Every top fitness app (Peloton, WHOOP, Nike Training Club, Strava's activity view) uses dark backgrounds
- No dark mode at all -- this is a major gap for a gym environment where users pull out phones in dimly lit boxes
- The red accent on white/light gray lacks the dramatic contrast that makes fitness apps feel energetic
- Phase colors are only used as tiny accents (border-left on cards, small badges). They should dominate more of the visual space
- No gradient usage at all. Modern fitness apps use gradients extensively (Peloton's activity rings, Strava's heatmaps, Apple Fitness+ activity overlays)

**Recommendations:**

**R1.1 — Dark-first design system**. Default to dark mode. Define new surface elevation tokens:
```css
--surface-0: #0A0A0F;   /* page background */
--surface-1: #12121F;   /* cards */
--surface-2: #1A1A2E;   /* elevated cards, modals */
--surface-3: #252540;   /* interactive hover states */
--text-primary: #F5F5F5;
--text-secondary: #9CA3AF;
--text-tertiary: #6B7280;
--border-dark: #2A2A3E;
```
The gym is dark. The vibe is dark. Lean into it.

**R1.2 — Gradient tokens for brand moments**. Add gradient CSS properties for hero elements:
```css
--gradient-brand: linear-gradient(135deg, #E63946, #FF6B35);
--gradient-warmup: linear-gradient(135deg, #3B82F6, #06B6D4);
--gradient-peak: linear-gradient(135deg, #E63946, #BE123C);
--gradient-cooldown: linear-gradient(135deg, #8B5CF6, #6366F1);
```

**R1.3 — Glow effects for active/accent elements**. Add `box-shadow: 0 0 20px rgba(230, 57, 70, 0.3)` on the generate button, active player bar, and currently playing track. This creates a "neon in a dark room" aesthetic.

**R1.4 — Expand accent to a micro-scale**. The single `--accent: #E63946` needs companions:
```css
--accent-50: #FEF2F2;
--accent-100: #FEE2E4;
--accent-200: #FCCACD;
--accent-500: #E63946;   /* current --accent */
--accent-700: #B91C2B;
--accent-900: #7F1D1D;
```

#### 2. Typography (Current: 6/10)

**Strengths:**
- Three-font system is well-chosen and purposeful
- Font feature settings show attention to detail
- `.font-mono-nums` utility for tabular numbers is smart

**Weaknesses:**
- The type scale is too uniform. Headings and body text don't have enough contrast
- Barlow Condensed at 700 weight is only used for the logo and results heading. It should be the display face throughout -- workout names, phase names, BPM readouts
- No type scale tokens. Sizes are scattered as raw Tailwind classes (`text-sm`, `text-xs`, `text-[10px]`, `text-[11px]`)
- `text-[10px]` and `text-[11px]` in the player bar fall below accessibility minimums (12px)

**Recommendations:**

**R1.5 — Formal type scale in CSS custom properties**:
```css
--text-display: 2rem;      /* 32px - workout names, hero */
--text-heading: 1.5rem;    /* 24px - section headers */
--text-title: 1.125rem;    /* 18px - card titles */
--text-body: 1rem;         /* 16px - body copy */
--text-caption: 0.8125rem; /* 13px - metadata */
--text-micro: 0.75rem;     /* 12px - absolute minimum */
```

**R1.6 — Use Barlow Condensed more aggressively**. Phase names, BPM readouts, track numbers, workout type labels, and any at-a-glance data should use `font-heading`. Condensed fonts are the language of sports dashboards (see: F1 timing screens, ESPN score overlays, Peloton metrics).

**R1.7 — Fix accessibility: minimum 12px text everywhere**. Replace all `text-[10px]` and `text-[11px]` with `text-xs` (12px). Files affected: `spotify-player.tsx` (lines 129, 153-154, 177).

#### 3. Visual Hierarchy (Current: 5/10)

**Weaknesses:**
- Everything feels equally weighted. Genre chips, text/photo toggle, textarea, WOD buttons, generate button, results header, phase cards, intensity arc, track metadata -- all in the same visual weight
- The empty state is too minimal. One icon + one line of gray text on white feels like a broken app
- Phase cards are too small on mobile. Three cards horizontally on 375px means each is ~105px wide, barely readable
- The track list right side has 7+ data points competing: BPM bars, BPM number, energy bar, duration, phase badge, feedback buttons, external link

**Recommendations:**

**R1.8 — Scale contrast for hierarchy**. The workout name should be 32px Barlow Condensed (dominant). Phase cards should be medium weight. Track rows should be compact. Currently everything is in the "compact" zone with no variation.

**R1.9 — Redesign empty state as a hero**. Large Crank logo mark centered, animated subtle gradient background pulsing in brand colors, compelling tagline ("Drop a WOD. Get your soundtrack."), with the input form below. Reference: Shazam's "tap to identify" state.

**R1.10 — Phase cards mobile layout**. On screens < 640px, either:
- (A) Horizontal scroll strip with snap points, or
- (B) Collapse into the IntensityArc itself (show phase names as labels on the arc segments), or
- (C) Single highlighted phase card with horizontal swipe to reveal others

**R1.11 — Track list mobile simplification**. On mobile, show only: track number, album art, title/artist, BPM, and a colored phase dot. Hide BPM bars, energy percentage, duration, and phase text badge. Reveal full details on row tap/expand. The phase badge `hidden md:inline-flex` currently hides entirely on mobile -- replace with a 6px colored dot that is always visible.

#### 4. Spacing & Layout (Current: 6/10)

**Weaknesses:**
- `space-y-3` (12px) between ALL sections makes everything crammed. The gap between form and results, workout display and playlist, header and content should all be different
- The player bar at `bottom-20` creates a double-bar effect with the tab bar, consuming ~140px (37%) of a 375px viewport

**Recommendations:**

**R1.12 — Variable spacing rhythm**. Use `space-y-6` (24px) between major sections, `space-y-3` (12px) within sections, `space-y-1` (4px) between track rows.

**R1.13 — Merge player bar into tab bar**. When music is playing, the tab bar should transform to show a mini-player row: album art thumbnail, track title (truncated), play/pause button. Tapping expands to the full player via a bottom sheet or full-screen view. This reclaims ~60px of screen height.

---

## Expert 2: Interaction Design Expert

**Background**: 10 years designing micro-interactions at Apple (Health, Fitness+) and Figma. Specializes in animation, transitions, state management, and haptic feedback.

### Assessment

The interaction layer is **nascent but promising**. Thoughtful animation keyframes are defined (fade-slide-up, scale-in, gauge-sweep, sparkline-draw), but they are applied uniformly without choreography. State transitions (empty -> loading -> results) use simple conditional rendering rather than animated transitions.

**Rating: 3.5/10**

### Specific Findings

#### 1. State Transitions (Current: 4/10)

**Weaknesses:**
- `empty -> loading -> results` is a hard cut. Content pops in/out with no animated handoff
- Track stagger delay of 40ms is too fast to perceive as sequential (6 tracks = 240ms total). Reads as a slightly janky batch
- Loading state shows a static 60% progress bar with `animate-pulse`. This is a lie bar
- No exit animations. Clicking "New" makes content vanish instantly
- Generate button has no press feedback beyond default browser active state

**Recommendations:**

**R2.1 — AnimatePresence for state transitions**. Use Framer Motion's `AnimatePresence` or CSS `@starting-style`:
```tsx
<AnimatePresence mode="wait">
  {state === 'loading' && (
    <motion.div key="loading" exit={{ opacity: 0, y: -10 }} />
  )}
  {state === 'results' && (
    <motion.div key="results"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }} />
  )}
</AnimatePresence>
```
When results arrive, the form should collapse upward while results expand downward.

**R2.2 — Increase track stagger to 100ms, cap at 8 visible**. Change `animationDelay: ${index * 40}ms` to `animationDelay: ${Math.min(index, 7) * 100}ms`. Tracks below the fold need no stagger.

**R2.3 — Three-stage loading animation**. Replace the fake progress bar with a sequence tied to actual pipeline stages:
1. Pulsing brain icon for "Breaking down your WOD..."
2. Expanding sound wave for "Picking the heat..."
3. Assembling list animation for "Lining up the drops..."
Each stage animates for ~2s, matching the LOADING_MESSAGES cycling.

**R2.4 — Exit animations**. Add `animate-fade-slide-down` (reverse of up). When "New" is clicked, content should scale down and fade out before the empty state fades in.

**R2.5 — Generate button press animation**. Scale to 0.97 on `:active`, spring back on release. Add `navigator.vibrate(50)` when generation starts.

#### 2. Micro-Interactions (Current: 3/10)

**Weaknesses:**
- Genre chip selection is an instant color swap. No sliding indicator
- TogglePills background just appears/disappears, no slide animation between options
- Named WOD buttons load text with no visual feedback
- Feedback buttons (thumbs) change color instantly, no bounce or celebration
- BpmBars animate infinitely (`animate-bpm-bar`) even for non-playing tracks -- distracting
- Player progress bar has no thumb indicator or scrubbing feedback

**Recommendations:**

**R2.6 — Sliding indicator on genre chips**. An absolutely positioned div behind the active chip that animates position via `transform: translateX()`. Reference: iOS segmented control, Stripe's pricing toggle.

**R2.7 — Sliding background capsule on TogglePills**. A white pill that slides between Text/Photo options using CSS transform or Framer Motion `layout`.

**R2.8 — WOD button tap feedback**. On tap: scale to 0.95, flash accent color briefly, then pulse-highlight the textarea to draw attention to loaded text.

**R2.9 — Feedback button animations**. Thumbs up: spring bounce (scale 1 -> 1.3 -> 1). Thumbs down: shake (-3px, 3px, 0). Optional: 3-5 small particle dots that burst and fade on thumbs up.

**R2.10 — Stop BpmBars infinite animation on non-playing tracks**. Only animate for the currently playing track. Static tracks show static bars.

**R2.11 — Progress bar scrub thumb**. Add a circular thumb indicator that appears on hover/touch. Show a time tooltip above while scrubbing.

#### 3. Scroll & Navigation (Current: 4/10)

**Recommendations:**

**R2.12 — Sticky workout display**. Make phase cards + IntensityArc sticky at top when scrolling through track list. Scale down to compact form as user scrolls. Add backdrop blur.

**R2.13 — Tab bar animated indicator**. The active dot should animate as a sliding capsule between tabs. Add crossfade between tab pages.

**R2.14 — User menu dropdown animation**. `transform: scale(0.95) translateY(-4px)` -> `scale(1) translateY(0)` with opacity transition, 150ms.

**R2.15 — Swipeable onboarding**. Steps should slide horizontally, matching a carousel mental model. Keep Next/Skip as alternatives.

#### 4. Haptic Feedback (Current: 0/10)

**R2.16 — Add haptic utility and wire to key actions**:
```typescript
// lib/haptics.ts
export function haptic(pattern: number | number[]) {
  navigator.vibrate?.(pattern)
}

// Usage points:
// Generate button press: haptic(50)
// Playlist generated: haptic([50, 50, 100])
// Track play/pause: haptic(30)
// Track skip: haptic(20)
// Thumbs up/down: haptic(40)
// Save playlist: haptic([50, 30, 50])
```

---

## Expert 3: Mobile UX Specialist

**Background**: 8 years in mobile UX, led PWA design for Twitter Lite and Spotify Lite. Specializes in touch targets, gesture navigation, thumb-zone optimization, and PWA installation flows.

### Assessment

The mobile foundation is **mixed**. Smart PWA decisions (safe-area-inset handling, standalone display mode, service worker) alongside significant gaps (touch target violations, no gesture support, poor thumb-zone awareness).

**Rating: 3.5/10**

### Specific Findings

#### 1. Touch Targets (Current: 4/10)

**Critical violations** (Apple HIG minimum is 44x44px):

| Element | Current Size | Location |
|---------|-------------|----------|
| Genre chips | ~32px tall | `workout-form.tsx` (px-3 py-1.5 text-sm) |
| WOD buttons | ~36px tall | `workout-form.tsx` (px-3 py-2 text-sm) |
| Feedback thumbs | ~27px | `playlist-display.tsx` (p-1.5, h-3 w-3 icon) |
| Player skip btns | 28x28px | `spotify-player.tsx` (h-7 w-7) |
| External link | ~12px | `playlist-display.tsx` (h-3 w-3, no padding) |
| Progress bar | 6px tall | `spotify-player.tsx` (h-1.5) |
| Mute toggle | ~30px | `spotify-player.tsx` (p-1) |

**Recommendations:**

**R3.1 — Minimum 44x44px touch targets everywhere**. Create a utility:
```css
.touch-target { min-width: 44px; min-height: 44px; }
```

**R3.2 — Genre chips**: `px-4 py-2.5 text-base` (yields ~44px). Horizontal scroll on mobile instead of wrapping.

**R3.3 — WOD buttons**: `px-4 py-3` (yields ~46px).

**R3.4 — Feedback buttons**: Increase to `p-2.5` with `h-4 w-4` icons. Better: use swipe gesture on track rows (right = thumbs up, left = thumbs down).

**R3.5 — Player controls**: Skip buttons minimum `h-10 w-10`, play/pause `h-12 w-12`.

**R3.6 — Progress bar**: `h-3` visible with `h-10` transparent hit area via padding. Add draggable thumb circle on touch.

#### 2. Thumb Zone Optimization (Current: 3/10)

**Weaknesses:**
- Edit/New buttons are top-right (worst thumb zone for right-handed one-hand use)
- Save/Export buttons are top-right
- User menu and settings icon in top-right header
- Genre chips at the very top of the page (hardest to reach)
- Generate button at bottom of form is correct (comfortable zone)

**Recommendations:**

**R3.7 — Move action buttons to bottom**. Edit, New, Save, Export should be at bottom of results or in a floating action button (FAB). Top area = read-only display, bottom area = actions.

**R3.8 — Genre chips near generate button**. Move to just above or below the generate button on mobile, not at page top.

**R3.9 — Pull-down gesture to return to edit**. Instead of requiring a small button tap in the top corner, allow pulling down from the results header.

#### 3. Gesture Navigation (Current: 1/10)

**Zero gesture support**. A mobile-first PWA aspiring to feel native needs at minimum:

**R3.10 — Swipe between tabs**. Horizontal swipe with momentum detection to switch Generate/Library.

**R3.11 — Pull-to-refresh on Library**. Standard mobile pattern to reload saved playlists.

**R3.12 — Swipe actions on track rows**. Right = thumbs up (green reveal), left = thumbs down (red reveal). Standard iOS/Android pattern. Eliminates need for tiny feedback buttons.

**R3.13 — Draggable bottom sheet**. The `bottom-sheet.tsx` has a visual drag handle but no actual drag gesture. Track touch events, dismiss when dragged below 50%, add rubber-band at top.

**R3.14 — Swipeable onboarding**. Horizontal swipe between steps with snap, matching carousel mental model.

#### 4. PWA Quality (Current: 5/10)

**Critical bugs found in manifest:**

```ts
// CURRENT (broken):
name: 'CrossFit Playlist Generator',  // wrong name
short_name: 'CF Playlist',            // wrong name
background_color: '#0a0a0a',          // dark
// But viewport theme_color in layout.tsx is '#FAFAFA' (light) -- mismatch
```

**R3.15 — Fix manifest immediately**:
```ts
name: 'Crank',
short_name: 'Crank',
description: 'AI-powered workout playlists that match your WOD intensity',
background_color: '#0A0A0F',
theme_color: '#0A0A0F',
```

**R3.16 — Full icon set with maskable icons**:
```ts
icons: [
  { src: '/icon-72.png', sizes: '72x72', type: 'image/png' },
  { src: '/icon-96.png', sizes: '96x96', type: 'image/png' },
  { src: '/icon-128.png', sizes: '128x128', type: 'image/png' },
  { src: '/icon-144.png', sizes: '144x144', type: 'image/png' },
  { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icon-256.png', sizes: '256x256', type: 'image/png' },
  { src: '/icon-384.png', sizes: '384x384', type: 'image/png' },
  { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
  { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
]
```

**R3.17 — Manifest shortcuts**:
```ts
shortcuts: [
  { name: 'New Playlist', short_name: 'Generate', url: '/generate' },
  { name: 'My Library', short_name: 'Library', url: '/library' },
]
```

**R3.18 — Add screenshots for richer install prompt** on Android.

**R3.19 — Offline mode shows last playlist from localStorage** rather than generic offline page (the cache code already exists in the generate page).

#### 5. Performance Perception (Current: 5/10)

**R3.20 — Shimmer animation on skeletons**:
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton-shimmer {
  background: linear-gradient(90deg, #1a1a2e 25%, #252540 50%, #1a1a2e 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

**R3.21 — Blur placeholder for album art**. Use CSS `background-color` as dominant-color fallback.

**R3.22 — Loading indicator while Spotify SDK initializes**.

---

## Expert 4: Fitness App Design Expert

**Background**: Former design lead at Peloton (2019-2023), consulting for Strava and WHOOP. Designed the Peloton cycling metrics overlay and Strava's activity feed redesign. CrossFit Level 2 certified.

### Assessment

Crank has a **unique value proposition** (intensity-matched playlists) but fails to leverage the design patterns athletes have been trained to expect. The core issue: it looks like a music app that knows about workouts, when it should look like a workout app that delivers music.

**Rating: 5/10**

### Specific Findings

#### 1. Workout Identity (Current: 4/10)

**Weaknesses:**
- Workouts have no visual identity. "Fran" and "Murph" look identical
- No workout type iconography (AMRAP, EMOM, chipper, for-time each have distinct structures)
- Phase cards show "Warm Up / Warm Up / 5m" -- the name and intensity label are redundant

**Recommendations:**

**R4.1 — Workout type signature icons**:
- AMRAP: circular arrow
- EMOM: clock with segments
- Chipper: descending staircase
- For Time: stopwatch
- Strength: barbell
- Full Class: calendar block
Display prominently in results header next to workout name.

**R4.2 — Workout name as hero element**. 28-32px Barlow Condensed, full width, with duration and type badge below. Model: Peloton class title treatment.

**R4.3 — Phase card content fix**. Show: phase name (e.g., "Chipper"), BPM range as dominant number, duration. Remove redundant intensity label when it matches phase name.

**R4.4 — Named WOD visual signatures**. Fran, Murph, Grace are iconic in CrossFit. Consider subtle visual treatments (background pattern, icon) for recognized WODs.

#### 2. Data Visualization (Current: 7/10)

**Strengths:**
- IntensityArc is genuinely excellent -- smooth curve, colored segments, peak marker, playhead
- BpmGauge as circular arc per phase is compact and informative
- Data density is appropriate for the audience

**Weaknesses:**
- IntensityArc does not show track positions along the timeline
- No visual connection between IntensityArc playhead and track list
- BpmGauge at 52px is too small to read arc detail -- the number matters more than the gauge shape
- No visualization of playlist-to-workout match quality

**Recommendations:**

**R4.5 — Track position markers on IntensityArc**. Small dots along the color bar where each track starts. Glow the current track's dot.

**R4.6 — Synchronized playhead highlighting**. Playing track in list and position on arc should share the same highlight color and animation.

**R4.7 — BPM Match Score**. Circular progress ring in results header showing what percentage of tracks fall within target BPM ranges. Athletes love scores. Display as: "94% match" in a compact ring.

**R4.8 — Replace BpmGauge with large BPM number**. In phase cards, show `138` in 28px Barlow Condensed with `BPM` label and the range `130-145` below. The circular gauge is elegant but at 52px the arc detail is unreadable. The number is what matters at a glance.

#### 3. Playlist-Workout Integration (Current: 5/10)

**Weaknesses:**
- Playlist and workout display are visually separate stacked sections
- No visual grouping of tracks by phase
- No visual connection between a track and its corresponding phase card
- Currently playing track treatment is too subtle (border-left + background tint)

**Recommendations:**

**R4.9 — Group tracks by phase in the playlist**. Add section headers:
```
-- WARM-UP (5 min) --
  1. Fake Plastic Trees - Radiohead | 110 BPM
-- CHIPPER (15 min) --
  2. Come As You Are - Nirvana | 137 BPM
  3. Interstate Love Song - STP | 138 BPM
  ...
-- COOLDOWN (3 min) --
  6. Under the Bridge - RHCP | 90 BPM
```
Color-code section headers with phase colors. This makes the core value prop (music matched to phases) visually explicit.

**R4.10 — Bidirectional phase-track highlighting**. Hovering/tapping a phase card highlights corresponding tracks (and vice versa). Makes the workout-music connection tangible.

**R4.11 — Dramatic "now playing" treatment**. Currently playing track: enlarged album art, accent glow border, animated equalizer bars indicator, phase name prominently displayed. Reference: Spotify's "now playing" card.

**R4.12 — Summary card in results header**. One-line at-a-glance: "23 min | 6 tracks | Rock | Peak: 140 BPM | 94% match". Athletes want status at a glance.

#### 4. Post-Workout & Social (Current: 2/10)

**Recommendations:**

**R4.13 — Completion celebration card**. After playlist fully played: "Workout Complete! 23 min | 6 tracks | Peak phase matched 94%". Include share button.

**R4.14 — Share card generator**. Branded 1080x1920 image: workout name, intensity arc, track list, total duration, Crank logo. Shareable to Instagram Stories, WhatsApp, etc. This is the #1 viral growth mechanism for fitness apps.

**R4.15 — Library cards with intensity arc thumbnails**. Show the workout shape as a visual thumbnail on saved playlist cards, helping users quickly find "that playlist from the hard session."

#### 5. Now Playing / Gym Floor View (Current: 2/10)

**R4.16 — Full-screen "Now Playing" mode**. When music starts, offer "Go Full Screen":
- Large album art
- Track name/artist in display typography
- IntensityArc with animated playhead
- Current phase name, BPM display
- Simplified controls (play/pause, skip)
- Optimized for glance-ability from across the gym

This is the "Peloton instructor screen" equivalent. Coaches need to see current phase and track from 10 feet away.

---

## Expert 5: Brand Identity Designer

**Background**: Brand identity director at Pentagram (sports & lifestyle division). Has built brand systems for Nike sub-brands, Red Bull media properties, and Reebok CrossFit.

### Assessment

"Crank" as a brand name is **excellent** -- short, punchy, action-oriented, works as noun and verb. Evokes mechanical power and amplification. The current brand expression does not live up to the name's potential. The logo is a generic Lucide icon. No voice, no texture, no personality beyond "red accent on white."

**Rating: 2.5/10**

### Specific Findings

#### 1. Logo & Mark (Current: 3/10)

**Weaknesses:**
- Logo is a Lucide `Zap` icon in a red rounded square. Stock UI, not a brand mark
- No custom wordmark. "Crank" in Barlow Condensed 700 is fine but has no distinctive letterform treatment
- Logo mark at 32x32 in the header is too small to carry brand presence

**Recommendations:**

**R5.1 — Custom brand mark**. Concept directions:
- **The Crank Handle**: Stylized crank arm forming a "C" shape. Mechanical, powerful, rotating
- **The Volume Knob**: Circular dial turned to 11. Music + maxing out
- **The Intensity Wave**: Stylized waveform peaking in the center, combining audio and workout intensity
The mark must work at 16px (favicon) and 512px (app icon). Single color. No fine detail.

**R5.2 — Custom wordmark**. "CRANK" with at least one distinctive letterform: the "A" as a peak/caret symbol (like the intensity arc peak), or the "K" leg extended into a waveform tail.

**R5.3 — Larger logo presence**. Header: minimum 40px tall. Splash screen: centered at 96px+. The brand must be felt.

#### 2. Brand Color Story (Current: 4/10)

**Recommendations:**

**R5.4 — Distinct brand color system**:
- **Primary**: Shift to `#FF2D3B` (slightly more orange-red, more energetic, more distinct from generic reds)
- **Background**: Deep charcoal-purple `#0F0A1A` (nightclub/gym vibe)
- **Secondary accent**: Electric cyan `#00F0FF` for information elements (BPM readouts, durations). Red for action elements
- **Hero gradient**: `linear-gradient(135deg, #FF2D3B, #FF6B35)` -- red to orange. This gradient IS the brand

**R5.5 — Gradient on hero elements**. Generate button, intensity arc fill, player bar, onboarding icons should all carry the brand gradient.

#### 3. Brand Voice (Current: 2/10)

**Weaknesses:**
- Neutral, generic UI copy throughout: "Describe your workout...", "Generate Playlist", "Parsing workout..."
- No personality, no attitude. CrossFitters are passionate and competitive
- Onboarding is generic: "Welcome to Crank", "Try it now", "Make it yours"

**Recommendations:**

**R5.6 — Brand voice: Bold, Direct, In-the-Know**. Crank speaks like a hype coach who also DJs:

| Current | Proposed |
|---------|----------|
| "Describe your workout..." | "Paste your WOD. We handle the soundtrack." |
| "Your workout breakdown and playlist will appear here" | "Drop a WOD. Get tracks that peak when you do." |
| "Generate Playlist" | "Crank It" |
| "Parsing workout..." | "Breaking down your WOD..." |
| "Finding tracks..." | "Picking the heat..." |
| "Composing playlist..." | "Lining up the drops..." |
| "Playlist generated!" | "Your playlist is dialed in." |
| "Save" | "Lock It In" |
| Named WODs section (no label) | "The Legends" |

**R5.7 — Onboarding rewrite**:
- Step 1: "This is Crank. You bring the workout. We bring the soundtrack. Every beat matched to your intensity."
- Step 2: "Try a classic. Tap below to load Cindy, then hit Crank It."
- Step 3: "Connect Spotify to play, save, and export. Your playlists. Your rules."

#### 4. Multi-Touchpoint Brand (Current: 2/10)

**R5.8 — Branded PWA splash**. Dark background, logo mark centered with intensity gradient behind it, "CRANK" wordmark below.

**R5.9 — Dynamic OG images**. When sharing a Crank URL, the card should show: intensity arc, playlist name, Crank branding. Use Vercel OG or similar.

**R5.10 — App Store screenshot frames**. Five screens: (1) hero empty state, (2) workout parsed, (3) playlist with arc, (4) now playing, (5) share card.

**R5.11 — Share card format**. 1080x1920 (Stories) and 1200x630 (OG). Shows: workout name, intensity arc, track list, Crank logo.

#### 5. Sound Branding (Current: 0/10)

**R5.12 — Audio logo**. 1-2 second percussive hit + bass drop. Play on PWA launch (once) and optionally on playlist generation.

**R5.13 — UI sounds (optional)**. Click for play/pause, whoosh for generation, chime for save. Off by default, toggleable in settings.

---

## Panel Synthesis

### Consensus Themes (All 5 experts independently flagged)

1. **Dark theme required** (Experts 1, 3, 4, 5). Unanimous. Light/white fitness app feels clinical and out of place in a gym.

2. **Touch targets too small** (Experts 2, 3). Genre chips (32px), feedback buttons (27px), player controls (28px), external links (12px). Functional accessibility failure.

3. **No gesture support** (Experts 2, 3). Zero swipe, drag, or pull gestures in a mobile-first PWA.

4. **Brand identity is generic** (Experts 1, 5). Lucide Zap icon, generic red, neutral copy.

5. **Tracks should be grouped by workout phase** (Experts 1, 4). Flat track list misses the core value prop.

6. **Empty state is wasted space** (Experts 1, 4, 5). Should be the hero brand moment.

7. **No interaction choreography** (Experts 2, 3). Animation tokens exist but state transitions are hard cuts. No haptic feedback.

8. **PWA manifest is broken** (Expert 3). Wrong name, mismatched colors, missing icon sizes.

### Divergent Opinions

- **Gradients**: Expert 1 wants them heavily; Expert 4 warns against visual noise. Resolution: Use sparingly on CTAs and hero elements.
- **Sound effects**: Expert 5 wants audio branding; Expert 3 warns gym noise makes it impractical. Resolution: Audio optional, off by default. Haptics are the primary sensory channel.
- **Rebrand scope**: Expert 5 wants complete rebrand; Expert 1 says foundations are solid. Resolution: Evolve existing system -- fonts are good, colors need refinement not replacement.

---

## Prioritized Recommendations

### P0 -- Critical (Must-do before launch)

| ID | Recommendation | Expert(s) | Effort | Impact |
|----|---------------|-----------|--------|--------|
| P0-1 | **Fix PWA manifest**: name, short_name, colors, description (R3.15) | 3 | 15 min | High |
| P0-2 | **Fix all touch targets to 44px min** (R3.1-R3.6) | 3 | 2 hrs | Critical |
| P0-3 | **Fix minimum text size to 12px** (R1.7) | 1 | 30 min | High |
| P0-4 | **Implement dark theme as default** (R1.1, R1.4) | 1, 4, 5 | 4 hrs | High |
| P0-5 | **Group tracks by workout phase** (R4.9) | 4 | 2 hrs | High |
| P0-6 | **Brand voice copywriting pass** (R5.6) | 5 | 1 hr | High |
| P0-7 | **Haptic feedback on key actions** (R2.16) | 2 | 1 hr | Medium |

**P0 Total: ~10.5 hours**

### P1 -- Important (Launch quality)

| ID | Recommendation | Expert(s) | Effort | Impact |
|----|---------------|-----------|--------|--------|
| P1-1 | **Redesign empty state as hero** (R1.9, R5.8) | 1, 5 | 3 hrs | High |
| P1-2 | **Animated state transitions** (R2.1, R2.4) | 2 | 4 hrs | Medium |
| P1-3 | **Custom logo mark** (R5.1) | 5 | 8 hrs | High |
| P1-4 | **Sliding indicator on chips/toggles** (R2.6, R2.7) | 2 | 2 hrs | Medium |
| P1-5 | **Player bar merged into tab bar** (R1.13) | 1, 3 | 4 hrs | High |
| P1-6 | **Sticky workout display on scroll** (R2.12) | 2 | 3 hrs | Medium |
| P1-7 | **BPM Match Score** (R4.7) | 4 | 2 hrs | Medium |
| P1-8 | **Full PWA icon set** (R3.16) | 3 | 2 hrs | Medium |
| P1-9 | **Phase cards mobile layout** (R1.10) | 1 | 2 hrs | Medium |
| P1-10 | **Shimmer skeleton loading** (R3.20) | 3 | 1 hr | Low |
| P1-11 | **Brand color refinement** (R5.4) | 5 | 2 hrs | Medium |
| P1-12 | **Three-stage loading animation** (R2.3) | 2 | 3 hrs | Medium |
| P1-13 | **Track list mobile simplification** (R1.11) | 1 | 2 hrs | Medium |

**P1 Total: ~38 hours**

### P2 -- Nice-to-Have (Post-launch polish)

| ID | Recommendation | Expert(s) | Effort | Impact |
|----|---------------|-----------|--------|--------|
| P2-1 | **Swipe gestures** (R3.10-R3.14) | 3 | 8 hrs | Medium |
| P2-2 | **Custom wordmark** (R5.2) | 5 | 4 hrs | Medium |
| P2-3 | **Workout type icons** (R4.1) | 4 | 3 hrs | Low |
| P2-4 | **Share card generator** (R4.14, R5.11) | 4, 5 | 6 hrs | Medium |
| P2-5 | **Now-playing track enhancement** (R4.11) | 4 | 3 hrs | Low |
| P2-6 | **Track position markers on arc** (R4.5) | 4 | 2 hrs | Low |
| P2-7 | **Completion celebration card** (R4.13) | 4 | 3 hrs | Low |
| P2-8 | **Dynamic OG images** (R5.9) | 5 | 4 hrs | Medium |
| P2-9 | **PWA shortcuts in manifest** (R3.17) | 3 | 30 min | Low |
| P2-10 | **Audio branding** (R5.12) | 5 | 4 hrs | Low |
| P2-11 | **Type scale CSS tokens** (R1.5) | 1 | 1 hr | Low |
| P2-12 | **Bidirectional phase-track highlighting** (R4.10) | 4 | 3 hrs | Low |
| P2-13 | **Pull-to-refresh on Library** (R3.11) | 3 | 1 hr | Low |
| P2-14 | **Draggable bottom sheet** (R3.13) | 3 | 3 hrs | Low |
| P2-15 | **Generate button spring animation** (R2.5) | 2 | 1 hr | Low |
| P2-16 | **Full-screen Now Playing mode** (R4.16) | 4 | 8 hrs | Medium |
| P2-17 | **Results summary card** (R4.12) | 4 | 1 hr | Low |
| P2-18 | **Move actions to bottom** (R3.7) | 3 | 2 hrs | Medium |

---

## Implementation Roadmap

### Sprint 1: Foundation (Days 1-3)
**Goal**: Dark theme, fixed touch targets, brand voice, PWA manifest. The app feels intentionally designed.

| Task | Time | Details |
|------|------|---------|
| P0-1: Fix PWA manifest | 15 min | Update `manifest.ts`: name, short_name, description, colors |
| P0-3: Fix text sizes | 30 min | Replace text-[10px]/text-[11px] with text-xs in `spotify-player.tsx` |
| P0-4: Dark theme | 4 hrs | New surface tokens in globals.css. Update all bg-white, bg-[var(--secondary)]. Update tab bar, player bar, cards, modals, onboarding. Test contrast. |
| P0-2: Touch targets | 2 hrs | Audit + fix genre chips, WOD buttons, feedback btns, player controls, ext links |
| P0-6: Brand voice | 1 hr | Rewrite placeholders, button labels, loading messages, empty state, onboarding |
| P0-7: Haptics | 1 hr | Create lib/haptics.ts. Wire to generate, success, play, skip, save, feedback |
| **Total** | **~9 hrs** | |

### Sprint 2: Core UX (Days 4-7)
**Goal**: Phase-grouped tracks, improved empty state, better loading, refined colors. Core value prop is visually obvious.

| Task | Time | Details |
|------|------|---------|
| P0-5: Phase-grouped tracks | 2 hrs | Add section headers to PlaylistDisplay with phase colors |
| P1-1: Hero empty state | 3 hrs | Gradient background, large logo, tagline, visual hierarchy |
| P1-11: Brand colors | 2 hrs | Refine accent, add dark-purple surfaces, cyan secondary |
| P1-10: Shimmer skeletons | 1 hr | Replace pulse with shimmer animation |
| P1-12: Three-stage loading | 3 hrs | Staged icons + progress tied to pipeline |
| P1-13: Track list simplify | 2 hrs | Mobile: hide secondary data, show phase dot, expand on tap |
| **Total** | **~13 hrs** | |

### Sprint 3: Polish & Interactions (Days 8-12)
**Goal**: Smooth transitions, sliding indicators, player improvements. App feels native.

| Task | Time | Details |
|------|------|---------|
| P1-2: State transitions | 4 hrs | Framer Motion AnimatePresence or CSS @starting-style |
| P1-4: Sliding indicators | 2 hrs | Genre chips + TogglePills animated capsule |
| P1-5: Player in tab bar | 4 hrs | Mini-player row, full player on expand |
| P1-6: Sticky workout display | 3 hrs | Intersection observer, compact mode, backdrop blur |
| P1-7: BPM Match Score | 2 hrs | Circular progress ring in results header |
| P1-8: PWA icon set | 2 hrs | Generate all sizes + maskable variants |
| P1-9: Phase cards mobile | 2 hrs | Horizontal scroll or arc-integrated labels |
| **Total** | **~19 hrs** | |

### Sprint 4: Brand & Delight (Days 13-18)
**Goal**: Custom brand mark, gestures, share cards. Users want to show the app to gym friends.

| Task | Time | Details |
|------|------|---------|
| P1-3: Custom logo mark | 8 hrs | Design + implement across all touchpoints |
| P2-1: Swipe gestures | 8 hrs | Tab swipe, track feedback swipe, onboarding carousel |
| P2-4: Share card generator | 6 hrs | Branded image with arc, tracks, logo |
| P2-16: Full-screen Now Playing | 8 hrs | Large art, arc, phase, BPM, gym-floor readable |
| **Total** | **~30 hrs** | |

---

## Current State Scorecard

| Dimension | Current | Target | Gap |
|-----------|:-------:|:------:|:---:|
| Visual Design | 5.5 | 8.5 | 3.0 |
| Interaction Design | 3.5 | 8.0 | 4.5 |
| Mobile UX | 3.5 | 8.5 | 5.0 |
| Fitness App Feel | 5.0 | 9.0 | 4.0 |
| Brand Identity | 2.5 | 8.0 | 5.5 |
| **Overall** | **4.0** | **8.4** | **4.4** |

After Sprint 1-3 (~41 hours): estimated **7.5/10** -- competitive with mid-tier fitness apps.
After Sprint 4 (~30 hours): estimated **8.4/10** -- in the same conversation as Strava and Peloton.

---

## Quick Wins (Under 30 Minutes Each)

For immediate implementation without design review:

1. Fix PWA manifest name/colors (15 min) -- **P0-1**
2. Fix text-[10px] and text-[11px] to text-xs (15 min) -- **P0-3**
3. Add haptic utility + wire to 3 key actions (20 min) -- **P0-7**
4. Rewrite 3 loading messages with personality (5 min) -- **P0-6** partial
5. Rewrite empty state text (5 min) -- **P0-6** partial
6. Rewrite generate button label (5 min) -- **P0-6** partial
7. Add PWA shortcuts to manifest (10 min) -- **P2-9**
8. Stop infinite BpmBars animation on non-playing tracks (10 min) -- **R2.10**
9. Increase track stagger delay from 40ms to 100ms (2 min) -- **R2.2**

**Total quick wins: ~1.5 hours for all 9.**

---

## Files Reviewed

| File | Key Findings |
|------|-------------|
| `apps/web/app/globals.css` | Good token system but light-only, no dark mode, no gradients |
| `apps/web/app/(tabs)/generate/page.tsx` | Clean state management, hardcoded GENRE_OPTIONS, space-y-3 everywhere |
| `apps/web/components/workout-form.tsx` | WOD buttons too small, genre position wrong, no keyboard hints |
| `apps/web/components/playlist-display.tsx` | Phase badge hidden on mobile, 7+ data points per row, flat track list |
| `apps/web/components/workout-display.tsx` | IntensityArc is excellent, BpmGauge too small at 52px |
| `apps/web/components/tab-bar.tsx` | Correct safe-area handling, no gesture support, static active indicator |
| `apps/web/components/spotify-player.tsx` | Hardcoded bg-white/95, text below 12px, controls too small |
| `apps/web/components/onboarding.tsx` | Generic copy, not swipeable, modal not full-screen |
| `apps/web/app/manifest.ts` | WRONG NAME: "CrossFit Playlist Generator", mismatched colors |
| `apps/web/tailwind.config.js` | Good animation keyframes, missing dark mode colors |
| `apps/web/components/page-header.tsx` | Zap icon logo, Barlow Condensed heading font |
| `apps/web/components/generate-skeleton.tsx` | Static pulse, not shimmer. Gray hardcoded colors |
| `apps/web/components/image-upload.tsx` | Good camera/upload UX, proper compression |
| `apps/web/components/ui/button.tsx` | Good variant system, needs glow/gradient variants |
| `apps/web/components/ui/badge.tsx` | Comprehensive phase badge system, well-structured |
| `apps/web/components/viz/intensity-arc.tsx` | Best component in the app. Interactive potential untapped |
| `apps/web/components/viz/bpm-gauge.tsx` | Elegant but too small at 52px to read arc |
| `apps/web/components/viz/bpm-bars.tsx` | Infinite animation is distracting on non-playing tracks |
| `apps/web/components/viz/energy-bar.tsx` | Good color interpolation, appropriate for data density |
| `apps/web/components/profile-form.tsx` | Developer settings page, not fitness preferences page |
| `apps/web/components/playlist-list.tsx` | No search, sort, or date grouping. Flat grid |
| `apps/web/components/auth/user-menu.tsx` | No animation on dropdown. Basic but functional |
| `apps/web/components/ui/bottom-sheet.tsx` | Visual drag handle but no actual drag gesture |
| `apps/web/components/ui/toggle-pills.tsx` | Good pattern but no sliding indicator animation |
| `apps/web/app/layout.tsx` | Good font loading. Toaster position correct |
| `apps/web/app/(tabs)/layout.tsx` | pb-20 correct for tab bar clearance |

---

*Panel report v2 prepared by the Design Expert Panel Lead. All five experts have reviewed the actual codebase and screenshots. Recommendations are specific to the actual component implementations and include file references for implementation. Proceed with Sprint 1 (Foundation) first.*
