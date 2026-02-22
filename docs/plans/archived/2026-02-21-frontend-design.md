# Frontend Design — Crank

**Date**: 2026-02-21
**Status**: Approved
**Scope**: All phases (0–3), 29 screens

---

## Brand & Visual System

### Name

**Crank** — "Crank up the music. Crank out the reps."

### Design Direction

Based on Approach B (Gym Dashboard): Whoop-style data visualization meets Linear's clean information density. Dense, information-rich, everything visible on one screen on iPad.

### Palette

- **Base**: #FAFAFA (light gray)
- **Text**: #111111 (near-black)
- **Accent**: Deep coral/red (#E63946) — generate button, active states, key CTAs
- **Phase colors**:
  - Warm-up: Blue (#3B82F6)
  - Low: Emerald (#10B981)
  - Moderate: Amber (#F59E0B)
  - High: Orange (#F97316)
  - Very High / WOD: Red (#EF4444)
  - Cooldown: Purple (#8B5CF6)
- **HR Zone colors**:
  - Zone 1 (50–60% max): Light gray — Recovery
  - Zone 2 (60–70%): Blue — Easy
  - Zone 3 (70–80%): Green — Moderate
  - Zone 4 (80–90%): Amber — Hard
  - Zone 5 (90–100%): Coral/red — Max

### Typography

- **Headings / Body**: Plus Jakarta Sans (Google Fonts)
- **Numbers / Data**: JetBrains Mono (Google Fonts) — all BPM, durations, percentages, timers, stats
- **No generic fonts**: Inter, Roboto, Arial, and system fonts are not used

### Logo

Simple, clean mark — a stylized play/power icon or waveform. Not the "WD PULSE" style from the Approach B mockup. Minimal, works at small sizes in the tab bar and header.

### Layout Principles

- iPad-first (1024x768), then mobile
- Coach experience: iPad or mobile equally
- Attendee experience: Mobile-first
- No scrolling on the core generate results screen (iPad)
- Card-based, dense but breathable
- Bottom tab bar navigation

### Motion

- Data-driven transitions: bars fill, gauges sweep, numbers count up
- Staggered entry animations for phase cards and track rows
- Subtle scale/shadow on hover for interactive elements
- Real-time data: smooth counting transitions, sparkline drawing, zone color fading

---

## Navigation

### Coach Tab Bar (4 tabs)

| Tab | Icon | Description |
|-----|------|-------------|
| Generate | Lightning bolt | Workout input, parsing, playlist generation |
| Library | Bookmark | Saved playlists, search, management |
| Classes | Calendar | Schedule, manage, run live classes |
| Profile | User circle | Preferences, stats, devices, AI insights |

### Attendee Tab Bar (4 tabs)

| Tab | Icon | Description |
|-----|------|-------------|
| Classes | Calendar | Upcoming/past classes, RSVP, feedback |
| Music | Music note | Taste profile, liked tracks, influence |
| Stats | Bar chart | Leaderboards, achievements, personal metrics |
| Profile | User circle | Preferences, devices, settings |

---

## Phase 0: Core Generate Flow

### Screen 0.1 — Generate: Empty State

First visit. The Generate tab before any workout is entered.

- **Header**: "Crank" logo mark + name (top-left). Music source badge (top-right): "MOCK" or "SPOTIFY"
- **Input area**: Text/Photo toggle pills (Text active by default). Large textarea with placeholder: "Paste your workout here — AMRAP, EMOM, RFT, Tabata..."
- **Example chips**: Below textarea. 4 tappable chips: "21-15-9 Fran", "20 min AMRAP", "EMOM 12 min", "Tabata". Tap fills the textarea.
- **Generate button**: Deep coral, full-width, solid. Disabled/muted until input is provided.
- **Empty area below**: Subtle message: "Your workout breakdown and playlist will appear here" with a faint waveform graphic. Phases and playlist areas are hidden.

### Screen 0.2 — Generate: Loading State

After tapping Generate.

- **Input area**: Collapses to compact summary showing workout text (not editable during generation)
- **Generate button**: Transforms to progress indicator — coral bar animating left-to-right. Text: "Parsing workout..." → "Finding tracks..." → "Composing playlist..."
- **Below**: Skeleton loaders (pulsing gray rectangles) matching the phase cards and track list layout

### Screen 0.3 — Generate: Results

The primary screen. Everything visible on one iPad screen without scrolling.

- **Input area**: Compact, shows workout text with "Edit" / "New" button to start over
- **Workout Phases**: 3 cards in a horizontal row. Each card:
  - Phase name and duration
  - SVG circular BPM gauge with animated stroke (fill proportional to BPM range)
  - BPM range bar with animated fill
  - Colored left border matching phase color
- **Intensity Arc**: Below the phase cards. SVG visualization showing the full workout intensity curve. Gradient coloring (blue → red → green), grid lines, phase dividers, PEAK marker.
- **Generated Playlist**: Dense track table. Each row:
  - Track number (monospace)
  - Track name + artist
  - Mini BPM bar visualization (animated vertical bars) + monospace BPM number
  - Energy percentage with animated fill bar
  - Duration (monospace)
  - Color-coded phase badge (WARM-UP / WOD / COOLDOWN)
- **Animations**: Phase cards scale in (staggered), intensity arc draws left-to-right, track rows slide in sequentially

### Screen 0.4 — Generate: Photo Input Variant

When user toggles to Photo mode.

- **Camera/upload area**: Replaces textarea. Large dashed-border drop zone with camera icon. Two buttons: "Take Photo" (prominent on iPad) and "Upload Image"
- **Optional context field**: Small textarea below: "Add context (optional)"
- **Image preview**: After capture, shows thumbnail with X to remove. Generate button activates.
- **Image specs**: Compressed to max 1MB, max 1568px dimension (Claude Vision requirements)

---

## Phase 1: Coach Profiles & Library

### Screen 1.1 — Auth: Login / Signup

Full-screen modal overlaying the app.

- **Layout**: Centered card on dimmed background. Crank logo + tagline: "Crank — music that moves with you"
- **Modes**: Login / Sign up toggle
- **Login fields**: Email, password. "Sign in" coral button. "Forgot password?" link.
- **Social auth**: Divider "or". Google + Apple buttons (outlined/secondary style).
- **Sign up fields**: Name, email, password. Same social auth.
- **Post-signup**: Routes to profile setup (Screen 1.2)

### Screen 1.2 — Coach Profile Setup (Onboarding)

Multi-step stepper. Shown once after signup. Also accessible from Profile tab.

- **Step 1 — Basics**: Display name, gym name (optional)
- **Step 2 — Genres**: Multi-select chip grid: Rock, Metal, Hip-Hop, Electronic, Pop, Country, Punk, Indie, R&B, Latin, Classical. Outlined when inactive, coral-filled when selected. Minimum 1 required.
- **Step 3 — Fine-tuning**:
  - Minimum energy level: Slider from Chill (0.3) to Intense (1.0), default 0.5
  - Explicit content: Toggle switch, default off
  - Excluded artists: Text input with tag chips
- **Step 4 — Connect Spotify** (optional): Spotify-green connect button. "Skip for now" link. Benefit text: "Connect to create playlists directly in your Spotify library"
- **Navigation**: Back/Next buttons. Step indicator dots. Can skip ahead.

### Screen 1.3 — Library: Saved Playlists

Second tab (Library). Grid of saved playlists.

- **Header**: "Library" title. Sort/filter icon (top-right).
- **Search**: Compact search field: "Search playlists..."
- **Playlist cards**: 2-column grid (iPad), 1-column (phone). Each card:
  - Playlist name (editable via pencil icon)
  - Workout text snippet (first line, truncated)
  - Date created (monospace)
  - Track count + total duration (monospace)
  - Mini intensity arc (tiny colored bar, no labels)
  - Coral play icon overlay
- **Empty state**: "Playlists you save will appear here" with link to Generate tab
- **Swipe actions**: Swipe left reveals Delete (red) and Duplicate (gray)

### Screen 1.4 — Playlist Detail

Tapping a saved playlist from Library.

- **Top**: Playlist name (large, editable), workout text (collapsible), creation date
- **Workout phases**: Phase cards + intensity arc (read-only, same as generate results)
- **Track list**: Dense table with additional per-track controls:
  - Swap button: Opens track search sheet (Screen 1.5)
  - Thumbs up/down: Inline feedback icons
  - Drag handle: Left edge for drag-to-reorder
- **Action bar**: "Regenerate" (ghost), "Export to Spotify" (coral, if connected), "Share" (icon)
- **Back**: Arrow to Library

### Screen 1.5 — Track Search / Swap (Bottom Sheet)

Bottom sheet, ~70% screen height. Opened from swap button on a track.

- **Context header**: "Replace: [Track Name]" with phase badge and BPM range: "Target: 160-175 BPM"
- **Search field**: Auto-focused: "Search tracks..."
- **Results**: Tracks matching phase BPM range:
  - Track name, artist
  - BPM (monospace) with color: green (in range), amber (close), red (far)
  - Energy bar
  - Preview play button (30-second preview if Spotify connected)
- **Selection**: Tap to replace. Sheet dismisses. Replaced row highlights coral briefly.

### Screen 1.6 — Track Feedback (Inline)

Not a separate screen. Integrated into track list rows.

- **Thumbs up/down**: Two small icons per row. Default: gray/outlined. Tapped: coral (up), muted (down).
- **Boost indicator**: After thumbs-up, small upward arrow appears — track is "boosted" for future generations at this BPM range.
- **Behavior**: Feeds into MusicCuratorAgent scoring. Thumbs up = higher weight, thumbs down = deprioritized.

### Screen 1.7 — Profile: Preferences & Stats

Fourth tab (Profile). Combines settings with analytics.

- **Top**: Coach name, gym name, avatar (tappable). "Edit Profile" link.
- **Preferences summary**: Genre chips (tappable to edit), energy slider value, explicit toggle. Each opens inline editing.
- **Stats section**:
  - Top Artists: Horizontal scrollable row with play counts (monospace)
  - Genre Distribution: Donut or horizontal stacked bar chart
  - Playlists Generated: Large monospace number + trend ("23 playlists, +5 this week")
  - Most Boosted Tracks: Top 3-5 as a mini list
- **Bottom**: "Sign out" link, "Connected: Spotify" status with disconnect option

---

## Phase 2: Multi-User Sessions

### Coach Screens

#### Screen 2.1 — Classes: Upcoming

Third tab (Classes). Calendar/list hybrid.

- **Header**: "Classes" title. Coral "+ New Class" button (top-right).
- **View toggle**: "Upcoming" / "Past" pills. Upcoming default.
- **Date grouping**: Sticky date headers in monospace: "MON 24 FEB"
- **Class cards**:
  - Time (large monospace, e.g., "06:00")
  - Workout name/snippet
  - Avatar stack + count: "8 attending" (monospace)
  - Playlist status badge: "No playlist" (gray), "Playlist ready" (green), "Generating..." (coral pulse)
  - RSVP deadline indicator if set
- **Tap**: Opens class detail (Screen 2.3)
- **Empty state**: "Schedule your first class" with illustrated "+" button

#### Screen 2.2 — Create Class (Bottom Sheet)

Bottom sheet, ~80% screen height. Opened from "+ New Class".

- **Date & Time**: Native pickers (side by side on iPad)
- **Workout**: Text field. "Use saved" option picks from Library. Pasting shows inline phase preview.
- **Invite attendees**: Email input with tag chips. "Copy invite link" button.
- **RSVP deadline** (optional): Date picker, defaults to 2 hours before class.
- **Music preferences**: Toggle — "Use my preferences only" (default) / "Aggregate with attendees". Aggregation shows coach/attendee weight slider (default 60/40).
- **Actions**: "Schedule Class" (coral), "Save as draft" (ghost).

#### Screen 2.3 — Class Detail (Coach)

Full screen within Classes tab.

- **Top**: Date/time (large monospace), workout text (collapsible), edit icon
- **Attendees**:
  - List: Avatar, name, RSVP badge ("Confirmed" green, "Pending" amber, "Declined" muted)
  - Confirmed attendees with prefs show tiny genre chips
  - "Invite more" link
- **Playlist**:
  - No playlist: "Generate Playlist" coral button with note about preference source
  - Playlist exists: Compact intensity arc + track list. "Regenerate" and "Export to Spotify" buttons.
  - Spotify connected: "Push to Spotify" button. Status: "Live on Spotify" green dot.
- **Actions**: "Start Class" (coral, enables Phase 3 live mode), "Cancel Class" (ghost with confirmation)
- **Back**: Arrow to Classes list

#### Screen 2.4 — Class History

"Past" view on Classes tab.

- **Same card layout as upcoming** but with completed data:
  - Date + time (monospace)
  - Workout name
  - "8 attended"
  - Feedback summary: "4.2 ★" (monospace)
  - Mini intensity arc
- **Tap**: Opens past class detail (read-only Screen 2.3 + feedback summary showing aggregate track ratings)

### Attendee Screens

#### Screen 2.5 — Attendee Onboarding

Simpler than coach. After signup:

- **Step 1 — Basics**: Name only
- **Step 2 — Music taste**: Genre chip multi-select. Framing: "What do you like to work out to?"
- **Step 3 — Connect Spotify** (optional): Same as coach. If connected, auto-imports top artists/genres as additional chips: "We pulled these from your Spotify — adjust if needed"
- **Done**: Routes to Classes tab

#### Screen 2.6 — Attendee Classes Tab

Primary attendee screen.

- **Next Up**: Highlighted card for nearest class. Large: date/time, workout, coach name, gym, attendee count. RSVP button.
- **Upcoming**: List of future class cards (no management controls)
- **Past**: Compact list with "Leave feedback" badge if window open
- **Card content**: Coach name + gym, date/time (monospace), workout snippet, "View Playlist" if published, RSVP status button ("Going" green / "Can't make it" outlined / "Pending" amber)

#### Screen 2.7 — Attendee Class Detail

Tapping a class card.

- **Top**: Coach name, gym, date/time, workout text
- **RSVP**: Large toggle buttons — "I'm going" / "Can't make it"
- **Playlist** (if published): Full track list (read-only). "Open in Spotify" button. Thumbs up/down on tracks (feeds coach learning system).
- **Preference notice**: "Your music preferences influenced this playlist" (if aggregation on)

#### Screen 2.8 — Post-Class Feedback (Attendee)

Full-screen flow from past class cards. Available during feedback window.

- **Header**: Class date + workout name
- **Track-by-track**: Each track as a card:
  - Track name, artist, phase badge
  - 5-star rating (tappable) OR quick thumbs up/down (toggleable mode)
  - Optional comment (collapsed, "Add comment" expands)
- **Overall**: "How was the music overall?" with 5 stars
- **Submit**: Coral button. Confirmation: "Thanks! Your feedback helps future playlists." Badge clears.
- **Skip**: "Skip feedback" ghost link

#### Screen 2.9 — Attendee Music Tab

Second attendee tab.

- **My Taste**: Genre chips (editable), Spotify connection status
- **My Influence**: Visualization of how preferences affected recent playlists: "3 tracks in last week's classes matched your taste"
- **Liked Tracks**: List of thumbs-up'd tracks across all classes. Tappable to open in Spotify.
- **Feel**: Lighter than coach analytics. Less data-dense, more encouraging.

---

## Phase 3: Real-Time Biometrics

### Setup Screens

#### Screen 3.1 — Wearable Connection

Profile tab → "Connected Devices". Settings-style list.

- **Device cards** (stacked):
  - Apple Watch: Apple logo, "Apple Health". Status: "Connected" (green dot) / "Connect" (coral button). Connected shows last sync time + permissions.
  - Whoop: Whoop logo, "Whoop Band". Same pattern. OAuth flow.
  - Fitbit: Same pattern.
- **Connected detail**: "Sharing: Heart Rate · Activity" with per-type toggles
- **Privacy card**: "Your biometric data is only shared during classes you opt into. Data is encrypted and never sold." Lock icon.
- **Per-class consent note**: "You'll be asked to confirm sharing before each class starts"

#### Screen 3.2 — Pre-Class Device Check (Modal)

Shown when attendee joins a biometric-enabled class.

- **Modal**: Centered card, dimmed background
- **Device status**: Connected device with real-time heartbeat indicator — pulsing circle + current BPM (large monospace) or "No signal" with troubleshooting
- **Consent toggle**: "Share my heart rate during this class" — default on if previously opted in
- **Privacy**: "Only the coach sees individual data. Other attendees see anonymous averages."
- **Action**: "Join Class" coral button (disabled until signal confirmed or consent declined)

### Coach Live Class Screens

#### Screen 3.3 — Live Class Dashboard (Coach iPad)

Replaces Generate tab during active class. The coach's iPad during the workout.

- **Top bar**: Class name, elapsed timer (large monospace: "12:34"), attendee count with green pulse ("8 live"), "End Class" (ghost, top-right)
- **Phase indicator**: Full-width horizontal bar. The intensity arc with a live playhead marker moving in real-time. Current phase name + target BPM highlighted.
- **Now Playing**: Single row — track name + artist (large), BPM badge (monospace), progress bar, skip forward/back controls.
- **Heart Rate Grid** (~50% of screen):
  - 2–3 column grid of attendee cards
  - Each card: First name, current HR (large monospace, e.g., "156"), 60-second sparkline, HR zone color background band
  - HR zone bands: Zone 1 gray, Zone 2 blue, Zone 3 green, Zone 4 amber, Zone 5 coral
  - Subtle pulse animation on heartbeat readings
  - No-HR attendees show: name + "No HR" (muted)
- **Class Aggregate** (below grid):
  - "Class Avg: 148 BPM" (large monospace)
  - Zone distribution bar (stacked colored segments, animated real-time)
  - Auto-adjustment indicator: "Class running hot — next track adjusted ↓" (amber) or "Class below target — boosting ↑" (blue)

#### Screen 3.4 — Playlist Auto-Adjustment Notifications

Inline on the Live Dashboard. Not a separate screen.

- **Trigger**: Class avg HR significantly above/below target for 30+ seconds
- **Notification**: Slides from top, stays 5 seconds. Shows reason, action taken, "Undo" button (10-second window).
- **Adjustment log**: Tappable badge shows scrollable list of all adjustments during session.
- **Manual override**: Skip button on Now Playing strip for coach manual advance.

### Gym Display

#### Screen 3.5 — Gym Display Mode

Separate route: `/display/[classId]`. For TV/large monitor in the gym.

- **Full-screen, dark background** (#111). No tab bar, no navigation. Maximum readability at distance.
- **Layout** (1920x1080 landscape):
  - **Left 60%**: HR leaderboard — large rows per attendee. Name, current HR (very large monospace ~80px), zone color band, sparkline. Sorted by HR descending (or alphabetical, configurable).
  - **Right 40%**: Now Playing (large album art, track name, artist, BPM in huge monospace). Class Average (giant monospace number + zone color). Zone distribution bar. Current phase + time remaining (countdown). Intensity arc with live playhead.
- **Typography**: Minimum 48px for HR numbers, 36px for track names. Readable from 5+ meters.
- **Animation**: Smooth number counting transitions. Real-time sparklines. Fading zone colors.
- **Connection**: WebSocket-driven. "Reconnecting..." indicator on drop, auto-retry.

### Post-Workout Screens

#### Screen 3.6 — Post-Workout Biometric Analysis (Attendee)

Available after class with biometric sharing. Accessed from past class detail.

- **Header**: Class date, workout name, summary: "You burned an estimated 340 cal in 20 minutes"
- **HR Graph** (hero):
  - X-axis: Time (0 to duration). Y-axis: Heart rate (resting to max).
  - Smooth HR curve line
  - Background: HR zone color bands (Zone 1 gray bottom → Zone 5 coral top)
  - Overlay: Track change markers (vertical dashed lines + track name labels)
  - Phase overlay: Colored blocks along x-axis matching intensity arc
  - Peak marker: Flag at highest HR: "Peak: 178 BPM during 'Beast Mode' by Metallica"
- **Stats row** (monospace): Avg HR, Max HR, Time in Zone 4+, Est. Calories
- **Zone breakdown**: Horizontal stacked bar with time per zone
- **Track correlation**: Each track with avg HR during play + HR delta on track change. Highlight: "Biggest HR boost: +18 BPM during 'Full Send'"
- **Export**: "Export to Apple Health" button, "Share summary" (generates shareable card image)

#### Screen 3.7 — Coach Post-Class Analytics

Extends past class detail (Screen 2.4) with biometric data.

- **Class Biometrics**:
  - Aggregate HR graph (class average line, min-max shaded band)
  - Track-by-track engagement: avg class HR, % in Zone 4+, heat score (0-100 monospace)
  - Phase accuracy: Target BPM vs. actual class avg HR per phase. Green check (in range), amber warning (off).
  - Auto-adjustment log with before/after HR data
- **Insight card**: AI summary: "The class peaked 2 minutes into the WOD phase. 'Full Send' by RATM was the highest-engagement track. Consider boosting similar tempo tracks for future high-intensity phases."

#### Screen 3.8 — Leaderboards (Attendee Stats Tab)

Third attendee tab.

- **Time filter**: "This Week" / "This Month" / "All Time" pills
- **My Stats** (highlighted card): Classes attended (large monospace), avg HR, total Zone 4+ time, consistency streak
- **Leaderboards** (opt-in):
  - Most Consistent: Ranked by streak. Rank, name, streak count. Current user highlighted coral.
  - Hardest Worker: Ranked by avg Zone 4+ time.
  - Most Classes: Ranked by attendance.
  - Compact collapsible sections — tap to expand.
  - Privacy: "Show me on leaderboards" toggle.
- **Achievements**: Badge grid — unlocked in color, locked grayed. Examples: "First Class", "10 Classes", "Zone 5 for 5 min", "Full Week Streak", "Month Warrior". Tap for detail + date earned.

#### Screen 3.9 — AI Learning Insights (Coach)

Profile tab → "AI Insights".

- **Header**: "What Crank has learned" with AI/brain icon
- **BPM Optimization**: Table comparing default vs. learned BPM ranges per phase. Explanation: "Based on 45 classes, your athletes respond best to slightly lower BPM in high-intensity phases"
- **Top Performing Tracks**: Ranked by heat score (consistent HR engagement)
- **Genre Effectiveness**: Bar chart — Rock 82%, Metal 78%, Electronic 71%, etc.
- **Reset**: "Reset learning" ghost button with confirmation dialog

---

## Screen Inventory

| ID | Screen | Phase | Persona |
|----|--------|-------|---------|
| 0.1 | Generate: Empty State | 0 | Both |
| 0.2 | Generate: Loading | 0 | Both |
| 0.3 | Generate: Results | 0 | Both |
| 0.4 | Generate: Photo Input | 0 | Both |
| 1.1 | Auth: Login / Signup | 1 | Both |
| 1.2 | Coach Profile Setup | 1 | Coach |
| 1.3 | Library: Saved Playlists | 1 | Coach |
| 1.4 | Playlist Detail | 1 | Coach |
| 1.5 | Track Search / Swap | 1 | Coach |
| 1.6 | Track Feedback (Inline) | 1 | Coach |
| 1.7 | Profile: Preferences & Stats | 1 | Coach |
| 2.1 | Classes: Upcoming | 2 | Coach |
| 2.2 | Create Class | 2 | Coach |
| 2.3 | Class Detail | 2 | Coach |
| 2.4 | Class History | 2 | Coach |
| 2.5 | Attendee Onboarding | 2 | Attendee |
| 2.6 | Attendee Classes Tab | 2 | Attendee |
| 2.7 | Attendee Class Detail | 2 | Attendee |
| 2.8 | Post-Class Feedback | 2 | Attendee |
| 2.9 | Attendee Music Tab | 2 | Attendee |
| 3.1 | Wearable Connection | 3 | Both |
| 3.2 | Pre-Class Device Check | 3 | Attendee |
| 3.3 | Live Class Dashboard | 3 | Coach |
| 3.4 | Auto-Adjustment Notifications | 3 | Coach |
| 3.5 | Gym Display Mode | 3 | N/A (TV) |
| 3.6 | Post-Workout Analysis | 3 | Attendee |
| 3.7 | Coach Post-Class Analytics | 3 | Coach |
| 3.8 | Leaderboards | 3 | Attendee |
| 3.9 | AI Learning Insights | 3 | Coach |

**Total: 29 screens**

---

## Design Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Design base | Approach B (Gym Dashboard) | Dense data visualization, everything on one screen, data-rich feel |
| App name | Crank | Music-native action word. "Crank up the music, crank out the reps." |
| Accent color | Deep coral/red (#E63946) | Bold, intense, high-energy. Matches CrossFit intensity. |
| Platform priority | iPad-first (coach), mobile-first (attendee) | Gyms use iPads as primary tool. Attendees use phones. |
| Navigation | Bottom tab bar | Standard mobile/tablet pattern. 4 tabs per persona. |
| Typography | Plus Jakarta Sans + JetBrains Mono | Geometric sans for readability + monospace for data density |
| Rejected: Approach A | Spotify-meets-Strava | Required scrolling. Less data-dense. |
| Rejected: Approach C | Apple Music for Fitness | Too music-centric, deprioritized workout data. |
