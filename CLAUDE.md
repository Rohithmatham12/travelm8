# TravelM8 — Claude Code Instructions

## What This Project Is

TravelM8 is a road trip safety copilot. It is NOT a generic AI itinerary generator (Roamy AI already does that). It helps people execute real road trips — route-aware planning, fatigue warnings, late-arrival risk, budget guardrails, and offline route packets.

**Live:** https://travelm8app.vercel.app

## Project Structure

```
travelm8/
├── backend/              # Express.js + TypeScript API (port 3001)
│   └── src/
│       ├── routes/       # auth, trips, route, analytics, vote-sessions
│       ├── services/     # AI, routing, feedback, analytics, votes, trips
│       └── utils/        # storage (Postgres/JSON), auth, email, cache
├── frontend/             # React 18 + TypeScript (port 3000, HashRouter)
│   └── src/
│       ├── components/
│       └── utils/        # api, auth, theme, toast, routePacket, calendarExport
├── mobile/               # Expo React Native (SDK 54)
│   └── src/screens/
├── .github/workflows/    # trip-reminders.yml — daily push notification cron
└── vercel.json           # Vercel deployment config
```

## AI Setup

**Primary:** Groq API — model `llama-3.3-70b-versatile` (free tier: 14,400 req/day)
**Fallback:** Gemini 1.5 Flash (free tier: 1,500 req/day)
**Cache:** In-memory SHA-256 hash cache, 1-hour TTL — same prompt never hits API twice

The `aiService.ts` handles all AI calls. Use `askAI(prompt)` for raw text or the structured helpers:
- `getRouteInsights()` — fatigue warning, late-arrival note, risk level
- `getStopInsight()` — why stop, best time, local tip
- `getDestinationInsight()` — headline, bestFor, budgetTip, avoidTip

Always call AI non-blocking with try/catch — app must work even if AI fails.

## Free API Stack

| Service | Purpose | Limit |
|---------|---------|-------|
| Groq (llama-3.3-70b-versatile) | AI insights | 14,400 req/day |
| Gemini 1.5 Flash | AI fallback | 1,500 req/day |
| OpenStreetMap Nominatim | Geocoding | 1 req/s |
| OSRM public instance | Routing | Fair use |
| Leaflet + OpenStreetMap | Maps in browser | Free |
| Neon Postgres | Database (prod) | Free tier |
| SendGrid | Email (password reset, invite) | 100 emails/day |
| Expo Push API | Mobile push notifications | Free |
| Vercel | Hosting + serverless | Free tier |
| GitHub Actions | Daily reminder cron | Free |

## Development Rules

**No paid APIs.** This project runs on 100% free tiers until the owner gets a job. Never add a service that requires a credit card.

**AI calls must be cached.** Always use `askAI()` which has built-in cache. Never call Groq or Gemini directly in route handlers.

**AI must fail gracefully.** Wrap every `await getRouteInsights(...)` in try/catch. The app must return a complete response even if AI is down or rate-limited.

**No secrets in git.** `.env` is in `.gitignore`. Never commit API keys.

**No `.DS_Store` in git.** Root `.gitignore` covers this. Check before pushing.

**TypeScript strict mode.** Run `npx tsc --noEmit` before committing. Zero errors required.

## What Makes TravelM8 Unique (vs Roamy AI)

Roamy AI generates itineraries. TravelM8 is a **road trip safety copilot**:

1. **Fatigue warnings** — flags drives over 4 hours
2. **Late-arrival risk** — detects if user will arrive after 10pm
3. **Risk level** — low/medium/high per route, shown as pill on route card
4. **Group voting** — share a code, crew votes on stops, live tally
5. **Offline route packet** — self-contained HTML, works with no signal
6. **Budget tracker** — estimated vs actual, per-category breakdown
7. **Push notifications** — local (expo-notifications) + backend cron via GitHub Actions

## Features Shipped

- [x] Route planning with AI stop suggestions (OSRM + Nominatim + Groq)
- [x] Per-stop AI insights (why visit, best time, local tip)
- [x] Trip risk score (low/medium/high) displayed on RoutePlanner + TripDetail
- [x] Group voting (vote session code, real-time tally)
- [x] Post-trip feedback (5-star + text)
- [x] Analytics dashboard (avg rating, heatmap, popular routes)
- [x] Budget tracker — web + mobile (estimated vs actual, 5 categories)
- [x] Offline route packet (downloadable self-contained HTML)
- [x] Calendar export (.ics — client-side, no backend round-trip)
- [x] Dark mode (CSS vars, anti-FOUC, persisted to localStorage)
- [x] Landing page at / (public, unauthenticated)
- [x] PWA (Workbox service worker, installable)
- [x] Auth hardening (SendGrid password reset + email verification)
- [x] Share trip by email (SendGrid, branded HTML email)
- [x] Push notifications — local (expo-notifications) + backend cron (GitHub Actions + Expo Push API)
- [x] React Native mobile app (Expo SDK 54, 8 screens)

## Running Locally

```bash
# Backend (port 3001)
cd backend && cp .env.example .env   # fill in keys
npm install && npm run dev

# Frontend (port 3000)
cd frontend && npm install && npm start

# Mobile
cd mobile && npm install && npx expo start
```

## Environment Variables (`backend/.env`)

```env
PORT=3001
JWT_SECRET=<random string>
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
APP_URL=https://travelm8app.vercel.app
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
DATABASE_URL=<Neon Postgres connection string>
SENDGRID_API_KEY=<SendGrid key>
FROM_EMAIL=noreply@yourdomain.com
INTERNAL_SECRET=<random string — must match GitHub Actions secret>
```

## Key Files

- `backend/src/services/aiService.ts` — all AI logic, touch this first for AI changes
- `backend/src/utils/storage.ts` — Postgres (prod) / JSON files (local) abstraction
- `backend/src/utils/email.ts` — SendGrid wrapper (verify, reset, invite emails)
- `frontend/src/utils/theme.ts` — dark mode toggle + anti-FOUC init
- `frontend/src/utils/routePacket.ts` — offline HTML packet generator
- `frontend/src/utils/calendarExport.ts` — ICS generator + download
- `mobile/src/utils/notifications.ts` — local scheduling + push token registration
- `.github/workflows/trip-reminders.yml` — daily cron to fire push notifications

## Common Pitfalls

- Nominatim requires `User-Agent` header — already set in `recommendationService.ts`, keep it
- OSRM public instance is fair-use only — don't hammer it in loops
- Groq model ID is `llama-3.3-70b-versatile` — not `llama-3.3-70b`
- Gemini model is `gemini-1.5-flash` — not `gemini-pro`
- JSON.parse on AI output can fail — always have a fallback object, never throw
- Mobile theme has `text1/text2/text3` and `card` — no `text4` or `bgCard`
- Dark mode via `[data-theme="dark"]` on `<html>` — not a class, not on body
- HashRouter on frontend — email links use `/#/reset-password?token=xxx` format
- `expo-file-system` v57 uses new `File`/`Paths` API — not legacy `writeAsStringAsync`
- Push notifications require `INTERNAL_SECRET` in both Vercel env + GitHub Actions secrets
