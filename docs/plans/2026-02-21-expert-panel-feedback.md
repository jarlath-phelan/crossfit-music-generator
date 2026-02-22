# Expert Panel Feedback — Go Live Review

**Date**: 2026-02-21
**Panels**: 6 panels, 30 experts total

---

## Panel 1: UX/UI Design (5 experts)

**Experts**: Sarah Chen (ex-Peloton), Marcus Williams (Accessibility), Yuki Tanaka (ex-Spotify), Diego Ramirez (CrossFit Coach), Priya Patel (ex-Headspace)

### Critical Issues
- **"Play All" only plays first track** — `use-spotify-player.ts` sends `{ uris: [uri] }` instead of all URIs. 1-line fix.
- **Seek slider not keyboard accessible** — div with role="slider" but no keyboard handlers. WCAG Level A violation. Replace with `<input type="range">` (matching existing volume control pattern).
- **No onboarding** — first visit lands on empty form with no explanation. Need first-run experience with pre-loaded example.

### Major Issues
- Phase-track relationship invisible on mobile (phase badges are `hidden md:inline-flex`)
- Phase cards break on mobile — flex layout compresses to ~75px per card
- Tab bar uses wrong ARIA roles (`role="tablist"` on nav links)
- Sign-in gates are invisible — features hidden instead of shown in locked state
- No way to swap a single track without regenerating everything
- No "Gym Mode" full-screen player for in-class use

### Quick Wins
- Remove "MOCK" badge from production (1 line)
- Add `aria-live="polite"` to loading messages (2 lines)
- Fix dangling `aria-describedby="workout-hint"` reference
- Persist last playlist to localStorage
- Scroll results into view after generation
- Better example workouts that show full class structure

### Recommendations (Ranked by Impact)
1. Fix Play All to queue all tracks
2. Remove MOCK badge
3. Fix seek slider accessibility
4. Add first-run onboarding
5. Group tracks by workout phase with section headers
6. Fix tab bar ARIA roles
7. Make phase cards scrollable on mobile
8. Add contextual sign-in prompts at Save/Export
9. Add aria-live to loading + fix aria-describedby
10. Persist last playlist to localStorage

---

## Panel 2: Architecture & Infrastructure (5 experts)

**Experts**: Alex Novak (ex-Fly.io), Rachel Kim (API Security), Tom Burke (Python Architect), Lisa Zhang (DevOps), James Murphy (Spotify DevRel)

### Critical Issues
- **Sync/async mismatch** — `async def generate_playlist` blocks event loop. All Claude/Spotify/BPM calls are synchronous. Fix: change to `def` (5 min) or wrap in `asyncio.to_thread()`.
- **Spotify OAuth redirect URI** — must be registered as the Vercel URL for Better Auth, not the Fly.io URL.
- **Auth route swallows ALL errors** — `catch {}` returns 200 for OAuth attacks. Must only catch DB connection errors.
- **X-User-ID header unauthenticated** — anyone with curl can impersonate any user. Needs HMAC signing.

### Major Issues
- Rate limiter uses proxy IP, not real client IP (all users share one bucket)
- No payload size limit on base64 images (DoS vector)
- Spotify tokens expire after 1 hour — need to verify Better Auth refreshes them
- No music source fallback chain (if GetSongBPM fails, request fails)
- No CI/CD pipeline for Fly.io deployment
- No staging environment
- Blocking `time.sleep()` in Spotify client

### Recommendations (Ranked by Risk)
1. Write Dockerfile + fly.toml (blocks launch)
2. Fix sync/async mismatch (change to `def`)
3. Register correct Spotify redirect URI
4. Fix auth route error swallowing
5. Authenticate X-User-ID with HMAC
6. Create GitHub Action CI/CD
7. Add base64 payload size limit
8. Verify Spotify token refresh
9. Fix rate limiter key function
10. Implement music source fallback chain

---

## Panel 3: Business & Product Strategy (5 experts)

**Experts**: Maria Gonzalez (a16z), David Park (ClassPass), Amy Richards (Apple Fitness+), Brian Foster (Indie SaaS), Natalie Kim (ex-UMG)

### Business Model Consensus
- **Freemium with B2B upsell**: Free basic → $7.99/mo Pro → $29.99/mo Gym
- Alternative: Brian Foster says charge from day one ($9.99/mo, 14-day trial)
- Unit economics excellent: $3-5/mo hosting, ~$0.001/request AI cost

### Strategic Verdict: GO
- Core value prop (workout-to-playlist) is novel and solves real daily pain
- Cost structure nearly zero at small scale
- Technical architecture well-designed and flexible
- CrossFit community is word-of-mouth driven

### Key Risks
1. **Spotify dependency** — existential risk if API terms change
2. **Music variety** — same songs repeated = churn
3. **Feature bloat** — too many tabs before product-market fit

### Music Licensing Assessment (Natalie Kim, ex-UMG)
- Current approach (BPM lookup + Spotify playback) is legally sound
- Gray area: Spotify ToS says "personal, non-commercial" — gym use is technically commercial
- Recommendation: Add ToS disclaimer, explore Feed.fm for licensed B2B music API
- GetSongBPM requires attribution link (easy to miss)

### 90-Day Priorities
1. Validate with 10 real coaches (measure daily return rate)
2. Optimize generation speed to <5 seconds
3. Simplify product surface (remove empty tabs)
4. Build community track quality database
5. Explore Feed.fm partnership

---

## Panel 4: Fitness Tech Industry (5 experts)

**Experts**: Jen Torres (Strava), Kai Lindström (Spotify), Dana Whitfield (WHOOP), Marcus Reed (Peloton), Sophia Chen (WodProof)

