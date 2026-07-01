# TravelM8 — Claude Code Instructions

## What This Project Is

TravelM8 is a road trip safety copilot. It is NOT a generic AI itinerary generator (Roamy AI already does that). It helps people execute real road trips — route-aware planning, fatigue warnings, late-arrival risk, budget guardrails, and offline route packets.

## Working Directory

All source lives in `/Users/rohithmatam/Developer/Projects/travelm8/`.

```
travelm8/
├── backend/        # Express.js + TypeScript API (port 3001)
│   ├── src/
│   │   ├── services/      # Business logic
│   │   │   ├── aiService.ts         ← Groq (primary) + Gemini (fallback) + cache
│   │   │   ├── routePlanningService.ts
│   │   │   ├── recommendationService.ts
│   │   │   └── tripService.ts
│   │   ├── routes/        # Express route handlers
│   │   ├── types/         # TypeScript interfaces
│   │   └── server.ts
│   └── .env              # NEVER commit — holds GROQ_API_KEY + GEMINI_API_KEY
└── frontend/       # React + TypeScript (port 3000)
    └── src/
        ├── components/
        └── utils/
```

## AI Setup

**Primary:** Groq API — model `llama-3.3-70b-versatile` (free tier: 14,400 req/day)
**Fallback:** Gemini 1.5 Flash (free tier: 1,500 req/day)
**Cache:** In-memory SHA-256 hash cache, 1-hour TTL — same prompt never hits API twice

Keys live in `backend/.env`:
```
GROQ_API_KEY=...
GEMINI_API_KEY=...
```

The `aiService.ts` handles all AI calls. Use `askAI(prompt)` for raw text or the structured helpers:
- `getRouteInsights()` — fatigue warning, late-arrival note, risk level
- `getStopInsight()` — why stop, best time, local tip
- `getDestinationInsight()` — headline, bestFor, budgetTip, avoidTip

Always call AI non-blocking with try/catch — app must work even if AI fails.

## Free API Stack

| Service | Purpose | Limit |
|---------|---------|-------|
| Groq (llama-3.3-70b) | AI insights | 14,400 req/day free |
| Gemini 1.5 Flash | AI fallback | 1,500 req/day free |
| OpenStreetMap Nominatim | Geocoding | Rate limit: 1 req/s |
| OSRM public instance | Routing | Fair use |
| Leaflet + OpenStreetMap | Maps in browser | Free |
| Render free tier | Hosting | Sleeps after inactivity |

## Development Rules

**No paid APIs.** This project runs on 100% free tiers until the owner gets a job. Never add a service that requires a credit card.

**AI calls must be cached.** Always use `askAI()` which has built-in cache. Never call Groq or Gemini directly in route handlers.

**AI must fail gracefully.** Wrap every `await getRouteInsights(...)` in try/catch. The app must return a complete response even if AI is down or rate-limited.

**No secrets in git.** `.env` is in `.gitignore`. `backend/.gitignore` also blocks it. Never commit API keys.

**No `.DS_Store` in git.** Root `.gitignore` covers this. Check before pushing.

**TypeScript strict mode.** Run `npx tsc --noEmit` before committing. Zero errors required.

## What Makes TravelM8 Unique (vs Roamy AI)

Roamy AI generates itineraries. TravelM8 is a **road trip safety copilot**:

1. **Fatigue warnings** — flags drives over 4 hours
2. **Late-arrival risk** — detects if user will arrive after 10pm
3. **Risk level** — low/medium/high per route
4. **Stop trust layer** — verified vs open-data vs estimated
5. **Offline route packet** — full plan available without internet
6. **Budget guardrails per leg** — not just total budget

## Running Locally

```bash
# Backend
cd backend && npm run dev    # starts on :3001

# Frontend (new terminal)
cd frontend && npm start     # starts on :3000
```

## Key Files to Know

- `backend/src/services/aiService.ts` — all AI logic, touch this first for AI changes
- `backend/src/services/routePlanningService.ts` — route planning + AI insights wired in
- `backend/src/services/recommendationService.ts` — destination recommendations + AI insights
- `backend/src/types/route.ts` — `RouteResponse` includes `aiInsights?: AIRouteInsight`
- `backend/src/types/recommendation.ts` — `RecommendationResponse` includes `aiInsights?`

## Adding New AI Features

1. Add a new helper in `aiService.ts` — structured JSON prompt, typed return, fallback values
2. Call it in the relevant service with try/catch
3. Add the field as optional (`?`) to the relevant type in `types/`
4. Display in the relevant frontend component

## Planned Unique Features (build in this order)

- [ ] Trip risk score displayed on RoutePlanner UI
- [ ] AI stop insights shown on each stop card
- [ ] Offline route PDF packet download
- [ ] Group consensus voting (each traveler votes on stops)
- [ ] Post-trip "what worked" feedback
- [ ] React Native mobile app via Expo (after web is solid)

## Common Pitfalls

- Nominatim requires `User-Agent` header — already set in `recommendationService.ts`, keep it
- OSRM public instance is fair-use only — don't hammer it in loops
- Groq `llama-3.3-70b-versatile` is the model ID — don't use `llama-3.3-70b` (wrong ID)
- Gemini model is `gemini-1.5-flash` not `gemini-pro` — flash is faster and free
- JSON.parse on AI output can fail — always have a fallback object, never throw

## Environment Variables Reference

```env
# backend/.env
PORT=3001
JWT_SECRET=change-this-to-a-random-string-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
```
