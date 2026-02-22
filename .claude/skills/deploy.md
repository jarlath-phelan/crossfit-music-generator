---
name: deploy
description: Full deployment pipeline — tests, builds, deploys backend to Render and frontend to Vercel, then runs smoke tests
user_invocable: true
---

# Deploy Pipeline

Run the full deployment pipeline for Crank. Tests first, then deploys.

## Steps

### 1. Run backend tests
```bash
cd /Users/jarlath/GitHub/crossfit-music-generator/apps/api && source venv/bin/activate && pytest tests/ -v --tb=short
```
If any test fails, STOP and report the failure. Do not deploy broken code.

### 2. Build frontend
```bash
cd /Users/jarlath/GitHub/crossfit-music-generator && pnpm build
```
If the build fails, STOP and report the error. Do not deploy broken code.

### 3. Deploy backend to Render
Backend auto-deploys from `main` via `render.yaml`. Push to main triggers deployment.
```bash
cd /Users/jarlath/GitHub/crossfit-music-generator && git push origin main
```
Wait for deployment to complete on Render dashboard.

### 4. Deploy frontend to Vercel
```bash
cd /Users/jarlath/GitHub/crossfit-music-generator && vercel --prod
```
Wait for deployment to complete. Report the deployed URL.

### 5. Smoke test backend
```bash
curl -s https://crossfit-playlist-api.onrender.com/health | python3 -m json.tool
```
Verify the health check returns `"status": "healthy"`.

### 6. Smoke test frontend
```bash
curl -s -o /dev/null -w "%{http_code}" https://crossfit-music-generator.vercel.app
```
Verify it returns HTTP 200.

## Report

After all steps, summarize:
- Backend: deployed to Render (health status)
- Frontend: deployed to Vercel (URL, HTTP status)
- Tests: X passed, 0 failed
- Status: SUCCESS or FAILED (with reason)
