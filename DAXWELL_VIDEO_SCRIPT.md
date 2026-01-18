# Video Walkthrough Script: TravelM8 / DayMate
## Submission for Daxwell Software Developer Role

**Target Duration:** 8–10 Minutes  
**Speaker:** Rohith Matam  
**Passcode:** `InterviewDaxwell123@`

---

## Part 1: Introduction & The "Why" (0:00 - 1:30)

**Visual Flow:**
1. Camera on you (first 20 seconds)
2. Switch to browser: Application landing page or RoutePlanner component

**Screen to Show:**
- Browser: `http://localhost:3000` or deployed app
- Show RoutePlanner component (empty form)

**Script:**
> "Hi, I'm Rohith Matam. Thank you for the opportunity to share my work.
>
> Today I'm walking you through **TravelM8** (also known as DayMate), a full-stack, AI-powered travel planning platform I designed and built.
>
> I built this project to solve a specific engineering challenge in the travel domain: **Route-Based Querying.** Most travel APIs, like Google Places or TripAdvisor, are 'City-Based'—they give you recommendations for a specific circle. But for a road trip, users need recommendations *along a specific vector*—the driving route itself.
>
> I wanted to build a system that calculates driving geometry first, and then uses GenAI to perform spatial queries along that path, filtering for budget and time constraints.
>
> While this application is built using **TypeScript, React, and Node.js**, I architected the backend using **MVC principles** and **strict design patterns**—specifically Facade and Strategy patterns—to ensure the logic remains clean, testable, and scalable, much like a Spring Boot enterprise application."

**Key Points to Emphasize:**
- "Route-Based Querying" (unique problem)
- "MVC principles" (aligns with Spring Boot)
- "Facade and Strategy patterns" (design pattern expertise)

---

## Part 2: Product Demo (1:30 - 3:30)

**Visual Flow:**
1. Browser: RoutePlanner form
2. Fill in route details
3. Show results page with mode indicator
4. Select stops and finalize
5. Show calendar export

**Screens to Show:**
1. **RoutePlanner Form** (`frontend/src/components/RoutePlanner.tsx` in browser):
   - Origin: "Los Angeles"
   - Destination: "San Francisco"
   - Departure date: Today's date
   - Departure time: "08:00"
   - Travelers: 2
   - Motel budget: $80
   - Meal budget: $15

2. **Click "Plan my route"** (show loading state)

3. **Results Page** (after response loads):
   - Show route summary (383 miles, 6 hours)
   - **Highlight mode badge** (📦 Sample Mode or 🌐 Live Mode)
   - Scroll to show stop options:
     - POIs (Hearst Castle, Santa Barbara Courthouse, etc.)
     - Restaurants (The Lark, Splash Cafe, etc.)
     - Motels (Cavalier Oceanfront, Budget Inn, etc.)

4. **Select Stops:**
   - Check 2-3 POIs
   - Check 1 restaurant
   - Select 1 motel

5. **Click "Finalize Itinerary"** (show loading)

6. **Final Itinerary:**
   - Show calendar events with timings
   - Show cost breakdown
   - Click "Export to Calendar" button (download .ics)

**Script:**
> "Let's look at the core functionality.
>
> **[Action: Fill in route form]**
> Here I'm entering a standard West Coast route. I can define my constraints: the number of travelers, departure time, and crucially—my budget filters for hotels and meals.
>
> **[Action: Click Plan Route]**
> Behind the scenes, the system is performing a dual-lookup. It calls **OSRM (Open Source Routing Machine)** to get the actual driving geometry, and **Google Gemini** to interpret that geometry and suggest stops based on detour time.
>
> **[Action: Show Results Page]**
> Notice the mode indicator here—this shows whether we're using live external APIs or deterministic sample data. As you can see, the application doesn't just dump data. It structures it into:
>
> 1. **Motels/Hotels** filtered by my $80/night limit.
> 2. **Restaurants** ranked by detour time.
> 3. **Points of Interest** along the highway.
>
> **[Action: Select stops and click Finalize]**
> When I finalize, the backend calculates the time-series data. It accounts for drive time + stop duration to generate a realistic itinerary.
>
> **[Action: Show Calendar Export]**
> Finally, I can export this as an `.ics` file. This required writing a transformation layer to convert our JSON itinerary object into a standard calendar format compliant with Outlook and Google Calendar."

