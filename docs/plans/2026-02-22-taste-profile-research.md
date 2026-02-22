# User Taste Profile Research

> **Status**: Research complete, not yet implemented. Incorporate into next feature planning cycle.

**Goal**: Understand user music preferences to inform playlist generation without relying on deprecated Spotify recommendation APIs.

## API Landscape (Feb 2026)

### Spotify — User Top Items

- **Endpoint**: `GET /me/top/{type}` (type = `artists` or `tracks`)
- **Status**: Still available
- **Scopes**: `user-top-read` (we already have Spotify OAuth)
- **Time ranges**: `short_term` (4 weeks), `medium_term` (6 months), `long_term` (several years)
- **Use case**: Seed taste profile on first sign-in with top 20 artists
- **Docs**: https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks

### Spotify — Deprecated Endpoints (DO NOT USE)

These return 403 for new apps since Nov 2024:
- Recommendations API (`/recommendations`)
- Audio Features API (`/audio-features`)
- Audio Analysis API (`/audio-analysis`)
- Get Artist's Top Tracks (`/artists/{id}/top-tracks`) — removed Feb 2026

### Last.fm — Free Listening History

- **Endpoints**: `user.getTopArtists`, `user.getTopTracks`, `user.getLovedTracks`
- **Auth**: API key only (free). `getTopArtists` works on public profiles without user auth.
- **Commercial use**: Contact partners@last.fm for commercial/research use
- **Use case**: Optional deep enrichment for power users who link their Last.fm account
- **Docs**: https://www.last.fm/api

### Spotify + Last.fm Scrobbling

Spotify still scrobbles to Last.fm. Users connect via Last.fm's website (not Spotify settings). Tracks log after 240 seconds or 50% of song length.

### Apple Music — MusicKit

- **Capabilities**: User library, recommendations, recently played
- **Requirements**: Apple Developer membership, MusicKit framework, Apple Music subscriber
- **Use case**: Low priority — our app is Spotify-centric
- **Docs**: https://developer.apple.com/musickit/

## Comparison Matrix

| Source | Taste Signal | Auth Needed | Coverage | Effort |
|--------|-------------|-------------|----------|--------|
| Spotify `/me/top` | Top artists + tracks by time range | Already have OAuth | Most users | Low |
| Last.fm | Deep listening history, loved tracks | API key (free) + user links account | Some users | Medium |
| Apple Music | Library + recommendations | Apple Dev + MusicKit | Few users | High |
| In-app signals | Genre chips, feedback, saves, boost history | None | All users | Already started |

## Recommended Strategy

### Tier 1: In-App Taste Profile (foundation, all users)

Build from signals we already collect:
- **Genre chips** — selected at generation time (already implemented)
- **Track feedback** — thumbs up/down (already implemented)
- **Saved playlists** — implicit genre/artist preferences
- **Boost history** — what users boost tells us what energizes them
- **Artist frequency** — which artists appear most in their generated playlists

This builds over time and works for every user regardless of streaming service.

### Tier 2: Spotify Top Artists Import (quick win, most users)

One API call at sign-in or on-demand:
```
GET /me/top/artists?time_range=medium_term&limit=20
```

Seeds the taste profile on day one. Eliminates cold-start problem. We already have the OAuth token.

### Tier 3: Last.fm Integration (optional enrichment, power users)

- Link Last.fm account for deeper history
- Import top artists/tracks over configurable time periods
- Useful for users with years of scrobble data

## How to Use This in Playlist Generation

Taste profile data feeds into the music curator agent:
- **Artist weighting**: Boost scores for tracks by preferred artists
- **Genre affinity**: Weight genre selection based on listening history
- **Discovery balance**: Mix familiar artists (70%) with new discoveries (30%)
- **Negative signals**: Exclude artists from thumbs-down feedback

## Related Documents

- `2026-02-22-ml-pipeline-design.md` — Multi-step pipeline design (HR model, energy mapping)
- `2026-02-21-music-source-research.md` — Music source API comparison (Deezer recommended next)
- `2026-02-21-design-expert-panel.md` — UX feedback and prioritized improvements