### Critical Findings
- **Spotify track resolution must work end-to-end** with real BPM sources (Kai)
- **Photo input is the primary use case** — coaches write on whiteboards, not in apps (Sophia)
- **No sharing mechanism** — every class is a distribution event, 10-20 athletes × 5 days/week (Jen)

### Music Algorithm Issues (Kai Lindström)
- BPM mapping too rigid — energy matters more than BPM for perceived intensity
- Hardcoded 3.5-min duration in GetSongBPM causes playlist length errors
- No half-time/double-time awareness (80 BPM = 160 BPM perceptually)
- Energy should be equally weighted to BPM, not 30 vs 50 points

### Product Gaps
- Per-class genre profiles (not per-coach) — 6 AM wants hip-hop, noon wants EDM (Sophia)
- Post-workout feedback loop — "How did it go?" prompt after class (Dana)
- Spotify Premium requirement not communicated upfront (Marcus)
- API cost exposure — no usage caps (Marcus)

### Growth Levers
- "Powered by Crank" in exported Spotify playlists (Jen)
- SugarWOD/BTWB integration — auto-pull daily WODs (Sophia)
- Heart rate integration pilot with 3-5 boxes (Dana)
- Gym-level subscriptions — sell to box owners, not individual coaches (Marcus)

---

## Panel 5: CrossFit Community — Real Users (5 users)

**Users**: Rob Miller (box owner), Tina Alvarez (competitive athlete), Jake O'Brien (part-time coach), Megan Cho (gym music coordinator), Carlos Reyes (home gym athlete)

### Overall Score: 6.5/10
Concept (9/10), Visual Design (8/10), Core Flow (7/10), Music Quality (3/10), Readiness (4/10)

### Willingness to Pay
- Rob (box owner): $15-25/mo — saves 8+ hours/month
- Tina (athlete): $5/mo — wants more control
- Jake (part-time): $5-8/mo
- Megan (coordinator): $10-20/mo gym plan
- Carlos (home gym): $5-8/mo or $50/year

### Universal Demands (all 5 users)
1. Real music with real Spotify playback (not mock)
2. Genre selection at generation time (not buried in settings)
3. Bigger playlists (12-20 tracks for 60-min class)
4. Remove "coming soon" tabs and MOCK badge
5. Non-Spotify user support

### Unique Insights
- **Rob**: Class scheduling — input Mon-Sat WODs on Sunday, all playlists ready
- **Tina**: "Seed tracks" — give starter songs, let AI fill the rest
- **Jake**: Named WOD library — tap "Fran" and get a playlist, no typing
- **Megan**: Member taste aggregation — gym-level collective preferences
- **Carlos**: CompTrain/HWPO integration — auto-pull daily programming

### Elevator Pitch
"Snap your whiteboard. Get a playlist that peaks when your workout peaks. Never play a chill song during Fran again."

---

## Panel 6: AI/ML Implementation (5 experts)

**Experts**: Dr. Sarah Park (Anthropic), Mike Chen (Spotify ML), Dr. Elena Vasquez (Netflix), James Wu (Peloton AI), Dr. Raj Patel (Human-AI Interaction)

### Bugs / Issues
- **Energy scores double-count BPM** — `_estimate_energy()` derives energy from BPM, so the 30-point energy score is redundant with the 50-point BPM score (Mike Chen)
- **ClaudeMusicSource uses fragile JSON parsing** — should use tool_use pattern (Sarah Park)
- **`plan()` method is dead code** — runs but output is never used (Sarah Park)
- **Deterministic selection** — always picks `scored_candidates[0]`, same workout = same playlist (Elena Vasquez)

### Ship Now (Quick Wins)
1. Add stochastic selection — weighted random from top 5 candidates (5 lines)
2. Add phase_name and score to Track model in API response (schema change)
3. Fix ClaudeMusicSource to use tool_use

### Medium-Term (3 months)
1. Validation-retry loop for Claude — feed errors back instead of crashing
2. Named WOD cache — pre-computed for ~50 benchmark WODs
3. Server-side feedback model — persistent (user, track, phase, timestamp) with time decay

### Long-Term (1 year)
1. Collaborative filtering — "coaches at similar boxes also played..."
2. Dynamic energy curves — continuous BPM targets instead of flat phases
3. Audio feature extraction — real energy/mood, not BPM-derived proxies

### Data Opportunities
- Log every Claude response with input (build training dataset)
- Track skip/completion rates from streaming player (implicit feedback)
- Capture regeneration patterns (implicit negative feedback on full playlist)
- Store full playlist context with feedback (learn transitions, not just tracks)

---

## Consolidated Priority Stack

### Before Launch (Must-Do)
1. Change `async def` → `def` on generate endpoint
2. Fix "Play All" to queue all tracks
3. Remove MOCK badge from production
4. Register correct Spotify redirect URI
5. Fix auth route error swallowing
6. Add base64 payload size limit
7. Fix rate limiter to use X-Forwarded-For
8. Add stochastic selection (top-5 weighted random)
9. Write Dockerfile + fly.toml, deploy to Fly.io

### Fast Follow (High Impact)
1. Genre selector on generate page
2. Phase-grouped track display
3. First-run onboarding
4. Seek slider keyboard accessibility
5. Named WOD cache
6. Shareable playlist links
7. Per-track swap button
8. Fix energy double-counting in scorer
9. Contextual sign-in prompts
10. Persist last playlist to localStorage

### Strategic (90-Day Horizon)
1. Validate with 10 real coaches
2. Optimize generation speed <5 seconds
3. SugarWOD/BTWB integration
4. Explore Feed.fm for licensed music
5. Community track quality database
6. Apple Music support
7. Per-class music profiles
8. Server-side preference model
