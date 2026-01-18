# TravelM8 / DayMate — System Design

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (React)                       │
│  Components: RoutePlanner, TripList, Dashboard, Auth        │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST (JSON)
┌──────────────────▼──────────────────────────────────────────┐
│              API Layer (Express / Vercel)                    │
│  Routes: /route/plan, /route/finalize, /trips, /auth        │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│            Route Planning Service (Facade)                   │
│  ┌──────────────────────────────────────────────────┐       │
│  │  RoutePlanningService.planRoute(request)         │       │
│  │    ├─ if (SAMPLE_DATA_MODE) →                    │       │
│  │    │    SampleItineraryService.planRoute()       │       │
│  │    └─ else →                                      │       │
│  │         LiveItineraryService.planRoute()         │       │
│  └──────────────────────────────────────────────────┘       │
└──────────────────┬──────────────────────────────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
┌─────▼──────────┐    ┌─────────▼─────────┐
│  Sample Mode   │    │    Live Mode      │
│  (Deterministic│    │  (External APIs)  │
│   LA→SF data)  │    │                   │
└────────────────┘    └─────────┬─────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼────┐  ┌──────▼────┐  ┌──────▼─────┐
        │  Gemini AI │  │   OSRM    │  │  Nominatim │
        │  (Routes,  │  │  (Routing)│  │ (Geocoding)│
        │   Stops)   │  │           │  │            │
        └────────────┘  └───────────┘  └────────────┘
                                │
                        ┌───────▼────────┐
                        │ OpenStreetMap  │
                        │  (Fallback)    │
                        └────────────────┘
