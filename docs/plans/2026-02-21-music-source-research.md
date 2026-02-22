# Music Source Research: BPM Data Alternatives

**Date**: 2026-02-21
**Context**: Our CrossFit playlist generator needs to find songs at specific BPM ranges for different workout phases. This document evaluates all viable alternatives for obtaining BPM/tempo data for music tracks.

## Current State

| Source | Status | Notes |
|--------|--------|-------|
| GetSongBPM API | Active, in codebase | Free, requires backlink attribution |
| SoundNet / RapidAPI Track Analysis | Dead | Acquired by Nokia, endpoint no longer responds |
| Claude AI suggestions | Active, in codebase | Works but BPM accuracy is unverified |
| Spotify Audio Features API | Deprecated Nov 2024 | Returns 403 for new apps |
| Mock source | Active, in codebase | 50+ hardcoded rock tracks for dev/testing |

---

## 1. BPM Database APIs

### 1a. GetSongBPM (already integrated)

- **URL**: https://getsongbpm.com/api
- **Availability**: Active. Registration form on the API page.
- **Cost**: Free. Mandatory backlink to getsongbpm.com required on your site or app store listing, or account is suspended without notice.
- **Rate limits**: Not publicly documented; appears generous for moderate use.
- **Accuracy**: Database-sourced BPM values. Generally reliable for well-known tracks.
- **Coverage**: Claims "millions of song tempos." Skews toward popular Western music.
- **Integration**: Already implemented in `apps/api/music_sources/getsongbpm.py`. Uses `/tempo/` endpoint with a target BPM, then filters results to our min/max range.
- **Limitations**: No genre filtering in the tempo search endpoint. No duration data returned (we default to 210,000ms). Search is by exact BPM rather than range, so we search the midpoint and filter.
- **Verdict**: Keep as primary source. Registration can be slow but the API works well once you have a key.

### 1b. Tunebat / Songstats API

- **URL**: https://tunebat.com/API (powered by Songstats)
- **Availability**: Active. Tunebat has 70M+ tracks. API access is through their partner Songstats.
- **Cost**: Songstats API pricing is not publicly listed; you must contact sales. Tunebat's "Full Package" consumer plan is separate from API access.
- **Rate limits**: Unknown; requires sales conversation.
- **Accuracy**: Tunebat's BPM/key data was historically sourced from Spotify's Audio Features API. With that API now deprecated, their data source for new tracks is unclear. Existing catalog data should still be accurate.
- **Coverage**: 70M+ tracks including Spotify, Apple Music, YouTube, TikTok, Beatport catalogs.
- **Integration complexity**: Medium. Songstats API is well-documented at docs.songstats.com. Would need a new `MusicSource` implementation.
- **Limitations**: Pricing unknown and likely enterprise-oriented. Data provenance post-Spotify-deprecation is a question mark. Not clear if you can search by BPM range directly.
- **Verdict**: Worth investigating if we need a larger catalog. The sales-gated pricing is a barrier for a small/free project.

### 1c. Soundcharts Audio Features API

- **URL**: https://soundcharts.com/en/audio-features-api
- **Availability**: Active. 1,000 free requests (no credit card), then paid tiers.
- **Cost**: Starts at $250/month for 500K requests. Enterprise tiers available.
- **Rate limits**: 10,000 requests/minute across all plans.
- **Accuracy**: High. Provides BPM, key, time signature, energy, valence, danceability, and more. Does not require audio file upload -- you look up by UUID, ISRC, or platform IDs (Spotify, Apple Music).
- **Coverage**: "Millions of tracks" across major platforms.
- **Integration complexity**: Medium. REST API with standard identifiers. Good documentation.
- **Limitations**: $250/month minimum is expensive for a free product. The 1,000 free requests are good for prototyping but not production.
- **Verdict**: Too expensive for our use case right now. Could be viable if we monetize and need high-quality, high-volume BPM data.

### 1d. Cyanite AI Music Analysis API

- **URL**: https://cyanite.ai / https://api-docs.cyanite.ai
- **Availability**: Active since 2019. GraphQL API.
- **Cost**: Custom pricing; must contact sales. Free tier for academic researchers ("Cyanite for Innovators" program).
- **Rate limits**: Unknown; depends on plan.
- **Accuracy**: AI-powered analysis providing BPM, key, genre, mood, mood waves, energy, instruments. Analysis is performed on audio, not just metadata, so BPM accuracy should be high.
- **Coverage**: Primarily aimed at production music libraries and publishers. You can analyze your own audio or search their partners' catalogs.
- **Integration complexity**: Medium-high. GraphQL API (not REST). Would need to upload audio or have tracks in their system.
- **Limitations**: Enterprise-oriented pricing. Not a simple "search by BPM" API -- more of a full music intelligence platform. Suggested as the replacement for Spotify Audio Features by the community, but the pricing model is different.
- **Verdict**: Overkill for our needs. Better suited for music libraries and labels.

