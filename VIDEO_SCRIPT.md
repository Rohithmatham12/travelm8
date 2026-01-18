# TravelM8 / DayMate — Video Walkthrough Script

**Duration**: 5-10 minutes  
**Audience**: Technical interviewers, engineering managers  
**Tone**: Professional, confident, technical (no hype)

---

## Time Breakdown

### [0:00 - 1:30] Introduction & Problem Statement

**Screen**: README.md in editor

**Script**:
> "Today I'm walking through TravelM8, a route-based travel planning platform I built. The core problem is that existing travel tools suggest generic city attractions, not places along your actual driving route. TravelM8 solves this by calculating your exact route, then suggesting POIs, restaurants, and accommodations along that specific path.
>
> The architecture is production-ready with dual-mode operation: Live Mode uses real-time external APIs, while Sample Data Mode provides deterministic data for testing and demos. This dual-mode design enables reliable testing without external dependencies.
>
> Let me show you how it works."

**Action**: Switch to browser, open app at localhost:3000

---

### [1:30 - 3:00] Live Demo: LA → SF Route Planning

**Screen**: Browser showing RoutePlanner component

**Script**:
> "Here's the main planning interface. I'll plan a route from Los Angeles to San Francisco. Notice the mode indicator — this shows whether we're in Live or Sample Data Mode. Let me click 'Plan my route'."

**Action**:
- Click "Plan my route"
- Show loading state
- Wait for response

**Script** (while loading):
> "The request goes to our backend API, which validates input, checks authentication, then routes to either SampleItineraryService or LiveItineraryService based on configuration."

**Screen**: Show route summary with stops

**Script**:
> "Here's the route summary: 383 miles, 6 hours drive time. The system has generated several stop options — POIs like Hearst Castle, restaurants like The Lark in Santa Barbara, and motels. Each stop includes detour time, estimated visit duration, ratings, and cost. The recommendations are filtered by the user's budget."

**Action**: Scroll to show stop selections

**Script**:
> "Users can select POIs, restaurants, and an overnight stay. Once selected, we finalize the itinerary."

**Action**: Select a few stops, click "Finalize Itinerary"

---

### [3:00 - 4:30] Code Walkthrough: Architecture & Services

**Screen**: VS Code, open `backend/src/services/routePlanningService.ts`

**Script**:
> "Let's look at the core architecture. This is RoutePlanningService, our facade that routes requests based on mode."

**Action**: Scroll to `planRoute` method (lines 31-42)

**Script**:
> "Here's the service selection logic. If SAMPLE_DATA_MODE is true, we use SampleItineraryService for deterministic data. Otherwise, we use LiveItineraryService which calls external APIs like Gemini AI, OSRM for routing, and Nominatim for geocoding.
>
> Both services return the same RouteResponse schema, ensuring UI compatibility regardless of mode."

**Screen**: Open `backend/src/services/sampleItineraryService.ts`

**Action**: Show `planRoute` method (lines 75-120)

**Script**:
> "SampleItineraryService contains predefined LA→SF data: 3 POIs, 3 restaurants, 2 motels, all with real coordinates and realistic data. This is deterministic — same input always produces the same output, which is crucial for testing."

**Screen**: Open `backend/src/config/index.ts`

**Action**: Show config structure (lines 1-50)

**Script**:
> "Configuration is centralized here. SAMPLE_DATA_MODE controls which service is used. In production, this would be false; in development or demos, we set it to true."

---

### [4:30 - 6:00] Business Logic: Time & Cost Calculation

**Screen**: Open `backend/src/services/routePlanningService.ts`

**Action**: Scroll to `finalizeItinerary` method (lines 521-586)

**Script**:
> "When finalizing an itinerary, we calculate realistic timings. Drive time between stops is proportional to the distance ratio. For example, if a stop is 25% along the route, it gets 25% of the total drive time.
>
> Cost aggregation sums motel costs, meal costs per traveler, activity costs, and gas based on distance at $0.15 per mile."

**Action**: Show `generateCalendarEventsWithRouteData` (lines 588-682)

**Script**:
> "Calendar event generation uses cumulative time calculations. Each drive segment and stop builds on the previous one, ensuring the itinerary timeline is realistic and coherent."

---

### [6:00 - 7:30] Dual-Mode Design & Error Handling

**Screen**: Open `DESIGN.md`

**Action**: Show architecture diagram section

**Script**:
> "The dual-mode design serves multiple purposes: testing, development without API keys, consistent demos, and documentation examples. The key insight is that both modes return identical response schemas, so the UI doesn't need conditional logic."

**Screen**: Open `backend/src/services/routePlanningService.ts`

**Action**: Show retry logic (lines 106-141)

**Script**:
> "Error handling uses exponential backoff retry for transient failures like rate limits or timeouts. If Gemini AI fails, we fall back to OpenStreetMap APIs, which are free and don't require an API key. This ensures the system remains functional even when external services are unavailable."

---

### [7:30 - 8:30] What Would I Improve Next?

**Screen**: Open `DESIGN.md`, scroll to "Scalability Considerations"

**Script**:
> "For scaling, I'd prioritize caching with Redis for route responses and geocoding results. This would reduce API calls and latency. I'd also add rate limiting per user and per IP to prevent abuse.
>
> For async processing, I'd introduce a job queue using Bull or BullMQ for long-running itinerary generation. This prevents timeouts and improves user experience.
>
> Database-wise, I'd add proper indexing on userId and tripId, implement connection pooling, and consider read replicas for heavy read workloads."

---

### [8:30 - 9:30] Closing Statement

**Screen**: Browser showing completed itinerary

**Script**:
> "TravelM8 demonstrates clean architecture with clear separation of concerns: routes handle validation, services contain business logic, and external APIs are abstracted behind service interfaces. The dual-mode design enables both production deployment and reliable testing.
>
> The codebase is maintainable, testable, and production-ready. It uses free-tier services for hosting and APIs, making it cost-effective while still providing a solid foundation for scaling.
>
> Thank you. I'm happy to answer any questions about the architecture, design decisions, or implementation details."

---

## Files to Show in Video (5-8 files)

1. **`README.md`** — Project overview, dual-mode explanation
2. **`backend/src/services/routePlanningService.ts`** — Core facade and service routing
3. **`backend/src/services/sampleItineraryService.ts`** — Sample mode implementation
4. **`backend/src/config/index.ts`** — Configuration management
5. **`DESIGN.md`** — Architecture diagram and trade-offs
6. **`frontend/src/components/RoutePlanner.tsx`** — UI component (optional, if time)
7. **`backend/src/types/route.ts`** — Type definitions (optional, if time)

---

## Key Talking Points

✅ **Problem**: Route-based planning vs generic city suggestions  
✅ **Architecture**: Dual-mode design, service layer separation  
✅ **Business Logic**: Time calculation, cost aggregation, calendar generation  
✅ **Error Handling**: Retry logic, fallbacks, graceful degradation  
✅ **Scalability**: Caching, rate limiting, async processing  
✅ **Trade-offs**: Sample mode limitations, serverless cold starts, API rate limits

---

## What NOT to Say

❌ "AI magic" or "it just works"  
❌ Over-hyped claims about capabilities  
❌ Negative comments about external APIs  
❌ Excuses for limitations (instead, explain mitigations)

---

## Tips for Delivery

- **Confidence**: Speak clearly and authoritatively  
- **Pace**: Not too fast; allow interviewer to process  
- **Technical Depth**: Show understanding, not just code  
- **Trade-offs**: Acknowledge limitations and explain mitigations  
- **Code Navigation**: Use keyboard shortcuts, be efficient