**Key Points:**
- Emphasize "dual-lookup" (OSRM + Gemini)
- Point out mode indicator (demonstrates dual-mode architecture)
- Mention "transformation layer" (data processing expertise)

---

## Part 3: Architecture & Tech Stack (3:30 - 5:30)

**Visual Flow:**
1. VS Code: Open `DESIGN.md` (architecture diagram section, lines 5-47)
2. VS Code: Open `backend/src/services/routePlanningService.ts` (lines 31-42: Facade pattern)

**File 1: `DESIGN.md` (Lines 5-47)**
**What to Highlight:**
- ASCII architecture diagram
- Service layer separation (Routes → Services → External APIs)
- Dual-mode routing (Sample vs Live)

**File 2: `backend/src/services/routePlanningService.ts` (Lines 25-42)**
**What to Highlight:**
```typescript
async planRoute(request: RouteRequest): Promise<RouteResponse> {
  // Dual-Mode Data Architecture
  // Route to appropriate service based on configuration
  if (config.sampleDataMode) {
    try {
      return await sampleItineraryService.planRoute(request);
    } catch (error: any) {
      // If route not supported in sample mode, fall back to live mode
      console.warn(`[Sample Mode] Route not supported, falling back to live mode: ${error.message}`);
      // Continue to live mode logic below
    }
  }
  
  // Live Mode: Use real-time external APIs
  // ... (continue showing the live mode logic)
}
```

**Script:**
> "Let's dive into the architecture.
>
> **[Visual: Show DESIGN.md architecture diagram]**
> The stack consists of a **React/TypeScript frontend** hosted on Vercel, communicating via REST with a **Node.js/Express backend** (running as serverless functions). Data persistence is handled by **Neon (Serverless PostgreSQL)**.
>
> The architecture follows a **layered approach** similar to Spring MVC: Routes handle HTTP concerns, Services contain business logic, and we abstract external dependencies behind service interfaces.
>
> **[Visual: Switch to routePlanningService.ts, scroll to planRoute method]**
> However, the most interesting part is how I handled data reliability.
>
> I implemented a **Dual-Mode Data Architecture** using the **Facade Pattern** here in the `RoutePlanningService`. This service acts as a single entry point—like a Spring `@Service` annotated class—that routes requests based on configuration.
>
> **[Highlight lines 34-36: if (config.sampleDataMode)]**
> Based on an environment variable (`SAMPLE_DATA_MODE`), it uses the **Strategy Pattern**:
>
> 1. **Sample Strategy:** Loads deterministic, pre-validated data (for testing).
> 2. **Live Strategy:** Calls the real external APIs (for production).
>
> This allows for deterministic integration testing and ensures the frontend development isn't blocked by backend API limits—a practice I know is critical in enterprise CI/CD workflows."

**Key Points:**
- Draw parallel to Spring `@Service` (familiarity with Spring Boot)
- Emphasize Facade + Strategy patterns (design pattern expertise)
- Mention "enterprise CI/CD" (enterprise mindset)

---

## Part 4: Code Walkthrough & Design Patterns (5:30 - 8:00)

**Visual Flow:**
1. VS Code: `backend/src/routes/routePlanning.ts` (Controller layer, lines 28-51)
2. VS Code: `backend/src/services/routePlanningService.ts` (Service layer, lines 143-320: AI route generation)
3. VS Code: `backend/src/services/routePlanningService.ts` (Retry logic, lines 106-141)
4. VS Code: `backend/src/types/route.ts` (Type definitions, lines 96-114)

**File 1: `backend/src/routes/routePlanning.ts` (Lines 28-51)**
**What to Highlight:**
```typescript
// Plan a route
routePlanningRouter.post('/plan', async (req: AuthRequest, res) => {
  try {
    const request: RouteRequest = req.body;

    // Validate required fields
    if (!request.origin || !request.destination) {
      return badRequestResponse(res, 'Origin and destination are required');
    }
    
    // ... validation ...

    const routePlan = await routePlanningService.planRoute(request);
    successResponse(res, routePlan, 'Route planned successfully');
  } catch (error) {
    console.error('Error planning route:', error);
    internalErrorResponse(res, 'Failed to plan route');
  }
});
```

**File 2: `backend/src/services/routePlanningService.ts` (Lines 143-320)**
**What to Highlight:**
- Lines 143-241: `generateAIRoute` method (shows AI orchestration)
- Lines 243-320: Retry logic and error handling