### 1e. SongBPM.com

- **URL**: https://songbpm.com
- **Availability**: Website is active, but there is no public developer API.
- **Integration**: Would require scraping, which is fragile and likely against their ToS.
- **Verdict**: Not viable as a programmatic source.

### 1f. BPMDatabase.com

- **URL**: https://www.bpmdatabase.com
- **Availability**: Website active, no public API.
- **Verdict**: Not viable as a programmatic source.

---

## 2. Audio Analysis (Open Source BPM Detection)

These libraries analyze audio files directly to detect BPM. They require access to audio samples, which means either the user uploads audio or we have a licensed audio source.

### 2a. Essentia (Python/C++)

- **URL**: https://essentia.upf.edu
- **Availability**: Open source (AGPLv3). Actively maintained by the Music Technology Group at UPF Barcelona.
- **Cost**: Free (AGPL license -- copyleft, requires sharing source code if distributed).
- **Accuracy**: High. `RhythmExtractor2013` is recommended for BPM/beat detection with two modes: "multifeature" (slower, more accurate) and "degara" (faster). Used in academic MIR research. Also provides energy, key, mood, and many other features.
- **Performance**: Fast. Completed benchmarks in ~4 minutes (vs. librosa's ~2 hours on the same dataset).
- **Integration complexity**: Medium. Available via pip (`essentia`). C++ backend with Python bindings.
- **Limitations**: Requires access to audio files. Cannot help us search for tracks -- only analyze audio we already have. AGPL license may be a concern for commercial use.
- **WebAssembly variant**: `essentia.js` runs in the browser via WebAssembly. Could theoretically analyze Spotify preview clips client-side, but this is a stretch.
- **Verdict**: Best-in-class for audio analysis accuracy and speed. Useful if we ever need to verify BPM claims from other sources, or if we build a pipeline that analyzes audio previews.

### 2b. librosa (Python)

- **URL**: https://librosa.org
- **Availability**: Open source (ISC license -- permissive). Widely used.
- **Cost**: Free.
- **Accuracy**: Good. Uses dynamic programming beat tracker (`librosa.beat.beat_track()`). Industry standard for MIR in Python (used by Spotify and YouTube Music internally).
- **Performance**: Slow. Benchmarked at ~2 hours on the same dataset Essentia completed in 4 minutes. Not suitable for real-time or high-throughput.
- **Integration complexity**: Easy. Pure Python with numpy/scipy. `pip install librosa`.
- **Limitations**: Same as Essentia -- requires audio files. Significantly slower than Essentia.
- **Verdict**: Good for offline analysis or prototyping. Too slow for real-time use in production.

### 2c. madmom (Python)

- **URL**: https://github.com/CPJKU/madmom
- **Availability**: Open source. Still considered state-of-the-art for beat tracking.
- **Cost**: Free.
- **Accuracy**: Very high. Uses RNNs with a dynamic Bayesian network (DBN) approximated by HMM. Multi-model setup with genre-specific RNNs. May round BPM to nearest integer.
- **Performance**: Better suited for offline/batch processing. Slower than Essentia, faster than librosa.
- **Integration complexity**: Medium. Python with compiled C extensions.
- **Limitations**: Requires audio files. Better for offline batch work than real-time analysis.
- **Verdict**: Best accuracy for beat tracking specifically, but requires audio access.

### 2d. aubio (Python/C)

- **URL**: https://aubio.org
- **Availability**: Open source (GPLv3). Python bindings available.
- **Cost**: Free.
- **Accuracy**: Good. Designed for real-time audio analysis.
- **Performance**: Fast. Designed for real-time beat detection.
- **Integration complexity**: Easy. `pip install aubio`.
- **Limitations**: Requires audio files. GPL license.
- **Verdict**: Good for real-time scenarios. Less accurate than madmom or Essentia for BPM estimation.

### 2e. Tempo-CNN (Python)

- **URL**: https://github.com/hendriks73/tempo-cnn
- **Availability**: Open source. Published at ISMIR 2018.
- **Cost**: Free.
- **Accuracy**: Deep learning approach using CNNs on mel spectrograms. Supports local tempo estimation (tempo changes within a track). Has `--interpolate` flag for sub-integer BPM precision.
- **Integration complexity**: Medium. Available via pip. Also integrated into Essentia as `es.TempoCNN()`.
- **Limitations**: Requires audio files. Neural network models need to be downloaded.
- **Verdict**: Interesting for advanced tempo analysis. Best used through Essentia's integration.

### Audio Analysis Summary

| Library | Accuracy | Speed | License | Best For |
|---------|----------|-------|---------|----------|
| Essentia | High | Fast | AGPL | Production BPM verification |
| madmom | Very High | Medium | BSD | Highest-accuracy beat tracking |
| librosa | Good | Slow | ISC | Prototyping, research |
| aubio | Good | Very Fast | GPL | Real-time analysis |
| Tempo-CNN | High | Medium | MIT | Local tempo / tempo changes |

**Key insight**: Audio analysis libraries are excellent for *verifying* BPM but cannot help us *discover* tracks. They complement BPM databases rather than replacing them.

---

## 3. MusicBrainz / AcousticBrainz

### 3a. MusicBrainz

- **URL**: https://musicbrainz.org
- **Availability**: Active. Open music encyclopedia with 2.6M artists, 4.7M releases, 35.2M recordings.
- **Cost**: Free. Open data (CC license).
- **Rate limits**: 1 request/second for the API.
- **BPM data**: MusicBrainz itself does NOT store BPM data. It stores metadata (artist, release, recording IDs).
- **Integration**: Good REST API. Useful for resolving track identities (MBIDs) which can then be used to look up BPM from other sources.
- **Verdict**: Useful as a track identity resolver, not as a BPM source.

### 3b. AcousticBrainz

- **URL**: https://acousticbrainz.org
- **Availability**: Project ended in 2022. No longer accepting new data. Website and API "continue to be available" but this is on borrowed time.
- **Cost**: Free. All data is CC0 (public domain).
- **BPM data**: Yes! Low-level data includes BPM, beat positions, rhythm descriptors. Indexed by MusicBrainz Recording ID (MBID).
- **Data dumps available**: Lowlevel (589GB compressed), Highlevel (39GB), Feature CSV (3GB), Sample (2GB).
- **Rate limits**: Not documented for the API (may be gone entirely).
- **Accuracy**: Audio-analyzed BPM data from Essentia. Multiple BPM metrics per recording (mean, median, peaks).
- **Coverage**: Significant but frozen at 2022 data. No tracks released after 2022 will have data.
- **Integration complexity**: Could use the API (while it lasts) or download the 3GB feature CSV dump and build a local lookup table.
- **Limitations**: Frozen dataset. Website may go offline at any time. No new music coverage.
- **Verdict**: The 3GB feature CSV dump (CC0 licensed) could be downloaded and used as a local BPM lookup cache. This would give us verified BPM for millions of recordings at zero API cost. However, it only covers music released before 2022. Worth considering as a supplementary source.

---

## 4. Streaming Platform APIs

### 4a. Spotify Web API

- **Status**: Audio Features endpoint deprecated November 27, 2024. Returns 403 for new applications. Only apps with pre-existing quota extensions are unaffected.
- **What still works**: Search, playback control, playlist creation/management, user library, track metadata (title, artist, album, duration, popularity). These are still critical for our Spotify integration.
- **What does not work**: `GET /audio-features/{id}` (BPM, energy, danceability, etc.), `GET /audio-analysis/{id}`, `GET /recommendations`.
- **Why deprecated**: Spotify stated concerns about developers training AI models on the data.
- **Verdict**: Cannot be used for BPM data. Still essential for search, playback, and playlist export.

### 4b. Deezer API

- **URL**: https://developers.deezer.com/api
- **Availability**: Active. Free "Simple API" with no authentication required for basic access.
- **Cost**: Free.
- **Rate limits**: Quota-based (exact limits not publicly documented). Returns HTTP 429 when exceeded.
- **BPM data**: YES. The `/track/{id}` endpoint returns a `bpm` field (float). Not returned in album track listings -- requires individual track requests.
- **BPM search**: The advanced search endpoint supports `bpm_min` and `bpm_max` parameters. Example: `/search?q=bpm_min:"120" bpm_max:"145"`.
- **Coverage**: 90M+ tracks.
- **Integration complexity**: LOW. Simple REST API. No auth required for the Simple API. Python client available (`deezer-python`).
- **Limitations**: BPM field may not be populated for all tracks. Cannot filter by genre AND BPM simultaneously in advanced search (need to combine with other search terms). No energy/mood data.
- **Verdict**: STRONG CANDIDATE. Free, no auth required, has BPM search with min/max range, and a massive catalog. The lack of genre filtering is a limitation but can be worked around by including genre terms in the search query. Should be prioritized for implementation.

### 4c. Apple Music API

- **URL**: https://developer.apple.com/documentation/applemusicapi
- **Availability**: Active. Requires Apple Developer account ($99/year).
- **Cost**: $99/year Apple Developer membership.
- **BPM data**: NOT available through the Apple Music API Song object. The platform tracks tempo internally for algorithmic recommendations but does not expose it.
- **Workarounds**: The `MediaPlayer` framework has a `beatsPerMinute` property for local library items, but this only works on-device and only for the user's own library.
- **Verdict**: Not viable for BPM data. Could be used for Apple Music playback integration (separate concern).

### 4d. Tidal Developer API

- **URL**: https://developer.tidal.com
- **Availability**: Active developer portal.
- **BPM data**: API responses appear to include BPM values in track metadata based on documentation examples (142 BPM, 150 BPM, 92 BPM shown).
- **Cost**: Free developer access; specifics unclear.
- **Integration complexity**: Medium. OAuth2 authentication required.
- **Coverage**: 100M+ tracks.
- **Limitations**: Tidal has a smaller user base than Spotify/Apple Music. Developer API documentation is less mature. Would need to verify BPM field availability and coverage.
- **Verdict**: Worth investigating further. If BPM data is reliably available, this could be a supplementary source. Lower priority than Deezer due to smaller user base and less documentation.

### 4e. iTunes Search API

- **URL**: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI
- **Availability**: Active. No authentication required.
- **Cost**: Free.
- **BPM data**: No BPM/tempo field in search results.
- **Verdict**: Not useful for BPM data. Could be used for track metadata lookup.

---

## 5. AI-Based Approaches

### 5a. Claude Music Suggestions (already integrated)

- **Implementation**: `apps/api/music_sources/claude_suggestions.py`
- **How it works**: Prompts Claude to suggest songs matching a BPM range and genre. Claude returns song names, artists, and estimated BPMs from its training knowledge.
- **Accuracy**: BPM estimates are unverified and may be inaccurate. Claude may hallucinate tracks that do not exist.
- **Cost**: Per-token Anthropic API costs. Roughly $0.001-0.01 per request depending on model.
- **Latency**: 1-3 seconds per request.
- **Verdict**: Good fallback. Should be used as last resort and ideally cross-verified with a BPM database.

### 5b. LLM + BPM Database Hybrid (recommended approach)

Recent research (ISMIR 2025, RecSys 2025) shows LLMs are effective at music recommendation when grounded in catalog data. The recommended architecture:

1. **LLM as query interpreter**: Use Claude to understand the workout context and suggest track characteristics (not specific tracks).
2. **BPM database as catalog**: Use GetSongBPM or Deezer to find actual tracks matching those characteristics.
3. **LLM as re-ranker**: Optionally use Claude to re-rank results for workout flow and energy progression.

This avoids the hallucination problem while leveraging Claude's understanding of music/workout context.

**Key research findings**:
- Chain-of-Thought prompting improves recommendation quality ("Generate a 30-minute workout playlist by: (1) selecting high-energy tracks with BPM 140-160, (2) filtering for motivational lyrics, (3) ordering by increasing intensity...")
- LLMs can parse open-vocabulary constraints (valence, arousal, key/mode, content filtering)
- Accuracy improves when LLMs are grounded in real catalog data rather than generating from memory

- **Verdict**: Our current architecture already follows this pattern (Claude parses workout, music source finds tracks, scorer ranks). The improvement would be having Claude also suggest optimal BPM/energy targets per phase rather than relying solely on the static BPM mapping table.

### 5c. Tempo-CNN / ML-Based Audio Analysis

- **See Section 2e** above. Deep learning models that estimate BPM from audio spectrograms.
- **Verdict**: Useful for verification, not discovery.

---

## 6. Pre-Built Workout Music Services

### 6a. Feed.fm

- **URL**: https://www.feed.fm
- **What it does**: End-to-end music licensing + API for fitness apps. Curated BPM/genre/workout-specific stations. Full music licensing included.
- **Cost**: Custom pricing based on song plays. Must speak with a "music specialist."
- **Integration**: SDKs for iOS, Android, JavaScript. Well-documented.
- **Stats**: 3.2x more time spent in-app for users who use integrated workout music.
- **Limitations**: Black box -- you do not control the music selection algorithm. Likely expensive for a free product. You cannot use your own music sources. Licensing-oriented (they handle royalties).
- **Verdict**: Wrong fit. We want to control the curation algorithm and let users play via Spotify/Apple Music. Feed.fm is for apps that want to embed a licensed music player.

### 6b. PulseMix (Hyperhuman)

- **URL**: https://blog.hyperhuman.cc/pulsemix-smart-workout-music/
- **What it does**: BPM-aware music for fitness video content. Auto-matches music to workout categories (HIIT 140-180 BPM, Strength 90-120 BPM, Yoga 60-90 BPM, etc.).
- **Cost**: Part of Hyperhuman platform pricing.
- **Integration**: Available via Hyperhuman Content API. Returns playlist links for Spotify, Apple Music, YouTube, Amazon Music.
- **Limitations**: Designed for video content creators, not end-user apps. Royalty-free music library, not popular tracks.
- **Verdict**: Interesting BPM-to-workout mapping reference, but not a data source we can use. Their BPM ranges per workout type are a useful validation of our own mapping.

### 6c. RockMyRun

- **URL**: https://www.rockmyrun.com
- **What it does**: Consumer app for workout music. Stations by BPM, genre, activity. Adjusts tempo to match step cadence.
- **Cost**: Consumer subscription app.
- **Integration**: No public API.
- **Verdict**: Competitor, not a data source.

### 6d. PowerMusicNow

- **What it does**: Group fitness music player with BPM adjustment.
- **Integration**: No public API.
- **Verdict**: Not a data source.

---

## 7. Community BPM Databases

### 7a. AcousticBrainz Data Dumps (CC0)

- **See Section 3b**. 3GB feature CSV with BPM data for millions of recordings.
- **License**: CC0 (public domain). No attribution required.
- **Verdict**: Best free offline BPM data source. Frozen at 2022.

### 7b. Million Song Dataset

- **URL**: http://millionsongdataset.com
- **Availability**: Free. 280GB full dataset, smaller subsets available on Kaggle.
- **Coverage**: 1 million tracks. Includes tempo, loudness, key, time signature.
- **Limitations**: Dataset from ~2011. Only covers tracks available at that time. 280GB is impractical to host.
- **Accuracy**: Tempo data was computed by The Echo Nest (later acquired by Spotify).
- **Verdict**: Too old and too large. AcousticBrainz feature dump is a better option for cached BPM lookups.

### 7c. GiantSteps Tempo Dataset

- **URL**: https://github.com/GiantSteps/giantsteps-tempo-dataset
- **What it is**: Annotated BPM data for electronic dance music tracks.
- **Coverage**: Small dataset (~600 tracks). EDM-focused.
- **Verdict**: Too small and genre-specific. Useful only for benchmarking BPM detection algorithms.

### 7d. SongData.io

- **URL**: https://songdata.io
- **What it does**: BPM and key lookup for songs.
- **API**: No public developer API found.
- **Verdict**: Not viable as a programmatic source.

---

## 8. Hybrid Approaches (Recommendations)

Based on this research, here are the recommended strategies for our project, ordered by implementation priority.

### Strategy A: Deezer API as New Primary Source (HIGH PRIORITY)

**Why**: Free, no auth required for Simple API, has BPM search with `bpm_min`/`bpm_max`, and 90M+ track catalog. This is the single best replacement for our needs.

**Implementation**:
```python
# New file: apps/api/music_sources/deezer.py
# Search: GET https://api.deezer.com/search?q=bpm_min:"130" bpm_max:"145" rock
# Track detail: GET https://api.deezer.com/track/{id} -> includes bpm field
```

**Effort**: Low (half day). Follows our existing `MusicSource` ABC pattern. No API key needed.

**Risk**: BPM field may not be populated for all tracks. Rate limits are undocumented. Deezer's user base is smaller than Spotify's in the US market.

### Strategy B: GetSongBPM as Verified Source (KEEP, already done)

Keep the existing GetSongBPM integration as a reliable BPM-verified source. It has known BPM accuracy and a straightforward API.

**Action**: Complete the sign-up process and add the backlink attribution.

### Strategy C: Claude + Database Cross-Verification (MEDIUM PRIORITY)

Enhance the Claude music source to cross-verify its suggestions against a BPM database:

1. Claude suggests tracks with estimated BPMs for a workout phase.
2. For each suggestion, look up the actual BPM via GetSongBPM or Deezer.
3. If the real BPM matches (within +/- 5 BPM), keep the track. Otherwise, discard.

This gives us Claude's excellent music taste with verified BPM data.

**Effort**: Medium (1 day). Requires composing two existing sources.

### Strategy D: AcousticBrainz Offline Cache (LOW PRIORITY, future)

Download the 3GB AcousticBrainz feature CSV (CC0 licensed) and build a local BPM lookup table:

1. Extract MBID -> BPM mappings from the CSV.
2. Use MusicBrainz API (free, 1 req/sec) to resolve track names to MBIDs.
3. Look up BPM from our local cache.

**Effort**: Medium (1-2 days for ETL pipeline). Free, no rate limits on lookups.

**Risk**: Frozen at 2022 data. Website may go offline, so download the dump now.

### Strategy E: Essentia BPM Verification (LOW PRIORITY, future)

If we ever have access to audio previews (e.g., Spotify 30-second previews, Deezer previews), we could verify BPM claims using Essentia audio analysis:

1. Fetch a 30-second preview URL from Spotify/Deezer.
2. Run `RhythmExtractor2013` on the audio.
3. Compare detected BPM with the claimed BPM.
4. Flag discrepancies.

**Effort**: High (2-3 days including audio pipeline). Adds significant infrastructure complexity.

**Risk**: Preview URLs may not always be available. Audio processing adds latency.

---

## Decision Matrix

| Source | BPM Search | Free | No Auth | Catalog Size | Accuracy | Effort | Recommendation |
|--------|-----------|------|---------|-------------|----------|--------|----------------|
| **Deezer API** | Yes (bpm_min/max) | Yes | Yes | 90M+ | Good | Low | **Implement now** |
| **GetSongBPM** | Yes (single BPM) | Yes | Key required | Millions | Good | Done | **Keep** |
| **Claude suggestions** | N/A (generates) | Per-token | Key required | Unlimited | Low | Done | **Keep as fallback** |
| Soundcharts | Yes | $250/mo min | Key required | Millions | High | Medium | Too expensive |
| Tunebat/Songstats | Maybe | Unknown | Key required | 70M+ | Good | Medium | Sales-gated |
| Cyanite | Analysis only | Custom | Key required | Upload only | Very High | High | Overkill |
| Tidal | Maybe | Free? | OAuth | 100M+ | Unknown | Medium | Investigate later |
| AcousticBrainz dump | Offline lookup | Free (CC0) | None | Millions | High | Medium | Good supplement |
| Essentia | Analysis only | Free (AGPL) | None | N/A | Very High | High | Verification only |
| Feed.fm | Curated only | Custom | SDK | Licensed | N/A | Low | Wrong fit |

---

## Recommended Execution Order

1. **Now**: Implement Deezer API music source (`apps/api/music_sources/deezer.py`). Free, no auth, BPM range search. Add `MUSIC_SOURCE=deezer` option.
2. **Now**: Complete GetSongBPM registration and add backlink. Keep as secondary source.
3. **Soon**: Build Claude + Deezer cross-verification hybrid (Strategy C). Claude suggests, Deezer verifies BPM.
4. **Later**: Download AcousticBrainz feature dump before the website goes offline. Build offline BPM cache.
5. **Later**: Investigate Tidal API for BPM data once our core pipeline is stable.
6. **If needed**: Add Essentia audio analysis for BPM verification of preview clips.

---

## Appendix: BPM Range Reference (Workout Types)

Cross-referencing our BPM mapping with PulseMix's workout categories:

| Workout Type | Our Mapping | PulseMix Mapping | Notes |
|-------------|-------------|-----------------|-------|
| Warm-up / Yoga | 100-120 | 60-90 (Yoga) | We run higher; CrossFit warm-ups are more active |
| Low / Pilates | 120-130 | 80-110 (Pilates) | Similar |
| Moderate / Strength | 130-145 | 90-120 (Strength) | We run higher; CrossFit moderate is more intense |
| High / Cardio | 145-160 | 130-160 (Cardio) | Good alignment |
| Very High / HIIT | 160-175 | 140-180 (HIIT) | Good alignment |
| Cooldown | 80-100 | 60-90 (Yoga) | Similar |
