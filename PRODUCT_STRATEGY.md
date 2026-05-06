# TravelM8 Product Strategy

## USP

TravelM8 is a route-aware travel copilot for real journeys. It should not compete as another generic itinerary or social-post trip board. Its strongest position is helping people execute road trips safely, cheaply, and confidently.

## Free API Stack

- Geocoding: OpenStreetMap Nominatim
- Driving estimate: OSRM public route service
- Maps: Leaflet with OpenStreetMap tiles
- Storage for MVP: local JSON files on the server
- Hosting: Render free web service for frontend and backend together
- Calendar export: generated ICS files, no paid service required

## Current Product Direction

- Verified route datasets for high-quality known corridors.
- Free open-data route estimates for user-entered routes.
- Budget guardrails for meals and overnight stays.
- Time-aware meal and motel backup zones.
- Fatigue and late-arrival risk flags.
- Offline route packet instructions.
- Explainable stop scoring with route fit and recommendation reasons.
- Optional demo mode through `REACT_APP_DEMO_MODE=true`.

## Add-ons That Can Make It More Unique

- Trip risk score: weather, drive duration, departure time, road remoteness, and late arrival.
- Route packet PDF: offline itinerary, phone numbers, backup stops, emergency notes, and hotel check-in plan.
- Smart fallback chain: primary stop, cheaper backup, safer late-night backup.
- Group readiness: each traveler can vote on food, stops, budget, and max drive time.
- Parent/student/senior travel profiles: safer stop cadence and accessibility preferences.
- Trust layer: label every recommendation as verified, open-data estimated, or user-confirmed.
- Post-trip learning: “what worked” feedback improves future route plans.

## Hosting Notes

Render free web service is enough for the current MVP because it runs the Express backend and serves the React frontend from one URL. The free instance can sleep after inactivity, so first load may be slow, but the service remains free.
