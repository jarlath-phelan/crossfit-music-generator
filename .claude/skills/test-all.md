---
name: test-all
description: Run all tests — pytest for backend and pnpm build for frontend — and report combined results
user_invocable: true
---

# Test All

Run the full test suite for Crank across both backend and frontend.

## Run both in parallel

### Backend tests
```bash
cd /Users/jarlath/GitHub/crossfit-music-generator/apps/api && source venv/bin/activate && pytest tests/ -v --tb=short 2>&1
```

### Frontend build
```bash
cd /Users/jarlath/GitHub/crossfit-music-generator && pnpm build 2>&1
```

Run these simultaneously. Collect results from both.

## Report Format

```
## Test Results

### Backend (pytest)
- Status: PASS / FAIL
- Tests: X passed, Y failed
- [If failures: list each failing test with error]

### Frontend (pnpm build)
- Status: PASS / FAIL
- [If failures: list TypeScript errors with file:line]

### Overall: ALL GREEN / X FAILURES
```

Keep it concise if everything passes. Be detailed on failures — include exact error messages, file paths, and line numbers so the team can act immediately.
