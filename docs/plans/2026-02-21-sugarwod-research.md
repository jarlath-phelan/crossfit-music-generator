# CrossFit Workout Platform API Research

**Date**: 2026-02-21 (updated 2026-02-21 with additional research)
**Purpose**: Evaluate feasibility of auto-pulling daily WODs from CrossFit workout platforms for Crank (CrossFit Playlist Generator).
**Context**: Task 14 (Stream D) from the go-live plan v2.
**600,000+** athletes use SugarWOD globally, making it the largest CrossFit workout tracking platform.

---

## Table of Contents

1. [SugarWOD](#1-sugarwod)
2. [Beyond The Whiteboard (BTWB)](#2-beyond-the-whiteboard-btwb)
3. [Wodify](#3-wodify)
4. [CompTrain / Mayhem](#4-comptrain--mayhem)
5. [CrossFit Games API](#5-crossfit-games-api)
6. [Other Platforms](#6-other-platforms)
7. [Feasibility Summary](#7-feasibility-summary)
8. [Recommended Implementation Plan](#8-recommended-implementation-plan)

---

## 1. SugarWOD

### API Availability: YES -- Public REST API (v2, beta)

SugarWOD has the most developer-friendly API in the CrossFit ecosystem. They published an open API in August 2017 and it remains active.

### Base URL

```
https://api.sugarwod.com/v2
```

### Authentication

- **Method**: API Key (per-affiliate)
- **Delivery**: `Authorization: YOUR-API-KEY-HERE` header (preferred) or `?apiKey=YOUR-API-KEY-HERE` query param
- **Key Generation**: Gym owners create keys at `https://app.sugarwod.com/affiliate/settings/developer-keys`
- **Scope**: Each API key is scoped to a single affiliate (gym). Keys grant access to the entire gym's data.
- **Important**: API keys should NEVER be embedded in client-side code. Server-to-server only, HTTPS required.

### Who Can Get API Keys

Only gym owners/admins with an active SugarWOD subscription can generate API keys. Individual athletes cannot create keys. This means our app would need a partnership arrangement or individual gym opt-in to access their WOD data.

### Data Format

- **Standard**: JSON:API specification (https://jsonapi.org)
- **Date conventions**: Timestamp attributes use `_at` suffix; integer date attributes use `_date_int` suffix (e.g., `scheduled_date_int: 20170512` for May 12, 2017)
- **Pagination**: Limit/skip based -- `?page[skip]=100&page[limit]=50` (default page size: 25)
- **Text format**: Workout descriptions support Markdown formatting

### Available Endpoints (v2)

| Route | Description |
|-------|-------------|
| `GET /v2/box` | Affiliate info (good for verifying API key) |
| `GET /v2/athletes` | Athletes in the affiliate |
| `GET /v2/workouts` | Workouts (the key endpoint for us) |
| `GET /v2/workoutshq` | CrossFit HQ mainsite workouts (same format as workouts, no /athletes sub-route) |
| `GET /v2/tracks` | Programming tracks (e.g., "Workout of the Day", "Barbell Club", "Competitors") |
| `GET /v2/movements` | Movement library (e.g., "Box Jump", "Back Squat") |
| `GET /v2/benchmarks` | Benchmark workouts |
| `GET /v2/barbelllifts` | Barbell lift data |

### Workout Data Structure (inferred from docs and community projects)

```json
{
  "data": {
    "type": "workouts",
    "id": "abc123",
    "attributes": {
      "title": "Fran",
      "description": "21-15-9\nThrusters (95/65)\nPull-ups",
      "scoring_type": "time",
      "scheduled_date_int": 20260221,
      "scheduled_at": "2026-02-21T00:00:00Z",
      "movement_ids": ["thruster", "pull-up"],
      "track_id": "default",
      "is_benchmark": true
    },
    "relationships": {
      "track": { ... },
      "movements": { ... }
    }
  }
}
```

**Scoring types**: Time, Rounds+Reps, Reps, Load, Distance, Points, Calories, Decimal, Other

**Multi-set scoring calculations**: Minimum (e.g., Tabata worst set), Sum Total (e.g., Fight Gone Bad), Average, First, Last

**Scoring types map to workout styles**, which is useful for Crank's intensity estimation:
- Time = "For Time" workouts (Fran, Grace) -- high intensity, short duration
- Rounds+Reps / Reps = AMRAP workouts -- sustained moderate-high intensity
- Load = Strength/lifting -- heavy effort, long rest periods
- Calories / Distance = Machine-based or running -- steady state cardio

### Special: WorkoutsHQ Endpoint

The `/v2/workoutshq` endpoint provides CrossFit HQ mainsite programming. This is the same data that powers the CrossFit Affiliate Programming (CAP) track. Same format as regular workouts, but no athlete data.

### Rate Limits

- Rate limited per API key
- Returns `429 Too Many Requests` when exceeded
- Exact numerical limits are not publicly documented (likely need to contact SugarWOD for specifics)
- Terms prohibit "excessive or abusive usage"

### Terms of Service

Source: https://www.sugarwod.com/developers-terms-service/

- **License**: Non-exclusive, non-assignable, non-transferable license to use the APIs for developing applications
- You MAY charge for your application
- You may NOT sell, rent, lease, sublicense, redistribute, or syndicate access to the SugarWOD API itself
- SugarWOD can suspend or terminate API access at any time without notice
- They can limit access if your app negatively affects their service
- License cannot be assigned or delegated, including during a change of control
- Third-party applications are not considered part of SugarWOD's service
- Still labeled as "beta" -- data formats may change

### Corporate Context

SugarWOD was acquired by **Daxko** in May 2019 (press release: https://www.prnewswire.com/news-releases/daxko-acquires-sugarwod-to-become-the-unrivaled-software-provider-for-affiliate-gyms-300851711.html). Daxko also owns **Zen Planner**. As of January 2026, the two platforms are being more tightly integrated, with a combined roadmap focused on reducing friction and improving performance. SugarWOD has stated they will continue to work with other gym management platforms (MindBody, Pike13, PushPress, etc.). The API remains active and accessible. This corporate backing from Daxko suggests the API will remain stable, though the "at any time without notice" termination clause remains a risk factor.

### Webhook API

A preliminary Webhook API exists for select partners. Webhook body schema mirrors standard API response bodies. Could enable real-time "new workout published" notifications.

### Marketplace / Programming Partners

SugarWOD has a Workout Marketplace with programming from: CrossFit Affiliate Programming (CAP), CompTrain, PRVN Fitness, Invictus, WODprep, and many others. All of these flow through SugarWOD's data model.

### Community Projects and Libraries

No official SDK exists for any language. The community ecosystem is small but demonstrates API viability:

| Project | Language | Description | URL |
|---------|----------|-------------|-----|
| **WODCal** | Python | Fetches SugarWOD workouts, uses PaLM LLM to estimate duration, creates Google Calendar events | https://github.com/misha-khar/WODCal |
| **SugarWOD_Project** | Python | Web scraper + Bokeh dashboard for workout data visualization | https://github.com/chrisjackr/SugarWOD_Project |
| **sugarWod** | TypeScript/Next.js | Next.js app integrating with SugarWOD API | https://github.com/robneal/sugarWod |
| **SugarWOD_to_MyFitnessPal** | Python | Planned integration (issue stage) to sync workout data | https://github.com/ifwatts/SugarWOD_to_MyFitnessPal |

**Key observation**: The **WODCal** project is the closest analogue to what we want to build. It fetches today's workout from SugarWOD and passes the description text to an LLM for processing -- exactly our pattern with `WorkoutParserAgent`.

SugarWOD also provides official WordPress integration (plugin + RSS feeds + iframe embeds) and a custom WordPress plugin approach that fetches WODs from the API and saves them as WordPress posts.

### Feasibility: HIGH

SugarWOD is the clear winner for integration. The API is documented, the data model is structured, and they explicitly support third-party integrations. The main blocker is that API keys are gym-scoped, so we'd either need:
- A partnership with SugarWOD for platform-level access
- Individual gyms to opt in and provide their API keys
- Use only the HQ workouts endpoint (if accessible without gym-specific key)

---

## 2. Beyond The Whiteboard (BTWB)

### API Availability: LIMITED / SEMI-PRIVATE

BTWB has an API at `api.beyondthewhiteboard.com` but it is not publicly documented for third-party developers.

### Authentication

- **WordPress Plugin**: Uses JWT (RS256) authentication with `sessions/jwt/_gym_1` endpoint
- **Claims**: issuer (iss), audience (aud), expiration (exp)
- **No public developer portal or key generation system found**

### Available Integrations

1. **WordPress Plugin**: Shortcodes `[wod]`, `[activity]`, `[leaderboard]` to embed gym WODs on WordPress sites
2. **Data Export**: Athletes can request training data export via support ticket (returned as spreadsheet)
3. **Partner Integrations**: CompTrain, CrossFit Affiliate Programming, and others deliver programming through BTWB

### Workout Data Format

Not publicly documented. Based on the WordPress plugin behavior:
- Displays daily WODs with title and description
- Shows leaderboards per workout
- Supports multiple workout tracks

### Rate Limits / Terms

- No public API terms of service found
- Access appears to be controlled through partnership agreements

### Community Interest

The BTWB support forums show active community requests for a developer API (topic `35000020225`), suggesting it's a desired but not yet publicly available feature.

### GitHub Presence

- `github.com/btwb` -- 6 repositories, primarily the WordPress plugin
- `github.com/diggerdric/btwb-export` -- Third-party tool to export workout data (suggests no official export API)

### Feasibility: LOW

BTWB does not offer a public developer API. Integration would require either:
- A business partnership with BTWB for API access
- Scraping their WordPress widget output (fragile, likely violates ToS)
- Reverse-engineering their mobile app API (risky, no guarantee of stability)

Not recommended as a primary integration target.

---

## 3. Wodify

### API Availability: YES -- Limited Public API

Wodify provides a workout retrieval API primarily designed for gyms to display WODs on their websites.

### Endpoint

```
GET https://api.wodify.com/v1/workouts/formattedworkout
    ?date=YYYY-MM-DD
    &location=LocationName
    &program=ProgramName
```

### Authentication

- **Method**: API Key
- **Header**: `x-api-key: YOUR-API-KEY`
- **Key Generation**: Admin panel at Digital Presence > Web Integrations
- **Multiple Keys**: You can generate multiple keys for different integrations

### Response Format

```json
{
  "APIWod": {
    "FormattedWOD": "<div class='wod-container'>...</div>"
  }
}
```

**Important**: The response returns pre-formatted HTML, not structured data. The `FormattedWOD` field contains HTML that's meant to be injected directly into a web page.

### Error Response

```json
{
  "APIError": {
    "ResponseCode": "400",
    "ErrorMessage": "No workout found matching those criteria."
  }
}
```

### Program API

Wodify also has a "Program API" mentioned in their help docs, used by their Workout Marketplace partners (CompTrain, Mayhem Affiliate, etc.) to push programming into Wodify. However, this appears to be a write/push API for programming providers, not a read API for consumers.

### Security Note

The HTML in `FormattedWOD` should be treated as untrusted content -- sanitize before rendering.

### Rate Limits / Terms

- No specific rate limit numbers found in public documentation
- API keys are gym-scoped (same limitation as SugarWOD)

### Feasibility: MEDIUM

Wodify has a public API, but it returns HTML rather than structured data. We would need to:
1. Parse HTML to extract workout text (fragile, format could change)
2. Feed the extracted text into our existing Claude workout parser

The HTML-to-text conversion adds a brittle layer. Better than no API, but significantly worse than SugarWOD's structured JSON:API.

---

## 4. CompTrain / Mayhem

### CompTrain API: NONE (Public)

CompTrain does not expose a public API. Their programming is delivered through platform partners:
- SugarWOD
- PushPress
- BTWB
- StreamFit
- Wodify (Workout Marketplace)

CompTrain also has a dedicated mobile app (iOS/Android), but no developer documentation exists.

### Mayhem Nation API: NONE (Public)

Mayhem Nation (Rich Froning's programming) does not have a public API. Their programming is:
- Published on their blog: `mayhemnation.com/blogs/wods`
- Available through Wodify Workout Marketplace
- Delivered via their own mobile app

### Mayhem WOD Blog Structure

The blog at `mayhemnation.com/blogs/wods` publishes daily workouts. Workouts are uploaded by Saturday for the upcoming week. Programs include Mayhem Compete, M30, M60, and other tracks.

### Third-Party WOD Databases

- **WODwell** (`wodwell.com`): Catalogs 1131+ Mayhem workouts and thousands of WODs from other sources. No public API found, but the data is browsable.
- **WOD Insight / Voopty** (`wod.voopty.com`): Displays Mayhem daily workouts. Unknown API availability.

### Feasibility: LOW (Direct) / HIGH (Via SugarWOD)

CompTrain and Mayhem programming is best accessed through SugarWOD or Wodify rather than directly. Both providers push their programming into these platforms, so integrating with SugarWOD would indirectly give access to CompTrain/Mayhem workouts for gyms that subscribe to those tracks.

---

## 5. CrossFit Games API

### API Availability: UNDOCUMENTED (but accessible)

CrossFit Games has an internal API that powers their website. It is not officially documented or supported for third-party use.

### Base URL

```
https://c3po.crossfit.com/api/competitions/v2/
```

### Known Endpoints

```
GET /competitions/open/{year}/leaderboards
    ?view=0
    &division=1        # 1=Men, 2=Women, 18=Men 35-39, etc.
    &region=0
    &scaled=0          # 0=RX, 1=Scaled, 2=Foundations
    &sort=0
    &page=1
```

### Response Data

Returns leaderboard data including:
- `totalPages`, `totalCompetitors`, `currentPage`
- `dataType: "LEADERBOARD"`
- Per-competitor: `competitorId`, `competitorName`, `firstName`, `lastName`, `gender`, `countryOfOriginCode`, `regionId`, `divisionId`, `affiliateId`
- Per-event: placement, points, scores (times, reps, loads)
- Event descriptions and workout details

### Existing Libraries

- **R**: `crossfitgames` package -- `games_leaderboard()`, `extract_workout_results()`
- **R**: `crossfit` package -- `cf_open()`, `cf_games()`, `cf_request()`

### Relevance to Our Use Case

This API provides competition data (leaderboard scores), not daily gym programming. It does include workout descriptions for Open/Games events, but:
- Limited to competition workouts (5-6 per year for Open, plus Games events)
- Not daily programming
- Undocumented and could break at any time

### Feasibility: LOW (for daily WODs), MEDIUM (for named/benchmark WODs)

The CrossFit Games API could provide workout descriptions for Open/Games workouts to populate a library of named WODs, but it's not suitable for daily programming feeds. Use as supplementary data only.

---

## 6. Other Platforms

### PushPress

- **API**: Limited/no public developer API. GetApp reports "does not have an API available", though some product docs mention website integration API
- **Workout Features**: Train by PushPress supports benchmark workouts, Open workouts, and daily programming
- **Integration Model**: Pre-built partnerships (Zapier, Wix, WordPress, Stripe, Mailchimp, Slack, etc.) rather than developer API
- **Workout Data Import**: CSV files only for workout uploads and history imports
- **Integration Partners**: Includes CrossFit Affiliate Programming, hundreds of third-party apps
- **Feasibility**: LOW -- no public API documentation available, CSV-only data import

### TrainHeroic

- **API**: No open/public API
- **Integration**: Only integrates with Pike13
- **Features**: 1,300+ exercise library, marketplace with CrossFit programs
- **Feasibility**: VERY LOW -- closed ecosystem

### StreamFit

- **API**: No public developer API found
- **Integration**: Partners include HybridAF, Shopify, Zapier, WordPress, Spotify
- **Feasibility**: VERY LOW -- no developer access path

### WODwell

- **API**: No public API found
- **Data**: Massive WOD database (10,000+ workouts from various sources)
- **Feasibility**: LOW -- would need partnership or scraping (not recommended)

### CrossFit.com Programming

- **RSS Feed**: No current official RSS feed for daily WODs found
- **Access**: CrossFit Affiliate Programming (CAP) delivered through SugarWOD at $20/month
- **Feasibility**: MEDIUM (via SugarWOD's `/v2/workoutshq` endpoint)

### RSS Feeds (General)

Many individual CrossFit gyms publish WODs via RSS on their websites (typically at `/feed`). These are unstructured blog posts, not structured workout data. Fragile and not scalable.

---

## 7. Feasibility Summary

| Platform | Public API | Structured Data | Auth Model | Daily WODs | Feasibility |
|----------|-----------|----------------|------------|------------|-------------|
| **SugarWOD** | Yes (v2 beta) | Yes (JSON:API) | API Key (gym-scoped) | Yes | **HIGH** |
| **Wodify** | Yes (limited) | No (HTML only) | API Key (gym-scoped) | Yes | **MEDIUM** |
| **BTWB** | No (private) | Unknown | JWT (private) | Yes | **LOW** |
| **CompTrain** | No | N/A | N/A | Via partners only | **LOW (direct)** |
| **Mayhem** | No | N/A | N/A | Blog / partners | **LOW (direct)** |
| **CrossFit Games** | Undocumented | Partial | None (open) | No (competition only) | **LOW** |
| **PushPress** | Undocumented | Unknown | Unknown | Unknown | **LOW** |
| **TrainHeroic** | No | N/A | N/A | N/A | **VERY LOW** |
| **StreamFit** | No | N/A | N/A | N/A | **VERY LOW** |
| **WODwell** | No | N/A | N/A | N/A | **LOW** |

### Key Insight

SugarWOD is the clear integration target. It is the only platform with a documented, structured, public REST API. As a bonus, many programming providers (CompTrain, CrossFit HQ, Invictus, PRVN, Mayhem via Wodify) deliver their content through SugarWOD, making it a de facto aggregator.

---

## 8. Recommended Implementation Plan

### Phase 1: SugarWOD Integration (Primary Target)

**Effort**: 2-3 days
**Approach**: Build a SugarWOD client in `apps/api/clients/`

#### Architecture

```
apps/api/
  clients/
    sugarwod_client.py        # SugarWOD API v2 client
  models/
    schemas.py                # Add WOD source models
  routes/
    wod_routes.py             # New endpoints for WOD browsing
```

#### Client Implementation

```python
# apps/api/clients/sugarwod_client.py

import httpx
from typing import Optional

class SugarWODClient:
    BASE_URL = "https://api.sugarwod.com/v2"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": api_key,
            "Content-Type": "application/json",
        }

    async def get_workouts(
        self,
        date_int: Optional[int] = None,   # YYYYMMDD
        track_id: Optional[str] = None,
        page_skip: int = 0,
        page_limit: int = 25,
    ) -> dict:
        """Fetch workouts from SugarWOD."""
        params = {
            "page[skip]": page_skip,
            "page[limit]": page_limit,
        }
        if date_int:
            params["dates"] = date_int
        if track_id:
            params["track_id"] = track_id

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/workouts",
                headers=self.headers,
                params=params,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_hq_workouts(self, date_int: Optional[int] = None) -> dict:
        """Fetch CrossFit HQ mainsite workouts."""
        params = {}
        if date_int:
            params["dates"] = date_int

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/workoutshq",
                headers=self.headers,
                params=params,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_tracks(self) -> dict:
        """Fetch available programming tracks."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/tracks",
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_movements(self) -> dict:
        """Fetch movement library."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/movements",
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()
```

#### API Endpoints for Frontend

```python
# New route: GET /api/v1/wods/today
# Returns today's WOD from connected SugarWOD affiliate
# User taps the WOD -> auto-fills workout text -> generates playlist

# New route: GET /api/v1/wods/week
# Returns this week's workouts for planning ahead
```

#### Integration Flow

```
User opens app
  -> App fetches today's WOD from SugarWOD
  -> Displays WOD card with title + description
  -> User taps "Generate Playlist"
  -> Workout text auto-fills from SugarWOD description
  -> Existing pipeline takes over (parse -> curate -> compose)
```

### Phase 2: Wodify Integration (Secondary)

**Effort**: 1-2 days
**Approach**: HTML parsing layer on top of Wodify's formatted workout endpoint

```python
# apps/api/clients/wodify_client.py

import httpx
from bs4 import BeautifulSoup

class WodifyClient:
    BASE_URL = "https://api.wodify.com/v1"

    def __init__(self, api_key: str):
        self.headers = {"x-api-key": api_key}

    async def get_workout(
        self, date: str, location: str, program: str
    ) -> str:
        """Fetch and extract workout text from Wodify HTML response."""
        params = {
            "date": date,       # YYYY-MM-DD
            "location": location,
            "program": program,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/workouts/formattedworkout",
                headers=self.headers,
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()

        html = data.get("APIWod", {}).get("FormattedWOD", "")
        soup = BeautifulSoup(html, "html.parser")
        return soup.get_text(separator="\n").strip()
```

Note: Wodify returns HTML, so this is inherently more fragile than SugarWOD.

### Phase 3: Named WOD Library (No API needed)

**Effort**: 1 day
**Approach**: Curate a static library of named/benchmark WODs

Build a local database of well-known CrossFit benchmark workouts. These don't change and don't need an API:

- **Girls**: Fran, Grace, Helen, Diane, Elizabeth, etc.
- **Heroes**: Murph, DT, Nate, Michael, etc.
- **Open Workouts**: 24.1, 24.2, 24.3, etc.
- **Games Events**: Popular competition workouts

This gives users immediate value without any API key setup. The go-live plan already mentions named WOD buttons (Fran, Murph, etc.) -- this is the simplest path to implementing that feature.

### Phase 4: Gym Connection Flow (Future)

**Effort**: 3-5 days
**Approach**: Allow users to connect their gym's SugarWOD or Wodify account

```
Settings -> Connect Your Gym
  -> Select platform (SugarWOD / Wodify)
  -> Enter API key (provided by gym owner)
  -> App validates key against API
  -> Daily WODs auto-populate in the app
```

This requires gym owners to opt in, which limits initial adoption but provides the richest experience.

---

## Key Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SugarWOD API still labeled "beta" | Breaking changes possible | Pin to v2, add response validation, monitor for deprecation notices |
| API keys are gym-scoped | Limits self-service onboarding | Start with named WOD library (no key needed), add gym connection as opt-in |
| Rate limits undefined | Could hit throttling | Cache responses (WODs don't change once published), respect 429 with exponential backoff |
| Wodify HTML format changes | Parser breaks | Use SugarWOD as primary, Wodify as fallback, add HTML parsing tests |
| Partnership required for scale | Blocks broad rollout | Start with individual gym opt-in, pursue partnership as user base grows |

---

## Next Steps

1. **Immediate**: Build the Named WOD Library (Phase 3) -- zero API dependencies, immediate user value
2. **Short-term**: Build SugarWOD client (Phase 1) -- test with a gym's API key
3. **Medium-term**: Build gym connection settings UI (Phase 4)
4. **Explore**: Contact SugarWOD about partnership-level API access for broader integration
5. **Deprioritize**: BTWB, CompTrain direct, Mayhem direct, TrainHeroic, StreamFit -- all have closed ecosystems

---

## Sources

### SugarWOD
- [SugarWOD API Documentation](https://app.sugarwod.com/developers-api-docs)
- [SugarWOD API Getting Started](https://help.sugarwod.com/hc/en-us/articles/115013863908-API-Getting-Started)
- [SugarWOD API Terms of Service](https://app.sugarwod.com/developers-terms-of-service)
- [SugarWOD API Announcement (2017)](https://www.sugarwod.com/2017/08/sugarwod-api-announcement/)
- [SugarWOD API Knowledge Base](https://help.sugarwod.com/hc/en-us/sections/115003106728-API)
- [SugarWOD Individual Athlete Data](https://help.sugarwod.com/hc/en-us/articles/115013863988-API-Individual-Athlete-data)
- [SugarWOD Scoring Options](https://help.sugarwod.com/hc/en-us/articles/360000708128-What-are-the-workout-scoring-options-in-SugarWOD-)
- [SugarWOD Workout Marketplace](https://www.sugarwod.com/workout-marketplace/)
- [SugarWOD Software Partners](https://www.sugarwod.com/software-partners/)
- [CrossFit Affiliate Programming on SugarWOD](https://www.sugarwod.com/2023/05/crossfit-affiliate-programming-sugarwod/)

### Corporate/Acquisition
- [Daxko Acquires SugarWOD (PR Newswire)](https://www.prnewswire.com/news-releases/daxko-acquires-sugarwod-to-become-the-unrivaled-software-provider-for-affiliate-gyms-300851711.html)
- [Zen Planner + SugarWOD Joining Forces](https://zenplanner.com/affiliate-gym/announcing-sugarwod/)
- [Zen Planner + SugarWOD 2026 Roadmap](https://zenplanner.com/blogs/state-of-the-nation-whats-new-and-whats-next-for-zen-planner-and-sugarwod/)
- [Zen Planner + SugarWOD FAQ](https://zenplanner.com/blogs/zen-planner-sugarwod-frequently-asked-questions/)

### Community Projects
- [WODCal (SugarWOD + LLM)](https://github.com/misha-khar/WODCal)
- [SugarWOD_Project (scraper + dashboard)](https://github.com/chrisjackr/SugarWOD_Project)
- [sugarWod (Next.js integration)](https://github.com/robneal/sugarWod)
- [SugarWOD_to_MyFitnessPal](https://github.com/ifwatts/SugarWOD_to_MyFitnessPal/issues/1)

### Alternative Platforms
- [Wodify Formatted Workout Endpoint](https://help.wodify.com/hc/en-us/articles/208736968-Retrieve-Formatted-Workout-Endpoint)
- [Wodify Program API](https://help.wodify.com/hc/en-us/articles/209425797-Wodify-s-Program-API)
- [Wodify Web Integrations](https://help.wodify.com/hc/en-us/sections/360011330174-Web-Integrations)
- [BTWB WordPress Plugin](https://btwb.blog/2014/09/10/beyond-the-whiteboard-wordpress-integration/)
- [BTWB API Discussion](https://support.btwb.com/en/support/discussions/topics/35000020225)
- [BTWB GitHub](https://github.com/btwb)
- [BTWB Export Tool](https://github.com/diggerdric/btwb-export)
- [PushPress Integrations](https://www.pushpress.com/integrations)
- [Reverse Engineering CrossFit Games API](https://rubiconjosh.hashnode.dev/reverse-engineering-crossfit-games-api)
- [CrossFit Games API R Package](https://github.com/ekholme/crossfitgames)
- [CompTrain Gym Programming](https://www.comptrain.com/gym-programming)
- [Mayhem Nation Daily Workouts](https://www.mayhemnation.com/blogs/wods)
- [WODwell](https://wodwell.com/)