**File 3: `backend/src/services/routePlanningService.ts` (Lines 106-141)**
**What to Highlight:**
```typescript
// Retry with exponential backoff
private async retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  // ... exponential backoff implementation ...
}
```

**File 4: `backend/src/types/route.ts` (Lines 96-114)**
**What to Highlight:**
```typescript
export interface RouteResponse {
  inputsRecognized: { ... };
  routeSummary: RouteSummary;
  stopOptionSets: StopOptionSet[];
  topRatedMotels: RouteStop[];
  budgetFriendlyMotels: RouteStop[];
  offlineMapPlan: OfflineMapPlan;
  calendarExportReady: boolean;
  userChoicePrompt: string;
  mode?: 'live' | 'sample';
  modeInfo?: { ... };
}
```

**Script:**
> "I'd like to highlight the backend structure, which mirrors the **Controller-Service-Repository** layers often found in Java Spring applications.
>
> **1. The Controller Layer:**
> **[Visual: Open `backend/src/routes/routePlanning.ts`, show lines 28-51]**
> My route handlers are thin—they're essentially Spring `@RestController` methods. They handle HTTP concerns: validation, extracting the JWT token for auth—and then immediately delegate business logic to the service layer. This separation ensures the controller remains testable and doesn't contain business rules.
>
> **2. The Service Layer:**
> **[Visual: Switch to `routePlanningService.ts`, show `generateAIRoute` method, lines 143-241]**
> This is where the heavy lifting happens. Here, I orchestrate asynchronous operations to:
>
> 1. Build a structured prompt for the AI model with strict context.
> 2. Handle the unstructured JSON response from the AI.
> 3. Parse and validate the data before returning it to the controller.
>
> **[Visual: Scroll to retry logic, lines 106-141]**
> I noticed that AI APIs can timeout or hit rate limits. I implemented an exponential backoff retry mechanism here to improve reliability. This is a common pattern for handling transient failures in distributed systems—similar to Spring's `@Retryable` annotation or Resilience4j.
>
> **3. Type Safety:**
> **[Visual: Open `backend/src/types/route.ts`, show RouteResponse interface, lines 96-114]**
> Since I'm using TypeScript, I enforce strict typing across the stack. The frontend and backend share these interface definitions—similar to how you'd use DTOs in Spring—ensuring that if I change the API response structure, the build fails immediately rather than causing runtime errors. This catch-early philosophy is crucial in enterprise codebases."

**Key Points:**
- Compare to Spring annotations (`@RestController`, `@Retryable`) (Spring familiarity)
- Mention DTOs (enterprise pattern knowledge)
- "Enterprise codebases" (professional mindset)

---

## Part 5: Business Logic & Time Calculation (8:00 - 9:00)

**Visual Flow:**
1. VS Code: `backend/src/services/routePlanningService.ts` (finalizeItinerary method, lines 521-586)
2. VS Code: Show cost calculation (lines 552-555)
3. VS Code: Show time calculation method (lines 588-682)

**File: `backend/src/services/routePlanningService.ts` (Lines 521-586)**
**What to Highlight:**
```typescript
async finalizeItinerary(
  request: RouteRequest,
  selections: SelectedStops,
  routePlan?: any
): Promise<FinalItinerary> {
  // ... filter selected stops ...
  
  // Calculate costs
  const motelCost = selectedMotel ? (selectedMotel.priceEstimate || ...) : 0;
  const mealCost = selectedRestaurants.reduce(...) * (request.travelers || 1);
  const activityCost = selectedPois.reduce(...) * (request.travelers || 1);
  const gasCost = Math.round((routeSummary.totalDistance || 0) * 0.15);
  
  return {
    tripId: uuidv4(),
    routeSummary: { ... },
    selectedStops: { ... },
    stops: sortedSelectedStops,
    calendarEvents,  // Generated with realistic timings
    totalEstimatedCost: {
      amount: motelCost + mealCost + activityCost + gasCost,
      // ... breakdown ...
    }
  };
}
```

**Also Show: `generateCalendarEventsWithRouteData` (Lines 588-682)**
**What to Highlight:**
```typescript
private generateCalendarEventsWithRouteData(
  request: RouteRequest,
  sortedStops: RouteStop[],
  routeSummary: any,
  departureTime: string
): CalendarEvent[] {
  // ... cumulative time calculation logic ...
  // Drive time between stops is proportional to distance ratio
  const driveTimeMinutes = Math.round(
    (driveDistance / routeSummary.totalDistance) * routeSummary.estimatedDriveTime
  );
  // ...
}
```

