# Crank — Business Idea Assessment

**Created**: 2026-02-22
**Status**: In progress — pre-validation

---

## Owner Profile

- **Direction**: Genuinely 50/50 between doubling down on Crank and pivoting
- **Business type**: Undecided — could be solo lifestyle biz, bootstrapped growth, or something else
- **Time available**: A few hours per week (side project alongside full-time work)
- **Domain access**: Active CrossFitter with a gym community for interviews
- **Motivation**: Revenue + learning the process + solving a real problem (all three)
- **User feedback so far**: None — hasn't shown it to real users yet

---

## How Business Ideas Are Typically Assessed

### Lens A: The VC/Investor Lens (raise money, scale fast)

VCs evaluate on four pillars:
- **Team** — 47% rank founder quality as #1. Domain expertise matters (CrossFit + music + engineering).
- **Market size** — How many people would pay? TAM/SAM/SOM analysis.
- **Product differentiation** — Defensible moat? What can't competitors copy?
- **Traction** — Users, revenue, growth rate. Evidence > ideas.

### Lens B: The Bootstrapper/Indie Hacker Lens (profitable solo business)

- Can you get 50 email signups or 5 pre-sales? If not, pivot.
- Is the niche specific enough? "Extreme niching down" is a solo founder superpower.
- Can you charge from day 1?
- Can one person maintain this profitably?

### Lens C: The Lean Startup Lens (build-measure-learn)

- What's your riskiest assumption? Test that first.
- Customer discovery interviews using "The Mom Test" (never mention your idea).
- Iterate based on evidence, not opinions.

---

## Honest Assessment of Crank

| Factor | Score | Why |
|--------|-------|-----|
| Market size | Small-Medium | ~5M CrossFitters globally, most use generic Spotify playlists |
| Problem severity | Low-Medium | Music for workouts is "nice to have," not a burning pain |
| Competition | Crowded | Fit Radio (~$100/yr), RockMyRun (BPM matching), Spotify playlists (free) |
| Differentiation | Medium | AI workout parsing + BPM matching is novel, but defensible? |
| Willingness to pay | **Unknown** | **#1 thing to validate** |
| Technical moat | Low | Spotify API deprecations make this fragile; competitors have music licenses |
| Solo maintainability | Medium | API costs + music source fragility + Spotify Premium dependency |

---

## Idea Scorecard (To Fill In After Customer Discovery)

```
IDEA SCORECARD (rate 1-5)
═══════════════════════════════════════
Problem Severity:    ___  (How painful is this problem?)
Market Size:         ___  (How many people have it?)
Willingness to Pay:  ___  (Would they pay? Evidence?)
Competition:         ___  (How crowded? Can you differentiate?)
Your Unfair Advantage: ___ (Why you? Domain, tech, network?)
Solo Viability:      ___  (Can 1 person run this profitably?)
Joy/Motivation:      ___  (Do you want to work on this for 2+ years?)
═══════════════════════════════════════
TOTAL:               ___ / 35

25+ = strong, pursue aggressively
18-24 = promising but needs validation
Under 18 = consider pivoting
```

---

## Potential Pivots Worth Exploring

| Pivot | Reuses from Crank | New Angle |
|-------|-------------------|-----------|
| WOD Parser as a Service | Workout parser agent, Claude API | API for fitness apps needing structured workout data |
| Coach Music Tool (B2B) | Playlist generation, BPM matching | Sell to gym owners who control the speakers |
| AI Workout Programming | Claude API, workout domain knowledge | Generate workout plans, not just parse them |
| Fitness Content Tool | AI pipeline, CrossFit knowledge | Help coaches create workout posts at scale |
| BPM-Matched Coaching Audio | Audio matching tech | Guided coaching audio matched to workout phases |

---

## Competitive Landscape

| Competitor | Price | What They Do | Gap vs. Crank |
|-----------|-------|-------------|---------------|
| Fit Radio | $100/yr | DJ-mixed workout stations, has CrossFit channel | They have licensed music; Crank relies on Spotify |
| RockMyRun | $10/mo | BPM sync to heartrate/cadence | Running-focused, not CrossFit-specific |
| Spotify playlists | Free | Curated workout playlists | "Good enough" for most people |
| Gym sound systems | Varies | Coaches play music for whole class | The real competitor — athletes don't control music at a box |

---

## Next Steps: 3-Phase Validation Process

### Phase 1: Customer Discovery (target: 10-15 interviews)
- **Script**: See `customer-interview-script.md` in this folder
- **Who**: Mix of athletes at your box + coaches + home gym people
- **Access**: Start with your gym community (easiest), expand to Reddit/Facebook if needed
- **Time**: 2-3 interviews per week over 4-5 weeks (fits "few hours/week" constraint)
- **Key question to answer**: Do CrossFitters actually have a music problem worth solving?

### Phase 2: Competitive Deep Dive (parallel with Phase 1)
- Sign up for Fit Radio and RockMyRun trials
- Document what they do well and what's missing
- Check Spotify's workout playlist ecosystem
- Research gym music licensing (B2B angle)

### Phase 3: Decide (after 10+ interviews)

| Signal from Interviews | Action |
|------------------------|--------|
| "I already use Spotify and it's fine" (most say this) | Pivot or kill |
| "I wish my coach had better music for class" | Pivot toward B2B for gym owners |
| "I'd pay $5/mo for workout-matched playlists" | Double down, build subscription |
| "The WOD parsing is really cool" | Pivot toward workout programming tools |
| "I want music that adapts mid-workout" | Double down on adaptive music angle |
| A different problem keeps coming up | Explore that as a new direction |

---

## Key Resources

- [The Mom Test](https://www.looppanel.com/blog/customer-interviews) — How to talk to customers without biasing them
- [YC Startup Evaluation](https://www.indiehackers.com/post/summary-of-y-combinators-how-to-evaluate-startup-ideas-2a631c86f8) — Y Combinator's assessment criteria
- [Solo Founder Playbook](https://www.indiehackers.com/post/the-solo-founder-playbook-7f9531b174) — Bootstrapped business strategies
- [Business Idea Validation Guide](https://ideaproof.io/guides/business-idea-validation-guide) — Comprehensive validation framework
- [7-Day Validation Framework](https://knowledge.gtmstrategist.com/p/7-day-business-idea-validation-framework) — Rapid validation approach

---

## Files in This Assessment

- `business-assessment.md` — This file (overview, frameworks, next steps)
- `customer-interview-script.md` — Ready-to-use Mom Test interview script with debrief template
