# Multi-Step ML Pipeline Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the flat intensity→BPM lookup with a multi-step pipeline that models workout physiology to produce better music-to-moment matching.

**Architecture:** Approach A — Enhanced Single Call. One Claude API call extracts movement-level workout detail, then deterministic Python models simulate heart rate and map it to music energy targets. Same API cost as today, dramatically richer output.

**Tech Stack:** Python 3.11 (FastAPI backend), Claude API (tool_use), Pydantic v2

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Design Decisions](#2-design-decisions)
3. [Step 1: Enriched Workout Analysis](#3-step-1-enriched-workout-analysis)
4. [Step 2: Heart Rate Model](#4-step-2-heart-rate-model)
5. [Step 3: Energy Mapping](#5-step-3-energy-mapping)
6. [Step 4: Segment Consolidation](#6-step-4-segment-consolidation)
7. [Step 5: Enhanced Music Curator](#7-step-5-enhanced-music-curator)
8. [Interactive Controls](#8-interactive-controls)
9. [API Response & Backward Compatibility](#9-api-response--backward-compatibility)
10. [Class-Level Design Constraint](#10-class-level-design-constraint)
11. [Spotify API Landscape](#11-spotify-api-landscape)
12. [Testing Strategy](#12-testing-strategy)
13. [Feature Flag](#13-feature-flag)
14. [Backlog: Future Approaches](#14-backlog-future-approaches)

---

## 1. Problem Statement

The current pipeline makes two simplifications that limit playlist quality:

1. **Workout type → intensity mapping is too coarse.** It maps AMRAP = "high", 21-15-9 = "very_high". But a 20-min AMRAP of air squats is very different from a 20-min AMRAP of 185lb clean & jerks.

2. **Six discrete BPM buckets with hard boundaries.** A 12-minute "very_high" phase gets the same BPM range for the entire duration, even though heart rate is climbing throughout.

### Current Pipeline

```
Text → [Claude: parse_workout] → WorkoutStructure (3-4 flat phases with hardcoded BPM)
     → [Music source: search by BPM] → Score → Compose → Playlist
```

### Proposed Pipeline

```
Text → [Claude: analyze_workout_v2] → WorkoutAnalysis (movements, timing, metabolic demand)
     → [Python: hr_model()] → HRCurve (30-sec samples)
     → [Python: energy_map()] → MusicTarget[] (continuous energy curve)
     → [Python: consolidate()] → MusicSegment[] (6-10 segments)
     → [Music source: search per segment] → Score → Compose → Playlist
```

Same number of Claude API calls (1). Steps 2-4 are pure Python (~7ms total). The music source search step is comparable to today.

---

## 2. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| HR model | Deterministic Python | Fast, free, testable. No API calls. Uses exercise physiology constants. |
| BPM mapping | Smart with auto half-time | Above ~160 HR, switch to half-time BPM (HR/2) for genres that benefit (Rock, Hip-Hop). Metal/EDM/Punk stay full-time. |
| Analysis depth | Movement-level | Extract load, reps, rep speed, metabolic demand per movement. Gives HR model real data. |
| Compatibility | Feature flag | Both pipelines coexist via `USE_ENRICHED_PIPELINE` flag. Zero regression risk. |
| Energy granularity | Class-level arc | Music serves the class, not individuals. Min 3-4 min segments during WOD. No rep-by-rep sync. |
| Music source | External (Deezer next) | Spotify recommendation/audio-features APIs deprecated. Spotify for playback/export only. |

---

## 3. Step 1: Enriched Workout Analysis

The current `parse_workout` Claude tool returns flat phases with hardcoded BPM ranges. The new `analyze_workout_v2` tool extracts movement-level detail.

### New Pydantic Models

```python
class Movement(BaseModel):
    name: str                          # "thrusters", "pull-ups", "row"
    load: Optional[str] = None         # "95lb", "bodyweight", "moderate"
    reps: Optional[int] = None         # 21 (null for time-based like "row 500m")
    duration_sec: Optional[int] = None # For time-based movements
    est_rep_time_sec: float            # Estimated seconds per rep

class WorkoutSegment(BaseModel):
    name: str                          # "21 Thrusters + Pull-ups"
    duration_min: int                  # 4
    segment_type: Literal[
        "warm_up", "work", "rest", "transition", "cooldown"
    ]
    movements: list[Movement]
    rest_pattern: Literal[
        "none", "fixed", "work_rest_ratio", "as_needed"
    ]
    rest_sec: int = 0                  # Rest between rounds/sets
    metabolic_demand: Literal[
        "aerobic", "glycolytic", "phosphagen"
    ]
    estimated_rpe: int                 # 1-10 rate of perceived exertion

class WorkoutAnalysis(BaseModel):
    workout_name: str                  # "Fran"
    workout_type: str                  # "descending_reps", "amrap", "emom", etc.
    total_duration_min: int            # Including warm-up and cooldown
    segments: list[WorkoutSegment]
```

### Claude Tool Schema Changes

A new `analyze_workout_v2` tool with the enriched schema. The existing `parse_workout` tool stays for the old pipeline. Key additions in the system prompt:

- Movement timing estimates (Claude knows typical CrossFit rep speeds)
- Metabolic demand classification (aerobic/glycolytic/phosphagen)
- RPE estimation based on load, reps, and movement complexity
- No more hardcoded BPM ranges — those come from the HR model downstream

### Backward Compatibility

`WorkoutStructure` (the current model) can be derived from `WorkoutAnalysis`:

```python
def derive_workout_structure(analysis: WorkoutAnalysis, segments: list[MusicSegment]) -> WorkoutStructure:
    """Convert enriched analysis back to flat phases for backward compat."""
    phases = [segment.to_phase() for segment in segments]
    return WorkoutStructure(
        workout_name=analysis.workout_name,
        total_duration_min=analysis.total_duration_min,
        phases=phases,
    )
```

---

## 4. Step 2: Heart Rate Model

A deterministic physiological model. No API calls, no ML training. Pure math.

### Parameters

```python
# Exercise physiology constants (tunable)
HR_REST = 70            # Resting heart rate (bpm)
HR_MAX = 190            # Assumed max HR
HR_RISE_TAU = 30        # Seconds to reach ~63% of target HR (exponential rise)
HR_DECAY_TAU = 60       # Seconds to recover ~63% toward resting (exponential decay)
HR_DRIFT_PER_MIN = 0.8  # BPM drift per minute of sustained work (cardiac drift)
RECOVERY_DECAY = 0.02   # Recovery efficiency loss per minute of total work
SAMPLE_INTERVAL = 30    # Seconds between HR samples
```

### Algorithm

1. Walk through `WorkoutAnalysis` segments in 30-second steps
2. For each step, determine if the athlete is working or resting
3. **Working:** HR rises exponentially toward a ceiling based on metabolic demand + RPE:
   - `aerobic` (RPE 3-4): ceiling = 55-65% of HR_MAX (~105-125 bpm)
   - `glycolytic` (RPE 7-9): ceiling = 80-95% of HR_MAX (~150-180 bpm)
   - `phosphagen` (RPE 9-10): ceiling = 90-100% of HR_MAX (~170-190 bpm)
4. **Resting:** HR decays exponentially toward rest, but recovery efficiency degrades with accumulated fatigue
5. **Cardiac drift:** +0.8 BPM per minute of cumulative work time

### Output

```python
class HRSample(BaseModel):
    time_sec: int
    hr: int
    state: Literal["work", "rest", "transition"]

class HRCurve(BaseModel):
    samples: list[HRSample]
    peak_hr: int
    avg_hr: int
    time_above_160_sec: int
```

A 20-minute workout produces ~40 samples. Computation time: ~5ms.

---

## 5. Step 3: Energy Mapping

Maps the HR curve to music energy targets. This is where the smart half-time logic lives.

### HR Zone → Music Mapping

| HR Zone | Music Strategy | BPM Range |
|---------|---------------|-----------|
| < 120 (warm-up/recovery) | Motivational, building energy | BPM ≈ HR |
| 120-145 (moderate) | Driving rhythm, energy building | BPM ≈ HR |
| 145-160 (high) | Peak energy, strong beat | BPM ≈ HR |
| > 160 (max effort) | Half-time trigger (genre-dependent) | BPM ≈ HR/2 or HR |
| Declining (recovery) | Winding down | BPM drops 10-15/min |

### Half-Time Genre Exceptions

Not all genres benefit from half-time at max effort:

| Genre | Half-time above 160? | Reasoning |
|-------|---------------------|-----------|
| Rock | Yes | Heavy riffs at 80-85 BPM feel powerful |
| Hip-Hop | Yes | Trap beats at 75-85 BPM are peak intensity |
| Metal | No | Metal thrives at 160+ BPM |
| EDM | No | Built for high BPM |
| Pop | Yes | Pop rarely works above 150 BPM |
| Punk | No | Punk is fast by nature |
| Country | Yes | Power ballads work at half-time |
| Indie | Yes | Rarely goes above 150 BPM effectively |

### Trend Detection

Each sample gets a trend based on HR direction:
- HR rising > 3 BPM over last 2 samples → `"building"`
- HR stable ±3 BPM → `"peak"` or `"sustaining"`
- HR falling > 3 BPM → `"falling"`

### Output

```python
class MusicTarget(BaseModel):
    time_sec: int
    duration_sec: int        # Typically 30s (sample interval)
    bpm_min: int
    bpm_max: int
    energy_min: float        # 0.0-1.0
    half_time: bool
    trend: Literal["building", "peak", "sustaining", "falling"]
```

---

## 6. Step 4: Segment Consolidation

Merges the fine-grained MusicTarget array into practical music segments.

### Rules

1. Adjacent targets with BPM ranges within 10 BPM and same `half_time` flag → merge
2. Minimum segment duration during WOD: 3-4 minutes (one track transition point)
3. Minimum segment duration for warm-up/cooldown: full phase duration
4. Maximum segments for a typical workout: 5-8

### Output

```python
class MusicSegment(BaseModel):
    start_sec: int
    end_sec: int
    bpm_min: int
    bpm_max: int
    energy_min: float
    half_time: bool
    trend: Literal["building", "peak", "sustaining", "falling"]
    phase_name: str          # Derived from original segment names

    # Backward-compatible fields (derived)
    intensity: IntensityLevel  # Mapped from avg HR
    duration_min: int          # (end_sec - start_sec) / 60

    def to_phase(self) -> Phase:
        """Convert to backward-compatible Phase model."""
        return Phase(
            name=self.phase_name,
            duration_min=self.duration_min,
            intensity=self.intensity,
            bpm_range=(self.bpm_min, self.bpm_max),
        )
```

### Typical Output

A 23-minute workout (5 warm-up + 15 WOD + 3 cooldown):

```
Segment 1: Warm-up        (5 min)  — building, 100-120 BPM
Segment 2: WOD early      (5 min)  — building, 130-150 BPM
Segment 3: WOD peak       (5 min)  — peak, 150-165 BPM (or half-time 78-82)
Segment 4: WOD sustain    (5 min)  — sustaining, 145-160 BPM
Segment 5: Cooldown       (3 min)  — falling, 90-110 BPM
```

---

## 7. Step 5: Enhanced Music Curator

The current curator searches per-phase with a single BPM range. The enhanced curator works with MusicSegments.

### Changes

1. **Trend-aware ordering:** If `trend="building"`, prefer tracks sorted by ascending energy. If `trend="falling"`, sort descending. If `trend="peak"`, sort by score.

2. **Half-time search:** When `half_time=True`, search at BPM/2 (e.g., 80-87 BPM) but with `energy_min >= 0.7` — heavy, powerful tracks, not slow ballads.

3. **Crossfade hints (metadata only):** Adjacent segments with BPM jump > 15 get `transition: "sharp"`. Smooth flows get `transition: "blend"`. Future use for player crossfade timing.

4. **New method:** `compose_from_segments(segments: list[MusicSegment], ...)` alongside existing `compose(workout: WorkoutStructure, ...)`.

---

## 8. Interactive Controls

### Boost Mode (v1 — Generation Time)

A toggle on the generate form. When active:
- Adds +10 BPM across all work segments in the energy mapping step
- Shifts the half-time threshold from 160→170 HR
- The whole playlist runs hotter

```python
# In energy_mapper.map()
if boost:
    bpm_min += 10
    bpm_max += 10
    half_time_threshold = 170  # instead of 160
```

**Future (v2):** A button in the player that queues the next high-energy reserve track. Requires reserve tracks in the API response (see backlog).

### Coach's Choice (v1 — Pre-Generation)

The coach specifies a song to pin into the playlist before generating:

```python
# Enhanced request
GeneratePlaylistRequest:
    # ... existing fields ...
    boost: bool = False
    coaches_choice: Optional[str] = None       # Spotify URI or search query
    coaches_choice_phase: Optional[str] = None  # "wod" | "warmup" | "cooldown"
```

The pipeline pins the chosen track into the appropriate segment, then builds the rest of the playlist around it (matching the energy curve while respecting the anchor).

**Future (v2):** A "Play Next" button during playback — pure Spotify queue manipulation via `POST /me/player/queue`.

---

## 9. API Response & Backward Compatibility

### Response Shape

```python
class EnrichedData(BaseModel):
    hr_curve: HRCurve
    music_segments: list[MusicSegment]
    boost_applied: bool
    coaches_choice_track: Optional[Track]

class GeneratePlaylistResponse(BaseModel):
    workout: WorkoutStructure           # Backward-compatible (derived)
    playlist: Playlist                   # Same as today
    enriched: Optional[EnrichedData]     # New, only when enriched pipeline active
```

The frontend reads `workout` and `playlist` as before. The `enriched` field enables future UI:
- HR curve overlay on the IntensityArc (US-304)
- Phase-grouped track list with section headers
- Summary metrics (peak HR, avg HR, time in zones)

---

## 10. Class-Level Design Constraint

**The music serves the class, not any individual athlete.**

In a CrossFit class:
- Everyone starts warm-up together
- Everyone starts the WOD together
- But people finish at different times (some at 12 min, some hit the 20-min cap)
- Cooldown starts when the coach calls it

### Implications

1. **HR model outputs a smooth curve** for a representative "average" athlete — not a precise prediction for one person
2. **No rep-by-rep music sync.** The energy arc follows the general shape of effort (build → peak → sustain → resolve), not individual movement transitions
3. **WOD music sustains peak energy until the time cap.** If the WOD is capped at 20 minutes, music stays intense for the full 20. Fast finishers hear cooldown come in early; capped athletes get intensity all the way through.
4. **Transitions happen at structural boundaries** (warm-up→WOD, WOD→cooldown), not at rep scheme boundaries within the WOD
5. **Minimum segment duration during WOD: 3-4 minutes.** No micro-segments.

---

## 11. Spotify API Landscape

As of February 2026, Spotify has deprecated the key endpoints for music discovery:

| Endpoint | Status | Impact |
|----------|--------|--------|
| `GET /recommendations` (with `target_tempo`) | 403 for new apps | Cannot use for BPM-based discovery |
| `GET /audio-features` | 403 for new apps | Cannot look up BPM for tracks |
| `GET /audio-analysis` | 403 for new apps | Cannot get detailed audio data |
| `GET /search` | Works (max 10 results/page) | No BPM filter available |
| Playlist creation/playback | Works | Core use case for Crank |

**Conclusion:** Spotify is a playback and playlist export tool, not a discovery tool. BPM-aware music discovery comes from external sources. Next recommended source: **Deezer API** (free, no auth, native BPM in track metadata).

---

## 12. Testing Strategy

Each step is independently testable:

### Step 1: Workout Analysis (Claude)
- Mock the Claude client (existing `MockAnthropicClient` pattern)
- Add mock responses for `analyze_workout_v2`
- Test: known workout text → expected segments, movements, RPE

### Step 2: HR Model (Pure Unit Tests)
- No mocks needed — pure math
- Test cases:
  - Constant work at RPE 8 → HR rises to ~85% max and plateaus
  - Work-rest intervals → HR oscillates with decreasing recovery
  - Cardiac drift → HR creeps up over 20+ minutes
  - Cooldown → HR decays toward resting
- Golden file tests: "Fran" → expected HR curve snapshot

### Step 3: Energy Mapping (Pure Unit Tests)
- Known HR curves → expected BPM ranges
- Half-time trigger: HR > 160 + Rock → BPM ≈ HR/2
- Genre exception: HR > 160 + Metal → BPM ≈ HR (no half-time)
- Trend detection: rising/stable/falling HR → correct labels

### Step 4: Consolidation (Pure Unit Tests)
- 40 MusicTargets → ~5-6 merged MusicSegments
- Minimum segment duration enforced
- Backward compat: segments → valid Phase objects

### Step 5: Enhanced Curator (Integration Tests)
- MusicSegments → tracks with trend-aware ordering
- Boost modifier: +10 BPM across work segments
- Coach's Choice: anchored track in correct segment

### End-to-End
- Feature flag on: same input → enriched output with valid backward-compat fields
- Feature flag off: existing pipeline unchanged, all existing tests pass

---

## 13. Feature Flag

```python
# config.py
use_enriched_pipeline: bool = False  # Defaults to old pipeline

# main.py — generate endpoint
if settings.use_enriched_pipeline:
    analysis = parser.analyze_and_validate_v2(workout_text)
    hr_curve = hr_model.simulate(analysis)
    targets = energy_mapper.map(hr_curve, genre, boost=body.boost)
    segments = consolidate_targets(targets, analysis)
    playlist = composer.compose_from_segments(segments, ...)
    workout = derive_workout_structure(analysis, segments)
    enriched = EnrichedData(hr_curve=hr_curve, music_segments=segments, ...)
else:
    workout = parser.parse_and_validate(workout_text)
    playlist = composer.compose_and_validate(workout, ...)
    enriched = None
```

---

## 14. Backlog: Future Approaches

### Approach B — Claude Music Reasoning (Two Calls)

After the HR model produces the energy curve, ask Claude to recommend specific songs that match each segment's mood, energy, and workout context — not just BPM.

- **Depends on:** Reliable music API (Deezer) to verify Claude's suggestions exist
- **Trigger:** Deezer integration is live
- **Value:** Claude can reason about mood, lyrics, cultural fit — not just tempo

### Approach C — Trained ML Models

Collect real user data and train models:
- BPM-preference model per workout type (from user feedback)
- Track-quality model (from aggregated thumbs up/down)
- HR prediction model (when wearable data available via Phase 3)

- **Trigger:** 1000+ generated playlists with feedback data
- **Relates to:** US-305 (AI-Driven BPM Learning)

### Interactive Features (v2)

- **Boost during playback:** Reserve tracks in API response; "Boost" button queues next high-energy track
- **Coach's Choice during playback:** Search + queue via Spotify `POST /me/player/queue`
- **Reserve tracks:** Include 2-3 scored-but-not-selected tracks per segment for swap/boost

### Phase 3 Bridge (Real-Time Biometrics)

The data models built here (`HRCurve`, `MusicTarget`, `MusicSegment`) are the same ones real biometric integration would need (US-301 through US-306). When a user connects their Apple Watch:
- Swap the simulated HR curve for real HR data
- The energy mapping, consolidation, and music selection pipeline stays identical
- Enables real-time playlist adjustment (US-302) by re-running steps 3-5 on live data

---

## Relationship to User Stories

| User Story | Relationship |
|-----------|-------------|
| US-001 (Generate Playlist) | Enhanced — richer workout analysis produces better playlists |
| US-104 (Boost Track Selection) | Extended — Boost button and trend-aware selection |
| US-302 (Real-Time Playlist Adjustment) | Foundation — same pipeline, swap simulated HR for real |
| US-304 (Post-Workout Biometric Analysis) | Enabled — HR curve + track overlay data in response |
| US-305 (AI-Driven BPM Learning) | Backlog — Approach C builds on this pipeline's data |
