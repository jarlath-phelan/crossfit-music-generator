# Design Expert Panel — Round 2 (2026-02-22)

## Context
Full app review after shipping: dark athletic theme, named WODs, genre chips, onboarding, touch target fixes, localStorage persistence, PWA manifest fix.

## Panel

| Expert | Specialty | Key Concern |
|--------|-----------|-------------|
| Maya Chen | Mobile UX, ex-Peloton | Dead zone (player+tab=37% viewport), no re-generation path |
| Ravi Kapoor | Design Systems, ex-Spotify | White phase cards, player outlier, no type scale |
| Elena Voss | Brand & Motion, ex-Nike TC | No state transitions, fake progress bar, no brand voice |
| James Okafor | Performance & A11y, ex-Strava | WCAG violations (text size, touch targets), PWA gaps |
| Sofia Martinez | Product + CrossFit athlete | Phase grouping critical, more WODs, bigger playlists, gym mode |

## Tier 1 — Critical (Do This Week)

| # | Recommendation | Impact | Effort | Experts |
|---|---------------|--------|--------|---------|
| C1 | Group tracks by workout phase with section headers | 9/10 | 2-3 hrs | Maya, Ravi, Sofia |
| C2 | Fix player bar: 44px buttons, 12px+ text, themed colors | 8/10 | 2 hrs | Ravi, James |
| C3 | Fix white phase cards → use surface tokens | 7/10 | 30 min | Ravi |
| C4 | State transition animations (empty→loading→results) | 8/10 | 4-5 hrs | Elena |
| C5 | Replace fake progress bar with 3-stage real indicator | 7/10 | 2 hrs | Elena, Maya |
| C6 | Brand voice copywriting pass (buttons, loading, onboarding) | 7/10 | 1-2 hrs | Elena, Sofia |

## Tier 2 — Important (This Sprint)

| # | Recommendation | Impact | Effort | Experts |
|---|---------------|--------|--------|---------|
| I1 | Merge player into tab bar (mini-player pattern) | 8/10 | 4-6 hrs | Maya, Ravi |
| I2 | Hero empty state with gradient + waveform animation | 7/10 | 3-4 hrs | Elena |
| I3 | Expand named WODs to 12-15 with categories | 6/10 | 1-2 hrs | Sofia |
| I4 | Increase default playlist size to 8-10 tracks | 7/10 | 1 hr | Sofia |
| I5 | Micro-interactions (spring on tap, haptic feedback) | 6/10 | 3 hrs | Elena |
| I6 | Define formal type scale (12/14/16/20/24) and enforce | 6/10 | 2 hrs | Ravi, James |
| I7 | Persist genre selection across sessions | 5/10 | 30 min | Sofia |
| I8 | Full PWA icon set + maskable icons | 5/10 | 1 hr | James |

## Tier 3 — Nice-to-Have (Next Sprint)

| # | Recommendation | Impact | Effort | Experts |
|---|---------------|--------|--------|---------|
| N1 | Full-screen gym mode player (72px controls) | 7/10 | 4-5 hrs | Sofia |
| N2 | Per-track swap button for regeneration | 7/10 | 6-8 hrs | Maya, Sofia |
| N3 | Pin today's playlist in Library | 5/10 | 2-3 hrs | Sofia |
| N4 | Secondary accent color (cyan for info) | 4/10 | 2 hrs | Ravi |
| N5 | Swipe gestures between tabs | 4/10 | 3-4 hrs | Maya |
| N6 | Share card generator | 5/10 | 4-5 hrs | Elena |

## Panel Consensus: Top 3 Quick Wins

1. **Phase grouping** (C1) — every expert mentioned this
2. **Fix player bar** (C2) — accessibility + design consistency
3. **White phase cards** (C3) — 30-minute fix, huge visual lift

## Scorecard

| Dimension | Score | Target |
|-----------|:-----:|:------:|
| Visual Design | 6.5/10 | 8.5 |
| Interaction Design | 3.5/10 | 8.0 |
| Mobile UX | 5/10 | 8.5 |
| Fitness App Feel | 5.5/10 | 9.0 |
| Brand Identity | 3/10 | 8.0 |
| Accessibility | 4/10 | 8.0 |
| **Overall** | **4.6/10** | **8.4** |
