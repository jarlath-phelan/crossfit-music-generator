---
name: test-ux
description: Test the Crank UX in a real browser. Navigates through critical user flows, finds issues, fixes them, and re-tests. Run after code changes to verify the app works end-to-end.
user_invocable: true
---

# Browser UX Testing

Test the Crank app in a real browser using Playwright. Find issues, fix them, re-test.

## Prerequisites

Before testing, make sure the app is running:
- Frontend: `http://localhost:3000` (Next.js)
- Backend: `http://localhost:8000` (FastAPI)

If either isn't running, start them:
```bash
cd /Users/jarlath/GitHub/crossfit-music-generator && pnpm dev
```

## The Loop

```
For each flow:
  1. Test the flow in the browser
  2. If it works → move to next flow
  3. If it breaks → read the code → fix it → re-test → confirm fix
```

Do NOT just report issues. **Fix them and verify.**

## What to Test

If arguments are provided, test only those flows. Otherwise test all critical flows:

### Critical Flows (test in order)

1. **Page Load** — Navigate to localhost:3000, verify it loads without errors, check console for JS errors

2. **Generate Playlist** — Find workout input, type "AMRAP 20 min: 5 pull-ups, 10 push-ups, 15 squats", click Generate, verify playlist appears with tracks

3. **Genre Chips** — Click a genre chip, verify it's selected, generate to confirm it's applied

4. **Named WODs** — Click a named WOD button (Fran/Murph/Grace), verify it fills the input, generate

5. **Playlist Results** — After generating, verify: track cards show name/artist/BPM, thumbs up/down buttons work, Spotify export button visible

6. **Navigation** — Switch between Generate and Library tabs, verify routing works

7. **Mobile** — Resize to 375x812, repeat flow 2, verify touch targets >= 44px, no horizontal scroll

## Browser Tools

Use Playwright MCP tools:
- `browser_navigate` — go to URLs
- `browser_snapshot` — get accessibility tree (ALWAYS do this before clicking)
- `browser_click` — click elements by ref from snapshot
- `browser_type` — type text into inputs
- `browser_take_screenshot` — capture visual state when issues found
- `browser_wait_for` — wait for content to appear
- `browser_console_messages` — check for JS errors (check after EVERY flow)
- `browser_resize` — test mobile viewport

## When Fixing Issues

1. Read the relevant source file
2. Make the minimal fix
3. If frontend change: wait for HMR to reload, then re-test
4. If backend change: note that the backend needs restart
5. Re-test the flow to confirm the fix works

## Report

After all flows are tested:

```
## UX Test Results

Tested: [list flows tested]
Fixed: [count] issues
Remaining: [count] issues that need manual intervention

### Details
[For each issue: what broke, what was fixed, file changed]
```
