# TravelM8 — Road Trip Copilot

**Live:** https://travelm8app.vercel.app

AI-powered road trip safety copilot. Not an itinerary generator — a co-pilot that helps you *execute* real road trips: fatigue warnings, late-arrival risk, stop suggestions, group voting, budget tracking, and offline route packets.

---

## Features

| Feature | Description |
|---|---|
| **Route Planning** | Origin → destination with AI stop suggestions (POIs, food, motels) via OSRM + OSM |
| **AI Copilot** | Trip risk score (low/med/high), fatigue warnings, late-arrival alerts, top tip |
| **Stop Insights** | Per-stop AI analysis: why visit, best time, local tip |
| **Group Voting** | Share a code, group members vote on stops, live tally updates |
| **Post-trip Feedback** | 5-star rating + what worked / what didn't |
| **Budget Tracker** | Estimated vs actual spend, per-category breakdown (fuel/food/lodging/activities/misc) |
| **Analytics Dashboard** | Average rating, vote heatmap, popular routes, recent feedback |
| **Offline Route Packet** | Download full HTML trip guide — stops, AI notes, itinerary, budget — works without internet |
| **Calendar Export** | `.ics` file download for Google Calendar / Apple Calendar / Outlook |
| **Auth** | JWT sign-up/sign-in, SendGrid password reset, email verification |
| **Dark Mode** | System preference detection + manual toggle, persisted to localStorage |
| **React Native App** | Expo mobile app with all core features + native share + haptics |

---

## Stack

**100% free tier — no credit card required.**

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript, HashRouter, CSS custom properties |
| Backend | Express.js + TypeScript, Vercel serverless |
| Database | Neon Postgres (prod) / JSON files (local dev) |
| AI | Groq llama-3.3-70b-versatile (primary) + Gemini 1.5 Flash (fallback) |
| Maps | Leaflet + OpenStreetMap (free) |
| Routing | OSRM public instance (free) |
| Geocoding | Nominatim (free) |
| Email | SendGrid free tier (100 emails/day) |
| Mobile | React Native + Expo |

---

## Running locally

```bash
# Backend (port 3001)
cd backend && cp .env.example .env  # fill in keys
npm install && npm run dev

# Frontend (port 3000)
cd frontend && npm install && npm start

# Mobile
cd mobile && npm install && npx expo start
```

### Required env vars (`backend/.env`)

```env
PORT=3001
JWT_SECRET=<random string>
GROQ_API_KEY=<from console.groq.com — free>
GEMINI_API_KEY=<from aistudio.google.com — free>
DATABASE_URL=<Neon Postgres connection string — free tier>
SENDGRID_API_KEY=<from sendgrid.com — free 100/day>
FROM_EMAIL=noreply@yourdomain.com
APP_URL=https://travelm8app.vercel.app
```

---

## Project structure

```
travelm8/
├── backend/          # Express + TypeScript API
│   └── src/
│       ├── routes/   # auth, trips, route, analytics, vote-sessions
│       ├── services/ # AI, routing, feedback, analytics, votes
│       └── utils/    # storage (Postgres/JSON), auth, email, cache
├── frontend/         # React web app
│   └── src/
│       ├── components/
│       └── utils/    # api, auth, theme, routePacket, calendarExport
├── mobile/           # Expo React Native app
│   └── src/screens/
└── vercel.json       # Vercel deployment config
```

---

## What makes TravelM8 different from Roamy AI

Roamy AI generates itineraries. TravelM8 is a **safety copilot**:

- Flags drives over 4 hours (fatigue)
- Warns if you'll arrive after 10pm (late-arrival risk)
- Gives per-route risk level: low / medium / high
- Tracks actual spend vs budget per leg
- Lets groups vote on stops instead of one person deciding
- Generates offline-ready route packets for no-signal areas