**Script:**
> "Now let's look at the business logic layer—the rules that ensure the itinerary makes sense.
>
> **[Visual: Open `finalizeItinerary` method, lines 521-586]**
> When finalizing an itinerary, I apply several constraints:
>
> 1. **Time Calculation:** Drive time between stops is proportional to the distance ratio. If a stop is 25% along the route, it gets 25% of the total drive time. This ensures the timeline is realistic.
>
> 2. **Cost Aggregation:** **[Highlight lines 552-555]** I sum motel costs, meal costs per traveler, activity costs, and gas based on distance at $0.15 per mile. This is similar to how you'd calculate totals in a Spring service method—applying business rules and aggregating data.
>
> **[Visual: Show `generateCalendarEventsWithRouteData`, lines 588-682]**
> 3. **Calendar Generation:** Each drive segment and stop builds on the previous one using cumulative time calculations. This ensures the itinerary timeline is coherent—no overlapping events, no impossible time jumps."

**Key Points:**
- Show business logic complexity (not just CRUD)
- Mention realistic calculations (engineering quality)
- Compare to Spring service methods (pattern alignment)

---

## Part 6: Scalability & Future Improvements (9:00 - 10:00)

**Visual Flow:**
1. VS Code: Open `DESIGN.md` (scroll to "Scalability Considerations" section, lines 163-190)
2. Or VS Code: Open `PROJECT_CONTEXT.md` (scroll to "Event-Driven Architecture & Kafka Considerations")

**File: `DESIGN.md` (Lines 163-190) or `PROJECT_CONTEXT.md` (Event-Driven section)**

**What to Highlight:**
- Scalability mitigations (caching, rate limiting, async processing)
- Event-driven architecture considerations
- Kafka/queue alternatives

**Script:**
> "In the job description, you mentioned scalability and optimizing existing codebases.
>
> Currently, this app runs on a synchronous Request-Response cycle. While fine for an MVP, the AI generation can take 10-45 seconds, which risks HTTP timeouts on serverless platforms.
>
> **[Visual: Show DESIGN.md scalability section]**
> If I were moving this to a production enterprise environment at Daxwell, I would refactor this into an **Event-Driven Architecture**:
>
> 1. The user request would publish an event to a message queue (like **Kafka** or **RabbitMQ**).
> 2. A worker service would consume the event and process the route calculation asynchronously.
> 3. We would use WebSockets or Server-Sent Events to push the result back to the client.
>
> This decouples the request from the long-running operation, which is a common pattern in Spring Boot applications using `@Async` or Spring Cloud Stream for Kafka integration.
>
> I also structured the database schema in **PostgreSQL** with future scaling in mind, using UUIDs for primary keys and indexing the `user_id` columns—similar to how you'd optimize JPA queries in Spring Data."

**Key Points:**
- Mention Kafka/RabbitMQ (enterprise messaging knowledge)
- Compare to Spring `@Async`, Spring Cloud Stream (Spring expertise)
- Mention JPA/Spring Data (database layer knowledge)

---

## Part 7: Conclusion (10:00 - 10:30)

**Visual Flow:**
Camera on you (final 30 seconds)

**Script:**
> "To summarize, TravelM8 demonstrates my ability to:
>
> 1. Build full-stack applications with complex business logic and data transformation.
> 2. Implement clean architecture using Facade and Strategy patterns—patterns that translate directly to Spring Boot applications.
> 3. Integrate and manage external APIs with proper error handling and retry logic.
> 4. Design for scalability with event-driven architecture considerations.
>
> While I built this in Node.js and TypeScript, the architectural principles—layered services, design patterns, and separation of concerns—are the same whether you're writing Spring Boot controllers or Express routes.
>
> I'm excited about the possibility of bringing this engineering mindset to the team at Daxwell. Thank you for your time."

**Key Points:**
- Reinforce transferability of skills (Node → Spring Boot)
- Emphasize architecture over language
- Professional closing

---

## Detailed File & Line References

### Part 3: Architecture

**File 1: `DESIGN.md`**
- **Lines 5-47**: ASCII architecture diagram
- **Show**: Full diagram, point to Facade pattern, dual-mode routing

