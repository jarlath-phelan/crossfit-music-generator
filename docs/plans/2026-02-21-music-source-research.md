# Music Source Research: BPM Data for Crank

> **Date**: 2026-02-21 (updated)
> **Context**: Crank is a CrossFit playlist generator that matches music BPM to workout intensity phases. This document evaluates all viable alternatives for obtaining BPM/tempo data for music tracks, and provides prioritized recommendations for integration.

---

## Table of Contents

1. [Current State](#1-current-state)
2. [BPM Database APIs](#2-bpm-database-apis)
3. [Audio Analysis Services](#3-audio-analysis-services)
4. [Music Discovery & Streaming APIs](#4-music-discovery--streaming-apis)
5. [Open Source Libraries & Datasets](#5-open-source-libraries--datasets)
6. [Workout Music Services](#6-workout-music-services)
7. [Community & DJ Databases](#7-community--dj-databases)
8. [AI-Assisted Approaches](#8-ai-assisted-approaches)
9. [Comparative Analysis](#9-comparative-analysis)
10. [Prioritized Recommendations](#10-prioritized-recommendations)

---

## 1. Current State

Crank's `MusicSource` interface (`apps/api/music_sources/base.py`) defines a pluggable system where each source implements `search_by_bpm(bpm_min, bpm_max, genre, limit)` and returns `TrackCandidate` objects with name, artist, BPM, energy, duration, and a `verified_bpm` flag.

### Current Sources

| Source | Status | BPM Verified | File | Notes |
|--------|--------|-------------|------|-------|
| **MockMusicSource** | Dev only | N/A | `mock_source.py` | 50 hardcoded rock tracks |
| **GetSongBPMMusicSource** | Implemented, not yet live | Yes | `getsongbpm.py` | Free, requires attribution backlink |
| **SoundNetMusicSource** | Dead | Yes | `soundnet.py` | RapidAPI endpoint acquired by Nokia, no longer available |
| **ClaudeMusicSource** | Production fallback | No | `claude_suggestions.py` | Claude suggests songs with BPM estimates; flexible but unverified |

### The Core Problem

Spotify deprecated its Audio Features API (including BPM/tempo) on November 27, 2024. New apps get 403 errors on `/v1/audio-features/{id}` and `/v1/audio-analysis/{id}`. Only apps that had a pending quota extension before that date retain access. There is no migration path. Spotify's February 2026 migration guide further tightened restrictions. This removed the most reliable, widely-used source of BPM data from the ecosystem.

**Our Spotify status**: We have Spotify credentials for playlist creation and track search, but we are NOT grandfathered for Audio Features access.

---

## 2. BPM Database APIs

These services maintain pre-computed BPM databases and expose them via REST APIs.

### 2a. GetSongBPM (already implemented)

- **URL**: https://getsongbpm.com/api
- **Database Size**: 6+ million songs
- **Cost**: Free
- **Requirements**: Must display a backlink to getsongbpm.com; app must be registered with valid email
- **BPM Source**: Their own audio recognition scripts (tempo, key, mood analysis)
- **Key Endpoints**:
  - `/tempo/` -- Search songs by BPM (target tempo)
  - `/search/` -- Search by title and/or artist (Title-Artist search first, falls back to Title-only)
  - `/song/` -- Get song details including BPM, key, danceability
- **Response Data**: Song title, artist, BPM, key, time signature, danceability, acousticness, album info. Returns JSON; HTTP 200 on success with array of values.
- **Rate Limits**: Not publicly documented; appears generous for moderate use
- **Verified BPM**: Yes (audio analysis)
- **Limitations**:
  - No duration data in API response (we default to 210s)
  - No energy field (we estimate from BPM via heuristic in our code)
  - Tempo endpoint returns songs AT a specific BPM, not in a range -- must search midpoint and filter
  - Genre filtering not natively supported in tempo search
  - Backlink requirement may complicate mobile/PWA use
- **Integration Status**: Already implemented in `apps/api/music_sources/getsongbpm.py`
- **Verdict**: Strong candidate for primary verified BPM source. Free, large database, already coded. The backlink requirement is the main friction point.

### 2b. Tunebat / Songstats API

- **URL**: https://tunebat.com/API (powered by Songstats)
- **Database Size**: 70+ million tracks
- **Cost**: Consumer product free; Pro $7.99/month. API access via Songstats partnership -- enterprise pricing, must contact sales.
- **BPM Source**: Historically powered by Spotify Web API data. Post-deprecation data source for new tracks is unclear.
- **Data Available**: BPM, key, energy, danceability, happiness, popularity, release date, label
- **Rate Limits**: Unknown for API tier
- **Verified BPM**: Yes for existing catalog
- **Limitations**:
  - No public free API tier for developers
  - Enterprise pricing through Songstats likely expensive for a free product
  - Historical reliance on Spotify data raises questions about freshness post-deprecation
  - Not clear if you can search by BPM range directly
- **Verdict**: Massive database but no affordable API access. Not viable for Crank's free-first model unless they open a startup/indie tier.

### 2c. Soundcharts Audio Features API

- **URL**: https://soundcharts.com/en/audio-features-api
- **Coverage**: Millions of tracks, resolved via UUID, ISRC, or platform IDs (Spotify, Apple Music)
- **Features**: BPM/tempo, key, mode, time signature, loudness, energy, valence, danceability, acousticness, instrumentalness, speechiness, liveness
- **Cost**: Self-served API plans start at 500K requests/month. All plans billed monthly via credit card. Estimated starting around $250/month based on community reports. Must contact sales for exact pricing.
- **Rate Limits**: 10,000 requests/minute across all plans
- **API Tiers**: Standard (most endpoints) and Premium (all endpoints including those behind a lock icon)
- **Verified BPM**: Yes (their own analysis pipeline)
- **Strengths**:
  - Rich feature set beyond just BPM (energy, valence, danceability) -- effectively the full Spotify Audio Features replacement
  - Can resolve tracks by Spotify ID, Apple Music ID, or ISRC
  - Active, well-funded product with enterprise backing
- **Limitations**:
  - Enterprise pricing; likely hundreds of dollars per month minimum
  - Requires track lookup by ID, not a "search by BPM range" endpoint
  - Would need a two-step workflow: discover track elsewhere, then enrich with Soundcharts
- **Verdict**: Best-in-class Spotify Audio Features replacement for enrichment. Too expensive as a primary source for Crank right now, but excellent for BPM verification if budget allows later.

### 2d. Cyanite AI Music Analysis API

- **URL**: https://cyanite.ai / https://api-docs.cyanite.ai
- **How it Works**: Converts tracks to spectrograms, applies computer vision to understand musical structure, refines through post-processing
- **Features**: BPM, genre, mood, instruments, lyric theme, tempo, energy dynamics (per 15-second segment), key
- **Cost**: API usage fee is 290 EUR/month base; total price depends on catalog size and features. Free tier for academic researchers ("Cyanite for Innovators" program).
- **Coverage**: 45+ million songs tagged; 150+ companies using
- **API Style**: GraphQL
- **Verified BPM**: Yes (ML audio analysis)
- **Strengths**:
  - Energy dynamics per 15-second segment is uniquely valuable for workout phasing (could match song energy arc to CrossFit intensity phases)
  - AI-powered mood and instrument detection
  - Can analyze uploaded audio files
- **Limitations**:
  - Expensive (290+ EUR/month base)
  - Oriented toward music licensing and publishers, not consumer app development
  - GraphQL API (not REST) adds integration complexity
  - Requires audio file upload or catalog integration for custom content
- **Verdict**: The per-segment energy analysis would be transformative for CrossFit playlists (imagine matching a song whose energy builds at 2:00 to the start of an AMRAP). However, far too expensive for Crank at this stage. Aspirational target if we monetize.

### 2e. SongBPM.com / SongData.io / BPMDatabase.com

- **SongBPM.com** (https://songbpm.com): BPM and key lookup. No public API.
- **SongData.io** (https://songdata.io): 80+ million songs with BPM, key, popularity, recommendations. No public developer API found.
- **BPMDatabase.com** (https://www.bpmdatabase.com): 100K+ community-submitted profiles. No public API (Django web app).
- **Verdict**: None viable as programmatic sources -- consumer-facing lookup tools only.

---

## 3. Audio Analysis Services

These services analyze audio files or fingerprints to extract BPM and other features.

### 3a. Shazam / ShazamKit

- **URL**: https://developer.apple.com/shazamkit/ (official), https://rapidapi.com (third-party)
- **How it Works**: Audio fingerprinting to identify songs; returns metadata including tempo
- **Cost**: ShazamKit is free via Apple developer program. Third-party Shazam APIs on RapidAPI have free tiers.
- **Features**: Song identification, tempo, key, genre, album art, streaming links
- **Verified BPM**: Yes (for identified tracks)
- **Limitations**:
  - Designed for audio recognition (input is audio), not BPM-based search
  - Cannot search "give me songs at 150 BPM" -- must identify a specific audio clip
  - ShazamKit requires Apple ecosystem integration
- **Verdict**: Wrong tool for our use case. Shazam identifies what's playing, not what to play.

### 3b. Audio Analysis Summary (Open Source)

See Section 5 for detailed coverage of librosa, Essentia, madmom, aubio, and Tempo-CNN.

**Key insight**: Audio analysis tools are excellent for *verifying* BPM but cannot help us *discover* tracks by BPM. They complement BPM databases rather than replacing them.

---

## 4. Music Discovery & Streaming APIs

### 4a. Spotify Web API (Post-Deprecation)

- **Status as of Feb 2026**: Audio Features and Audio Analysis endpoints return 403 for all new apps. Only apps with extended access granted before November 27, 2024 retain access. February 2026 migration guide further tightened restrictions.
- **BPM Available**: Only for grandfathered apps
- **Our Status**: We have Spotify credentials for playlist creation and track search, but NOT grandfathered for Audio Features
- **What Still Works**: Search, playback, playlist management, track metadata (title, artist, album, popularity, duration)
- **What Does NOT Work**: `GET /audio-features/{id}`, `GET /audio-analysis/{id}`, `GET /recommendations`
- **Why Deprecated**: Spotify stated concerns about developers scraping data and training AI models
- **Verdict**: Dead for BPM. Still essential for playlist creation, track search, and URI resolution.

### 4b. Deezer API

- **URL**: https://developers.deezer.com
- **Availability**: Active. Free "Simple API" with no authentication required for basic access.
- **Cost**: Free
- **BPM Data**: YES. The `/track/{id}` endpoint returns a `bpm` field (float). Not returned in album track listings -- requires individual track requests.
- **BPM Search**: The advanced search endpoint supports `bpm_min` and `bpm_max` parameters. Example: `/search?q=bpm_min:"120" bpm_max:"145"`
- **Rate Limits**: ~50 requests per 5 seconds (10 req/s). Returns HTTP 429 when exceeded.
- **Coverage**: 90M+ tracks
- **Integration Complexity**: LOW. Simple REST API. No auth required for Simple API. Python client available (`deezer-python`).
- **Additional Data**: 30-second preview URLs (useful for non-Spotify playback)
- **Limitations**:
  - BPM field may not be populated for all tracks (empty for less popular tracks)
  - Cannot filter by genre AND BPM simultaneously in advanced search (need to combine genre terms in query string)
  - No energy/mood data
  - Rate limited to ~10 req/s
- **Integration Patterns**:
  - **Discovery**: Search by BPM range directly via advanced search
  - **Verification**: Claude suggests songs -> look up each on Deezer -> get verified BPM -> filter/score
- **Verdict**: STRONG CANDIDATE. Free, no auth required, has BPM range search, massive catalog. Should be our next integration priority.

### 4c. Apple Music API (MusicKit)

- **URL**: https://developer.apple.com/documentation/applemusicapi
- **BPM Available**: No. The Song object in the public Apple Music API does not include BPM/tempo.
- **Restricted Access**: Advanced playback features (including real-time tempo change) exist only for approved DJ app partners: Algoriddim djay, Serato DJ Pro, rekordbox, Engine DJ.
- **What's Available Publicly**: Search, catalog browsing, playlist management, album art, editorial content
- **Cost**: Free with Apple Developer account ($99/year for the developer program)
- **Verdict**: No BPM data via public API. Per our go-live plan, Apple Music is a "fast follow" for playback integration, but BPM data will come from other sources.

### 4d. Tidal Developer API

- **URL**: https://developer.tidal.com
- **BPM Available**: Yes -- the Tidal API returns BPM, key, and key scale on track objects based on documentation examples
- **Cost**: Free developer access (registration required)
- **Auth**: OAuth2 required
- **Coverage**: 100M+ tracks
- **Features**: High-fidelity streaming, exclusive content, detailed track metadata including BPM
- **Limitations**:
  - Smaller user base than Spotify/Apple Music (especially in US market)
  - Developer API documentation is less mature
  - Cannot search BY BPM (only get BPM for a known track)
  - Would need to verify BPM field coverage across catalog
- **Integration Pattern**: Similar to Deezer verification -- look up Claude-suggested tracks on Tidal to get verified BPM
- **Verdict**: Worth investigating as a supplementary BPM verification source alongside Deezer. Lower priority given smaller user base and less documentation.

### 4e. YouTube Music

- **Official API**: YouTube Data API v3 -- no BPM/tempo data
- **Unofficial**: ytmusicapi (Python) -- no BPM/tempo data
- **Daily Quota**: 10,000 units default (different operations cost different amounts)
- **Verdict**: Not useful for BPM. Could be a future playback source (free tier via YouTube).

### 4f. iTunes Search API

- **URL**: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI
- **BPM Available**: No
- **Cost**: Free, no auth required
- **Verdict**: Not useful for BPM data. Could supplement track metadata lookups.

### 4g. Last.fm API

- **URL**: https://www.last.fm/api
- **BPM Available**: No native BPM field
- **Cost**: Free (API key required)
- **Useful For**: Genre tags, similar artist discovery, popularity/scrobbling data, user listening habits
- **Verdict**: No BPM data. Potentially useful as supplementary metadata for genre tags and artist similarity, but not a music source for Crank.

### 4h. Musixmatch API

- **BPM Available**: No -- focused on lyrics and lyric metadata
- **Verdict**: Not useful for BPM. Could be interesting for lyric-based features (motivational vs. mellow) in the future.

---

## 5. Open Source Libraries & Datasets

### 5a. librosa (Python)

- **URL**: https://librosa.org
- **What It Does**: Audio analysis library. `librosa.beat.beat_track()` detects tempo from audio files.
- **Accuracy**: Within +/-1 BPM for most commercial music with consistent tempos. 60+ seconds of audio needed for reliable detection. Less accurate for songs with tempo changes or ambiguous rhythms.
- **Algorithm**: Dynamic programming beat tracker: (1) measure onset strength, (2) estimate tempo from onset correlation, (3) pick peaks consistent with estimated tempo. Uses pseudo-log-normal prior over likely tempi.
- **Cost**: Free, open source (ISC license -- permissive)
- **Performance**: Slow. Benchmarked at ~2 hours on the same dataset Essentia completed in 4 minutes.
- **Requirements**: Audio file input (WAV, MP3, etc.). Python 3.8+, numpy, scipy, soundfile.
- **Limitations**:
  - Requires actual audio files (cannot analyze from a song title alone)
  - Processing takes seconds per track
  - Less accurate for electronic music with steady beats (can halve/double tempo)
  - Cannot be used as a "search by BPM" source without pre-building a database
- **Use Case for Crank**: Could analyze Deezer 30-second previews to verify BPM. ISC license is clean for commercial use.
- **Verdict**: Good for offline BPM verification. Permissive license. Not practical for real-time discovery.

### 5b. Essentia (Python/C++)

- **URL**: https://essentia.upf.edu
- **What It Does**: Comprehensive music information retrieval toolkit from Universitat Pompeu Fabra (Barcelona).
- **BPM Detection**:
  - `RhythmExtractor2013`: Traditional algorithm. Two modes: multifeature (slower, more accurate) and degara (faster).
  - `TempoCNN`: Deep learning CNN model. Processes 12-second audio slices with 6-second overlap. Outputs global BPM + local per-segment estimates with confidence scores. Range: 30-286 BPM. Three model sizes available.
- **Accuracy**: TempoCNN generally considered more accurate than traditional methods, especially for diverse genres. Specific benchmark numbers not publicly available but research basis is solid (published at ISMIR by Hendrik Schreiber and Meinard Mueller).
- **Performance**: Fast (~4 minutes on a benchmark dataset where librosa took ~2 hours).
- **Cost**: Free, open source (AGPLv3 -- copyleft)
- **Requirements**: Audio file input. C++ backend with Python bindings. More complex installation than librosa.
- **Additional Features**: Key detection, chord estimation, mood classification, loudness analysis
- **License Concern**: AGPLv3 requires sharing source code of any networked application that uses it. Since Crank's backend is a web service, using Essentia would trigger this requirement. Our code is open source already, but this is worth noting.
- **WebAssembly**: `essentia.js` runs in the browser. Could theoretically analyze audio client-side.
- **Verdict**: Best-in-class for BPM detection accuracy and speed. AGPLv3 license is acceptable since our code is public. Best for building a pre-computed BPM database or verification pipeline.

### 5c. madmom (Python)

- **URL**: https://github.com/CPJKU/madmom
- **What It Does**: State-of-the-art beat tracking using RNNs with dynamic Bayesian network (DBN) approximated by HMM. Multi-model setup with genre-specific RNNs.
- **Accuracy**: Very high -- considered the top for beat tracking specifically. May round BPM to nearest integer.
- **Performance**: Medium (faster than librosa, slower than Essentia)
- **Cost**: Free, open source (BSD license)
- **Verdict**: Best accuracy for beat tracking specifically, but requires audio access. BSD license is clean.

### 5d. aubio (Python/C)

- **URL**: https://aubio.org
- **What It Does**: Real-time audio analysis (onset detection, beat tracking, tempo estimation).
- **Accuracy**: Good. Designed for real-time use.
- **Performance**: Very fast -- designed for real-time beat detection.
- **Cost**: Free, open source (GPLv3)
- **Verdict**: Good for real-time scenarios. Less accurate than madmom or Essentia for offline BPM estimation.

### 5e. Tempo-CNN

- **URL**: https://github.com/hendriks73/tempo-cnn (also integrated into Essentia as `TempoCNN`)
- **What It Does**: Deep learning approach using CNNs on mel spectrograms. Supports local tempo estimation (tempo changes within a track). Has `--interpolate` flag for sub-integer BPM precision.
- **Cost**: Free, open source (MIT license)
- **Verdict**: Interesting for advanced tempo analysis. Best used through Essentia's integration.

### 5f. Realtime BPM Analyzer (JavaScript)

- **URL**: https://github.com/dlepaux/realtime-bpm-analyzer
- **What It Does**: WebAudioAPI-based library for real-time BPM detection from files, audio nodes, streams, or microphone input.
- **Verdict**: Could be useful for a future browser-based feature where users tap or play music, but not for our server-side BPM discovery use case.

### Audio Analysis Libraries Summary

| Library | Accuracy | Speed | License | Best For |
|---------|----------|-------|---------|----------|
| **Essentia** | High | Fast | AGPLv3 | Production BPM verification, pre-computed databases |
| **madmom** | Very High | Medium | BSD | Highest-accuracy beat tracking |
| **librosa** | Good | Slow | ISC | Prototyping, simple integration |
| **aubio** | Good | Very Fast | GPLv3 | Real-time analysis |
| **Tempo-CNN** | High | Medium | MIT | Local tempo / tempo changes |

**Key insight**: Audio analysis libraries are excellent for *verifying* BPM but cannot help us *discover* tracks. They require audio file input. They complement BPM database APIs rather than replacing them.

### 5g. Datasets

#### AcousticBrainz Data Dump

- **URL**: https://acousticbrainz.org/download
- **Status**: Project ended in 2022. Website and API still available as of early 2026 but on borrowed time. No new data being collected.
- **Data**: BPM, BPM histogram peaks, danceability, onset rate, key, mode, loudness -- all derived from Essentia analysis. Indexed by MusicBrainz Recording ID (MBID).
- **License**: CC0 (public domain) -- no attribution required
- **Size**: Feature CSV ~3GB; full low-level dump ~589GB compressed; high-level ~39GB
- **Integration Pattern**: Download dump -> extract MBID-to-BPM mappings -> use MusicBrainz API to resolve track names to MBIDs -> look up BPM locally
- **Limitations**: Frozen at 2022 data. Only covers tracks users submitted for analysis. Website may go offline without notice.
- **Verdict**: Best free offline BPM data source. The 3GB feature CSV is manageable. Worth downloading NOW before the site goes offline. CC0 license means zero legal friction.

#### Million Song Dataset

- **URL**: http://millionsongdataset.com
- **Size**: 1 million songs. 280GB full dataset, 1.8GB for 10K subset.
- **Data**: Tempo, loudness, key, time signature, duration (from The Echo Nest analysis)
- **Cost**: Free (NSF-funded research dataset)
- **Limitations**: From ~2011, no new songs. 280GB is impractical to host. Echo Nest IDs need cross-referencing.
- **Verdict**: Too old for a music app targeting current songs. The 10K subset could supplement mock data for testing.

#### GiantSteps Tempo Dataset

- **URL**: https://github.com/GiantSteps/giantsteps-tempo-dataset
- **Focus**: Human-annotated BPM for ~600 electronic dance music tracks
- **Verdict**: Too small and genre-specific for production. Useful for benchmarking BPM detection accuracy.

---

## 6. Workout Music Services

None of these offer developer APIs, but they validate the BPM-to-workout model and provide useful BPM range reference data.

### 6a. jog.fm

- **URL**: https://jog.fm
- **What it Does**: Recommends workout songs matched to running pace/BPM. Search by speed, BPM, or both. Genre-filtered. Crowd-sourced recommendations.
- **API**: No public API
- **Verdict**: Validates our concept. Their BPM-to-pace mapping is a useful reference.

### 6b. RockMyRun

- **URL**: https://www.rockmyrun.com
- **What it Does**: DJ-curated workout mixes. Body-Driven Music technology syncs to steps or heart rate. Manual BPM adjustment available.
- **Cost**: Subscription ($4.99/month or $35.99/year)
- **API**: No public API
- **Verdict**: Competitor with different approach (DJ-curated mixes vs. our AI-generated playlists). No API.

### 6c. FIT Radio

- **What it Does**: Workout music sorted by BPM, DJ, and activity type. 150 new tracks monthly.
- **API**: No public API
- **Verdict**: Competitor. No API access.

### 6d. Feed.fm

- **URL**: https://www.feed.fm
- **What it Does**: End-to-end music licensing + API for fitness apps. Curated BPM/genre/workout-specific stations. Full music licensing included. SDKs for iOS, Android, JavaScript.
- **Cost**: Custom pricing based on song plays
- **Verdict**: Wrong fit. We want to control the curation algorithm and let users play via Spotify. Feed.fm is for apps that want to embed a fully licensed music player.

### 6e. PulseMix (Hyperhuman)

- **URL**: https://blog.hyperhuman.cc/pulsemix-smart-workout-music/
- **What it Does**: BPM-aware music for fitness video content. Auto-matches music to workout categories.
- **BPM Ranges**: HIIT 140-180, Strength 90-120, Yoga 60-90, Cardio 130-160
- **Verdict**: Useful BPM range reference. Not a data source we can use (designed for video content creators, royalty-free music).

### Key Takeaway

None of these services offer APIs. They are consumer products. However, they validate that BPM-matched workout music is a proven market. Our differentiator is AI-powered workout parsing -- none of them parse workout text or photos to automatically determine intensity phases.

---

## 7. Community & DJ Databases

### 7a. BPMDatabase.com

- **URL**: https://www.bpmdatabase.com
- **Size**: 100,000+ user-contributed music profiles
- **How it Works**: Community-submitted BPM data from record labels, personal counting, or DJ software. Built originally as a school project in 2003 (LAMP stack), now Django.
- **API**: No public API
- **Data Quality**: Variable -- user-submitted, not audio-verified
- **Verdict**: Small, no API, unverified data. Not viable.

### 7b. AudioKeychain

- **URL**: https://www.audiokeychain.com
- **What it Does**: Upload tracks to find BPM and key. Manually validated by team before entering public database.
- **API**: No official API (third-party bash client exists on GitHub)
- **Data Quality**: High (human-validated)
- **Verdict**: No API. Manual validation means small scale.

### 7c. MusicBrainz

- **URL**: https://musicbrainz.org
- **Coverage**: 2.6M artists, 4.7M releases, 35.2M recordings
- **BPM Data**: MusicBrainz itself does NOT store BPM data. It stores metadata (artist, release, recording IDs, ISRCs).
- **Cost**: Free. Open data (CC license). 1 request/second rate limit.
- **Usefulness**: Canonical track identity resolver. MBIDs can cross-reference to AcousticBrainz BPM data, and ISRCs can cross-reference to Spotify/Deezer/Tidal.
- **Verdict**: Not a BPM source, but extremely useful as a cross-referencing layer to link tracks across multiple sources.

---

## 8. AI-Assisted Approaches

### 8a. Current Approach: Claude as Music Source

Our `ClaudeMusicSource` (`apps/api/music_sources/claude_suggestions.py`) prompts Claude to suggest real songs within a BPM range for a given genre. It requests JSON output with title, artist, BPM, energy, and duration. Results are marked `verified_bpm=False`.

**Strengths:**
- Most flexible source: understands workout context, mood, genre nuance, "vibe"
- Can incorporate user preferences, exclude/boost artists, favor specific moods
- No external API dependency beyond Anthropic
- Fast iteration on prompt engineering
- Can request workout-appropriate songs (high energy, motivational lyrics)
- Handles genre variety well (rock, electronic, hip-hop, pop, country, metal)
- Unlimited "catalog" -- any song Claude knows about
- Cost is modest (~$0.003-0.01 per Haiku call)

**Weaknesses:**
- BPM values are estimates from training data, not measured from audio
- Can hallucinate songs that don't exist (less common with Claude but still possible)
- BPM estimates can be off by 10-20 BPM for less well-known songs
- May suggest the same songs repeatedly across requests (needs temperature tuning or explicit diversity instructions)
- No guarantee the suggested BPM matches the actual track tempo
- Knowledge cutoff means very recent releases may be unknown

**Accuracy Assessment (from research):**
- Academic research on LLMs for music recommendation (ISMIR 2025, arXiv:2511.16478) shows LLMs are effective at bridging informal user requests with formal catalog metadata
- Claude outperformed ChatGPT and Gemini on music theory tasks, especially with structured encoding formats
- However, LLMs introduce challenges: hallucinations, knowledge cutoffs, non-determinism, opaque training data
- Multimodal LLMs "fail to listen reliably" -- they reason about music linguistically (from text training data mentioning BPMs), not from audio analysis
- **For well-known songs** (top 1000 per genre): Claude's BPM estimates are typically within +/-5 BPM
- **For moderately known songs**: +/-10-15 BPM
- **For obscure tracks**: potentially 20+ BPM off or hallucinated entirely

### 8b. Hybrid: Claude + BPM Verification (Recommended)

The most promising architecture combines Claude's flexibility with verified BPM data:

```
Claude suggests songs (fast, flexible, genre-aware, workout-context-aware)
    |
    v
Deezer / GetSongBPM verifies BPM + confirms song exists
    |
    v
If verified BPM is within range: keep (verified_bpm=True)
If verified BPM is out of range: discard
If song not found in verification API: keep with original estimate (verified_bpm=False)
    |
    v
Spotify resolves playback URI
```

**Benefits:**
- Claude handles the creative question: "what songs would work for this high-intensity CrossFit phase?"
- Verification layer catches hallucinated songs and corrects BPM
- Spotify handles playback
- Each service does what it's best at
- Both Claude and verification APIs are free or low-cost

**Cost per request:** One Claude API call (~$0.005) + N verification lookups (free via Deezer/GetSongBPM)

### 8c. Enhanced Claude Prompting

Research suggests several prompt improvements:
- **Chain-of-thought prompting**: "Generate a 30-minute workout playlist by: (1) selecting high-energy tracks with BPM 140-160, (2) filtering for motivational lyrics, (3) ordering by increasing intensity..."
- **Grounding in catalog data**: Instruct Claude to only suggest songs it is highly confident exist
- **Few-shot examples**: Include known songs with verified BPMs in the prompt
- **Confidence scoring**: Ask Claude to rate its confidence in each BPM estimate (1-5)
- **Diversity instructions**: "Do not suggest more than 2 songs by the same artist"

### 8d. Future: Per-Segment Energy Analysis

Cyanite's approach of analyzing energy dynamics per 15-second segment represents the ideal future. Instead of assuming a song has a single energy level, we could:
1. Analyze a song's energy profile over time
2. Match songs whose energy curve aligns with the workout phase structure
3. e.g., a song that builds from low to high energy at 2:00 could be placed right before a sprint interval

This is aspirational (requires Cyanite-level investment) but represents where the technology is heading.

---

## 9. Comparative Analysis

### All BPM Data Sources Ranked

| Source | BPM Verified | Search by BPM | Cost | Catalog Size | Energy Data | Auth Needed | Integration Effort |
|--------|-------------|---------------|------|-------------|-------------|-------------|-------------------|
| **Deezer API** | Yes | Yes (min/max) | Free | 90M+ | No | No | Low |
| **GetSongBPM** | Yes | Yes (single BPM) | Free (backlink) | 6M+ | No | API key | Done |
| **Claude AI** | No | Yes (generates) | ~$0.005/req | Unlimited | Yes (estimated) | API key | Done |
| **Tidal API** | Yes | No (lookup only) | Free | 100M+ | No | OAuth2 | Medium |
| **AcousticBrainz dump** | Yes | Yes (local DB) | Free (CC0) | Millions (pre-2022) | No | None | Medium-High |
| Soundcharts | Yes | No (enrich only) | $250+/mo | Millions | Yes (full set) | API key | Medium |
| Tunebat/Songstats | Yes | Unknown | Enterprise | 70M+ | Yes | Sales-gated | Medium |
| Cyanite | Yes | No (analyze) | 290+ EUR/mo | 45M+ tagged | Yes (per-segment) | Sales-gated | High |
| Essentia/librosa | Yes | N/A (offline) | Free (OSS) | N/A | No | None | High |
| Last.fm | No | No | Free | N/A | No | API key | Low |
| Apple Music | No | No | $99/yr dev | Large | No | JWT | Medium |

### Architecture Options

**Option A: Claude-Only (Current Production)**
```
Claude suggests -> Spotify resolves
```
- Pros: Simple, working now, flexible
- Cons: Unverified BPM, hallucination risk, may be 10-20 BPM off

**Option B: GetSongBPM Primary + Claude Fallback**
```
GetSongBPM searches by BPM -> Spotify resolves
  (fallback: Claude suggests -> Spotify resolves)
```
- Pros: Verified BPM primary, already implemented
- Cons: No energy data, limited genre filtering, 6M catalog (may miss niche tracks)

**Option C: Deezer Primary + Claude Fallback**
```
Deezer searches by BPM range -> Spotify resolves
  (fallback: Claude suggests -> Spotify resolves)
```
- Pros: Verified BPM, 90M+ catalog, free, no auth, BPM range search built-in
- Cons: No energy data, genre filtering is imprecise

**Option D: Claude + Deezer Verification (RECOMMENDED)**
```
Claude suggests songs for workout phase (genre-aware, context-aware)
    -> Deezer verifies BPM + confirms existence
        -> Spotify resolves URI for playback
```
- Pros: Best of both worlds -- Claude's creative/contextual intelligence + Deezer's verified BPM
- Cons: More API calls per request, slightly more latency (~1-2s extra)

**Option E: Multi-Source Fallback Chain (RECOMMENDED for production)**
```
1. GetSongBPM searches by BPM range (verified, direct search)
2. + Claude suggests songs (contextual, flexible)
    -> Deezer verifies Claude suggestions
3. Merge and deduplicate results
4. Score and rank (BPM match, energy, diversity, feedback)
5. Spotify resolves URIs
```
- Pros: Most robust, graceful degradation, combines verified and creative sources
- Cons: Most complex to implement (but each piece is simple)

---

## 10. Prioritized Recommendations

### Phase 1: Immediate (This Sprint)

#### P0-A: Activate GetSongBPM as Verified Source
- Already implemented in `apps/api/music_sources/getsongbpm.py`
- Complete API key registration at https://getsongbpm.com/api
- Add backlink to web app footer (satisfies their requirement)
- Test with real API key
- **Effort**: 2-4 hours (config + backlink + testing)
- **Impact**: Immediate verified BPM source

#### P0-B: Implement Deezer as New Music Source
- Create `apps/api/music_sources/deezer.py` implementing `MusicSource` ABC
- Two modes:
  - **Discovery mode**: Use advanced search with `bpm_min`/`bpm_max` parameters
  - **Verification mode**: Look up specific tracks by title/artist, return verified BPM
- Add `MUSIC_SOURCE=deezer` config option
- No API key required (Deezer Simple API)
- **Effort**: 4-6 hours
- **Impact**: 90M+ track catalog with verified BPM and BPM range search

### Phase 2: Near-Term (Next 2 Weeks)

#### P1-A: Implement Claude + Deezer Verification Hybrid
- After Claude suggests tracks, verify each via Deezer API
- If found: use Deezer's BPM (`verified_bpm=True`), confirm song exists
- If not found: keep Claude's estimate (`verified_bpm=False`), flag as unverified
- Track verification hit rate (% of Claude suggestions found in Deezer)
- **Effort**: 4-6 hours
- **Impact**: Verified BPM on most Claude suggestions

#### P1-B: Implement Multi-Source Fallback Chain
- GetSongBPM (primary, verified, search by BPM range)
- Deezer (secondary, verified, search by BPM range)
- Claude + Deezer verify (tertiary, flexible + verification)
- Claude only (last resort, unverified)
- Support `X-Music-Source` header per go-live plan for per-request source selection
- **Effort**: 4-6 hours
- **Impact**: Robust, graceful degradation when any single source is unavailable

#### P1-C: Enhance Claude Prompts for Better BPM Accuracy
- Add few-shot examples with known verified BPMs
- Include instruction to only suggest songs Claude is highly confident about
- Add confidence scoring (ask Claude to rate 1-5 for each suggestion)
- Add temperature variation to reduce repetition
- Test against Deezer verification to measure actual accuracy
- **Effort**: 2-3 hours
- **Impact**: Better unverified BPM accuracy, reduced hallucination

### Phase 3: Medium-Term (Next Month)

#### P2-A: Investigate Tidal API for BPM Verification
- Register for Tidal developer access
- Test whether BPM data is reliably present and accurate
- Add as another verification source alongside Deezer
- **Effort**: 2-3 hours
- **Impact**: Additional BPM verification coverage

#### P2-B: Download AcousticBrainz CC0 Data Dump
- Download the 3GB feature CSV from https://acousticbrainz.org/download ASAP (site may go offline)
- Extract MBID -> BPM mappings
- Import into Supabase (indexed by artist + title, MBID)
- Use as fast local lookup before hitting external APIs
- **Effort**: 8-12 hours
- **Impact**: Offline verified BPM for millions of pre-2022 tracks. Zero API cost.

### Phase 4: Long-Term (Next Quarter)

#### P3-A: Evaluate Soundcharts if Revenue Supports It
- If Crank monetizes, Soundcharts provides the richest audio features (energy, valence, danceability)
- Contact sales for startup/indie pricing
- **Decision gate**: Only pursue if monthly revenue exceeds Soundcharts cost

#### P3-B: Build Offline BPM Analysis Pipeline (If Needed)
- Use librosa (ISC license, cleanest for commercial use) or Essentia (AGPLv3, OK since we're open source)
- Analyze Deezer 30-second previews for tracks where no BPM data exists
- Store results in local BPM cache
- **Decision gate**: Only build if external BPM APIs prove insufficient for coverage

#### P3-C: Apple Music Playback Integration
- Per go-live plan, Apple Music is a "fast follow" after Spotify
- Apple Music API has no BPM data, but our BPM data comes from other sources
- Focus would be on playlist creation and playback for non-Spotify users

---

## Decision Summary

| Priority | Action | Cost | Effort | Impact |
|----------|--------|------|--------|--------|
| **P0** | Activate GetSongBPM (already coded) | Free | 2-4h | Verified BPM, search by BPM |
| **P0** | Implement Deezer music source | Free | 4-6h | 90M+ catalog, verified BPM, BPM range search |
| **P1** | Claude + Deezer verification hybrid | Free | 4-6h | Verified BPM on Claude suggestions |
| **P1** | Multi-source fallback chain | Free | 4-6h | Robustness and reliability |
| **P1** | Claude prompt improvements | ~$0.005/req | 2-3h | Better accuracy, less hallucination |
| **P2** | Tidal BPM verification | Free | 2-3h | Additional verification coverage |
| **P2** | AcousticBrainz local cache | Free | 8-12h | Offline BPM, faster lookups |
| **P3** | Soundcharts enrichment | $250+/mo | Medium | Rich audio features (energy, mood) |
| **P3** | Offline audio analysis pipeline | Free (OSS) | High | Self-sufficient BPM detection |

### The Recommended Production Architecture

```
User inputs workout text or photo
    |
    v
Claude parses workout into phases (warm-up, moderate, high intensity, etc.)
    |
    v
For each phase, determine BPM range from intensity mapping
    |
    v
[Parallel discovery]
  GetSongBPM: search by target BPM (verified)
  Deezer: search by BPM range (verified)
  Claude: suggest songs for phase context (unverified)
    |                                        |
    |                           Deezer: verify BPM + existence
    |                                        |
    v                                        v
Merge all candidates, deduplicate by (artist, title)
    |
    v
Scorer ranks: BPM match (50pts) + energy (30pts) + diversity (20pts) + feedback boost (15pts)
    |
    v
Composer assembles final playlist (max 30 BPM jump between tracks, duration tolerance +/-2min)
    |
    v
Spotify resolves URIs for playback
```

This gives us:
- **Verified BPM** from GetSongBPM (discovery) and Deezer (discovery + verification)
- **Flexible, context-aware discovery** from Claude (genre, mood, workout context)
- **Graceful degradation** when any single source is unavailable
- **Zero cost** for BPM data (all free APIs)
- **Existing playback** via Spotify (future: Apple Music, YouTube)

---

## Appendix A: BPM Range Cross-Reference

Our BPM mapping compared to workout music industry standards:

| Phase | Our Mapping | PulseMix (Hyperhuman) | jog.fm Range | Notes |
|-------|-------------|----------------------|-------------|-------|
| Warm-up | 100-120 | 60-90 (Yoga) | 100-120 | Ours aligns with CrossFit warm-up (more active than yoga) |
| Low | 120-130 | 80-110 (Pilates) | 120-140 | Reasonable |
| Moderate | 130-145 | 90-120 (Strength) | 140-160 | We run higher than PulseMix; CrossFit moderate is intense |
| High | 145-160 | 130-160 (Cardio) | 150-170 | Good alignment |
| Very High | 160-175 | 140-180 (HIIT) | 160-180+ | Good alignment |
| Cooldown | 80-100 | 60-90 (Yoga) | 80-110 | Similar |

## Appendix B: Sources Consulted

- [Soundcharts Audio Features API](https://soundcharts.com/en/audio-features-api)
- [Soundcharts API Pricing](https://developers.soundcharts.com/pricing)
- [GetSongBPM API Documentation](https://getsongbpm.com/api)
- [Spotify API Restrictions 2026 (Voclr.it)](https://voclr.it/news/why-spotify-has-restricted-its-api-access-what-changed-and-why-it-matters-in-2026/)
- [Spotify API Changes (Digital Music News)](https://www.digitalmusicnews.com/2024/12/01/spotify-tightens-api-access-removes-several-data-points/)
- [Spotify February 2026 Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)
- [Tunebat Music Database](https://tunebat.com/)
- [Tunebat API](https://tunebat.com/API)
- [Deezer Developer Portal](https://developers.deezer.com/)
- [TIDAL Developer Portal](https://developer.tidal.com/)
- [Apple Music API (BPM Forum Thread)](https://developer.apple.com/forums/thread/726626)
- [AcousticBrainz Project End](https://musicbrainz.wordpress.com/2022/02/16/acousticbrainz-making-a-hard-decision-to-end-the-project/)
- [AcousticBrainz Downloads](https://acousticbrainz.org/download)
- [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API)
- [librosa Documentation](https://librosa.org/doc/main/generated/librosa.feature.tempo.html)
- [Essentia TempoCNN](https://essentia.upf.edu/reference/std_TempoCNN.html)
- [Essentia Beat Detection Tutorial](https://essentia.upf.edu/tutorial_rhythm_beatdetection.html)
- [Cyanite AI Music Analysis API](https://cyanite.ai/2025/10/06/music-analysis-api-integration/)
- [Million Song Dataset](http://millionsongdataset.com/)
- [GiantSteps Tempo Dataset](https://github.com/GiantSteps/giantsteps-tempo-dataset)
- [Music Recommendation with LLMs (arXiv:2511.16478)](https://arxiv.org/html/2511.16478)
- [Last.fm API](https://www.last.fm/api/show/track.getInfo)
- [jog.fm](https://jog.fm/)
- [RockMyRun](https://www.rockmyrun.com/)
- [BPMDatabase.com](https://www.bpmdatabase.com/)
- [SongData.io](https://songdata.io/)
- [ShazamKit](https://developer.apple.com/shazamkit/)
- [Feed.fm](https://www.feed.fm)
- [Realtime BPM Analyzer](https://github.com/dlepaux/realtime-bpm-analyzer)
- [Music APIs Collection (GitHub Gist)](https://gist.github.com/0xdevalias/eba698730024674ecae7f43f4c650096)