```

---

## Request Lifecycle

### Route Planning Flow

1. **Client Request**: User submits origin, destination, budget, preferences
2. **Route Handler**: Validates input, authenticates user
3. **Service Selection**: `RoutePlanningService` checks `SAMPLE_DATA_MODE`:
   - `true` → `SampleItineraryService` (deterministic LA→SF data)
   - `false` → `LiveItineraryService` (external APIs)
4. **Data Processing**: Service generates route summary, stops, recommendations
5. **Response**: Consistent `RouteResponse` schema returned to client

### Itinerary Finalization Flow

1. **Client Selection**: User selects POIs, restaurants, motel
2. **Finalization**: `RoutePlanningService.finalizeItinerary()`:
   - Filters selected stops from route plan
   - Calculates drive times between stops
   - Generates calendar events with realistic timings
   - Aggregates total costs
3. **Calendar Export**: Generates `.ics` file for download

---

## Service Responsibilities

### RoutePlanningService (Facade)

- **Purpose**: Routes requests to appropriate service based on mode
- **Responsibilities**:
  - Service selection (Sample vs Live)
  - Itinerary finalization
  - Calendar event generation
  - Trip persistence

### SampleItineraryService

- **Purpose**: Provides deterministic sample data
- **Responsibilities**:
  - Returns predefined LA→SF itinerary
  - Validates route support
  - No external API calls

### LiveItineraryService

- **Purpose**: Generates routes using real-time external APIs
- **Responsibilities**:
  - Geocoding (Nominatim)
  - Routing (OSRM)
  - AI recommendations (Gemini)
  - Fallback to OpenStreetMap APIs

### GeocodingService

- **Purpose**: Convert addresses to coordinates
- **Implementation**: Nominatim API with caching

### OSMRouteService

- **Purpose**: Free fallback when Gemini fails
- **Implementation**: Overpass API (POIs) + Nominatim (restaurants/hotels)

---

## Trade-offs

### Dual-Mode Architecture

**Decision**: Single codebase supports both Sample and Live modes.

**Rationale**:
- Enables development, testing, and production in one system
- Deterministic sample data for consistent testing
- No need for separate demo environment

**Trade-offs**:
- ✅ Consistent response schema
- ✅ Easy mode switching
- ❌ Sample mode only supports LA→SF currently
- ❌ Slightly more complex codebase (service routing)

### Vercel Serverless vs Express

**Decision**: Vercel Serverless for production, Express for local dev.

**Rationale**:
- Free hosting, easy deployment
- Express provides better local development experience

**Trade-offs**:
- ✅ Free, scalable hosting
- ✅ Easy deployment
- ❌ Cold starts on Vercel (may cause delays)
- ❌ Execution time limits

### Neon PostgreSQL vs DynamoDB

**Decision**: Neon PostgreSQL for relational data.

**Rationale**:
- Free tier available
- Familiar SQL syntax
- Better for user/trip relationships

**Trade-offs**:
- ✅ Free tier
- ✅ SQL queries
- ❌ Connection limits on free tier
- ❌ Requires connection pooling

---

## Scalability Considerations

### Current Limitations

- **Sample Mode**: Only 1 route (LA→SF)
- **API Rate Limits**: Gemini, OSRM have rate limits
- **Database**: Free tier connection limits
- **Serverless**: Cold starts on Vercel

### Mitigations

#### Short-Term

1. **Caching**: Redis for route responses and geocoding
2. **Rate Limiting**: Per-user and per-IP limits
3. **Connection Pooling**: `pg-pool` for database connections

#### Medium-Term

1. **Async Processing**: Queue long-running tasks (Bull/BullMQ)
2. **CDN**: Cache static assets and common routes
3. **Database Indexing**: Index `userId`, `tripId` for faster queries

#### Long-Term

1. **Horizontal Scaling**: Stateless services enable easy scaling
2. **Read Replicas**: Database read replicas for heavy read workloads
3. **Batch API Calls**: Reduce external API calls through batching

---

## What Breaks First & Mitigations

### Failure Points (in order of likelihood)

1. **Gemini API Rate Limits** (most likely)
   - **Mitigation**: Fallback to OpenStreetMap APIs, exponential backoff retry

2. **Database Connection Pool Exhaustion**
   - **Mitigation**: Connection pooling, connection limits, connection timeout

3. **OSRM/Nominatim Downtime**
   - **Mitigation**: Fallback to calculated distance, cached geocoding results

4. **Vercel Cold Starts** (latency)
   - **Mitigation**: Keep-alive pings, edge functions for lightweight operations

5. **Memory/CPU Limits** (Vercel free tier)
   - **Mitigation**: Optimize response sizes, pagination, async processing

---

## Testing Strategy

### Unit Tests

- Service methods (route generation, cost calculation)
- Utility functions (geocoding, time calculations)
- Business logic (budget filtering, stop ranking)

### Integration Tests

- API endpoints (with test database)
- Service integration (Sample vs Live mode)
- External API mocking (Gemini, OSRM)

### E2E Tests

- Full user flow: Register → Plan Route → Finalize → Export
- Sample mode deterministic output validation

### Test Data

- Sample mode: Deterministic LA→SF data
- Live mode: Mock external API responses

---

## Key Business Logic

### Route Planning Constraints

- **Drive Time Calculation**: Based on OSRM actual routes (not straight-line)
- **Stop Distribution**: Stops distributed along route (not clustered)
- **Budget Filtering**: Recommendations filtered by user budget
- **Detour Time**: Maximum 30 minutes off route for stops

### Time Calculation

```typescript
// Drive time between stops
driveTime = (distance / totalDistance) * totalDriveTime

// Arrival time at stop
arrivalTime = departureTime + cumulativeDriveTime + cumulativeStopTime

// Total trip duration
totalDuration = sum(driveTimes) + sum(stopTimes)
```

### Cost Aggregation

```typescript
totalCost = (
  motelCost * nights +
  mealCost * travelers * mealCount +
  activityCost * travelers +
  gasCost (distance * $0.15/mile)
)
```

---

## Future Improvements

### Immediate (1-3 months)

- Redis caching for routes and geocoding
- Rate limiting middleware
- More sample routes (NY→DC, Chicago→Nashville)

### Medium-Term (3-6 months)

- Async queue for itinerary generation
- Offline map tile caching
- Analytics dashboard (popular routes, user patterns)

### Long-Term (6-12 months)

- React Native mobile app
- Multi-modal transportation (flights, public transit)
- Machine learning for personalized recommendations
- Social features (trip sharing, collaboration)

---

**Last Updated**: January 2025  
**Version**: 2.0.0