**File 2: `backend/src/services/routePlanningService.ts`**
- **Lines 31-42**: Facade pattern implementation (service routing)
- **Show**: Highlight `if (config.sampleDataMode)` and `sampleItineraryService.planRoute()` vs `liveItineraryService.planRoute()`

---

### Part 4: Code Walkthrough

**File 1: `backend/src/routes/routePlanning.ts`**
- **Lines 28-51**: Controller endpoint (`POST /route/plan`)
- **Show**: Validation, service delegation, error handling

**File 2: `backend/src/services/routePlanningService.ts`**
- **Lines 143-241**: `generateAIRoute` method (AI orchestration)
- **Lines 106-141**: `retryWithBackoff` method (exponential backoff)
- **Show**: Highlight retry logic, error handling, API call orchestration

**File 3: `backend/src/types/route.ts`**
- **Lines 96-114**: `RouteResponse` interface
- **Show**: Type definition, emphasize `mode` and `modeInfo` fields

**Optional File 4: `backend/src/config/index.ts`**
- **Lines 1-50**: Configuration management
- **Show**: `SAMPLE_DATA_MODE` configuration, centralized config

---

### Part 5: Business Logic

**File: `backend/src/services/routePlanningService.ts`**
- **Lines 521-586**: `finalizeItinerary` method (cost calculation, aggregation)
- **Lines 588-682**: `generateCalendarEventsWithRouteData` (time calculation)
- **Show**: 
  - Cost aggregation (lines 552-555)
  - Time calculation logic (lines 618-633: drive time calculation)

---

### Part 6: Scalability

**File 1: `DESIGN.md`**
- **Lines 163-190**: "Scalability Considerations" section
- **Show**: Scalability mitigations, future improvements

**File 2: `PROJECT_CONTEXT.md` (Alternative)**
- **Event-Driven Architecture & Kafka Considerations** section
- **Show**: Kafka topics, event-driven flow, alternatives

---

## Quick Reference: Files to Have Open in VS Code

1. **`DESIGN.md`** — Architecture diagram (Part 3, Part 6)
2. **`backend/src/services/routePlanningService.ts`** — Core facade (Part 3, Part 4, Part 5)
3. **`backend/src/routes/routePlanning.ts`** — Controller layer (Part 4)
4. **`backend/src/types/route.ts`** — Type definitions (Part 4)
5. **`backend/src/config/index.ts`** — Configuration (Part 3, optional)

---

## Recording Tips

1. **Screen Recording Setup:**
   - Use Loom or OBS Studio
   - Enable camera-in-corner mode (personal touch)
   - Record at 1080p minimum

2. **Code Navigation:**
   - Use **Ctrl/Cmd + G** to jump to line numbers quickly
   - Use **Ctrl/Cmd + F** to find methods
   - Highlight code by clicking and dragging (slowly for video)
   - Zoom in on VS Code (Ctrl/Cmd + Plus) for readability

3. **Pacing:**
   - **Don't rush** through code—allow viewer to read
   - Pause after showing code for 2-3 seconds
   - Speak clearly when explaining technical concepts

4. **Visual Emphasis:**
   - **Mouse highlighting**: Drag cursor over code while speaking
   - **Zoom in**: Use VS Code zoom for small code sections
   - **Split screen**: If possible, show diagram + code side-by-side

5. **Bridge to Spring Boot:**
   - Say "**similar to**" or "**like in**" when drawing parallels
   - Use Spring terminology: `@Service`, `@RestController`, `@Retryable`, DTOs
   - Emphasize "**enterprise**" and "**production**" mindset

6. **Practice Runs:**
   - Record a dry run first (don't submit)
   - Check audio clarity (no echo, clear speech)
   - Verify code is readable (font size, syntax highlighting)

---

## Final Checklist Before Recording

- [ ] All files open in VS Code (DESIGN.md, routePlanningService.ts, routePlanning.ts, route.ts)
- [ ] Browser ready with app running (localhost:3000 or deployed)
- [ ] VS Code syntax highlighting enabled
- [ ] Line numbers visible in VS Code
- [ ] Screen recording software configured
- [ ] Passcode ready: `InterviewDaxwell123@`
- [ ] Script reviewed and practiced

---

**Good luck with your interview! This script positions you as someone who thinks in architectural patterns, not just syntax.**
