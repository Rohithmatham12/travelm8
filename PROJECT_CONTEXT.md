# TravelM8 / DayMate — Complete Project Context & Documentation

**Purpose**: Comprehensive project documentation for LLM training and context understanding  
**Last Updated**: January 2025  
**Version**: 1.0.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Pain Point & Problem Statement](#pain-point--problem-statement)
3. [Solution & Value Proposition](#solution--value-proposition)
4. [Project Scope](#project-scope)
5. [Features & Functionality](#features--functionality)
6. [Architecture Overview](#architecture-overview)
7. [Design Patterns](#design-patterns)
8. [Technology Stack](#technology-stack)
9. [Directory Structure](#directory-structure)
10. [Dual-Mode Data Architecture](#dual-mode-data-architecture)
11. [AWS Architecture (Original Planning)](#aws-architecture-original-planning)
12. [Free-Tier Architecture (Current Implementation)](#free-tier-architecture-current-implementation)
13. [Event-Driven Architecture & Kafka Considerations](#event-driven-architecture--kafka-considerations)
14. [User Types & Personas](#user-types--personas)
15. [Testing Strategy](#testing-strategy)
16. [Deployment Strategies](#deployment-strategies)
17. [Scalability Analysis](#scalability-analysis)
18. [Future Features & Roadmap](#future-features--roadmap)
19. [Business Logic & Constraints](#business-logic--constraints)
20. [API Specifications](#api-specifications)
21. [Database Schema](#database-schema)
22. [Error Handling & Reliability](#error-handling--reliability)
23. [Security Considerations](#security-considerations)

---

## Project Overview

**TravelM8 / DayMate** is an AI-powered, route-based travel planning platform that generates personalized itineraries for road trips. Unlike traditional travel tools that suggest generic city attractions, TravelM8 calculates the exact driving route between origin and destination, then suggests Points of Interest (POIs), restaurants, and accommodations along that specific path.

**Core Philosophy**: Route-based planning (places along your route) vs. city-based planning (generic attractions).

**Current Status**: Production-ready free-tier implementation on Vercel + Neon PostgreSQL, with dual-mode operation (Live Mode for production, Sample Data Mode for testing/demos).

---

## Pain Point & Problem Statement

### Primary Pain Points

1. **Generic City Suggestions**: Existing travel tools (TripAdvisor, Google Travel) suggest popular attractions in a city, not places along your actual driving route. This leads to:
   - Irrelevant suggestions (attractions 50+ miles off-route)
   - Inefficient route planning
   - Wasted time and fuel

2. **Manual Route Planning**: Users must manually:
   - Calculate driving distances
   - Find places along the route
   - Estimate detour times
   - Budget for meals, accommodations, activities

3. **Lack of Route-Specific Data**: No single platform provides:
   - POIs ranked by detour time from route
   - Restaurants with actual distance from highway
   - Budget-friendly motels along the route
   - Time-based recommendations (breakfast stops, lunch spots, overnight stays)

4. **Offline Planning Needs**: Travelers need:
   - Offline map preparation instructions
   - Route corridor downloads
   - Selected stop pinning for offline navigation

5. **Cost Estimation**: Difficult to estimate total trip costs (gas, meals, accommodations, activities) before departure.

---

## Solution & Value Proposition

### Core Solution

TravelM8 solves the route-planning problem by:

1. **Route Calculation**: Uses OSRM (Open Source Routing Machine) to calculate actual driving routes, not straight-line distances.

2. **AI-Powered Recommendations**: Uses Google Gemini AI to generate intelligent stop suggestions along the route, considering:
   - Distance from route (detour time)
   - User budget constraints
   - Ratings and review counts
   - Open hours and availability

3. **Budget-Aware Filtering**: Filters recommendations by user budget:
   - Motel/hotel per-night budget
   - Meal budget per person
   - Activity cost estimates

4. **Deterministic Testing**: Dual-mode architecture enables reliable testing with sample data, no external API dependencies.

5. **Calendar Integration**: Generates `.ics` calendar files with realistic timing for each stop and drive segment.

6. **Offline Planning**: Provides instructions for offline map preparation, route corridors, and stop pinning.

---

## Project Scope

### In-Scope

✅ **Route-Based Planning**:
- Origin → Destination route calculation
- POI recommendations along route
- Restaurant suggestions with detour times
- Motel/hotel recommendations (budget-friendly + top-rated)
- Budget filtering and cost estimation

✅ **Itinerary Management**:
- User selects stops (POIs, restaurants, motel)
- Final itinerary generation with realistic timings
- Calendar export (.ics format)
- Trip persistence to user accounts

✅ **User Authentication**:
- JWT-based authentication
- User registration and login
- Demo account for quick testing

✅ **Dual-Mode Operation**:
- Live Mode: Real-time external APIs (Gemini, OSRM, Nominatim, OSM)
- Sample Data Mode: Deterministic LA→SF itinerary data

✅ **Free-Tier Hosting**:
- Vercel (frontend + serverless functions)
- Neon PostgreSQL (database)
- Free external APIs (OSRM, Nominatim, Overpass)

### Out-of-Scope (Future)

❌ **Multi-Modal Transportation**: Flights, trains, buses (future)
❌ **Social Features**: Trip sharing, collaborative planning (future)
❌ **Mobile Native Apps**: React Native app (future)
❌ **Real-Time Collaboration**: Live trip editing with multiple users (future)
❌ **Payment Integration**: Booking payments, reservations (future)
❌ **Advanced AI Features**: Personalized ML-based recommendations (future)

---

## Features & Functionality

### Core Features

1. **Route Planning**
   - Input: Origin, destination, departure date/time, travelers, budget
   - Output: Route summary (distance, drive time), stop options (POIs, restaurants, motels), mode indicator

2. **Stop Selection**
   - User selects 2-3 POIs, 1-2 restaurants, 1 motel
   - Recommendations ranked by detour time, ratings, budget fit
   - Verification status (Verified, Partially Verified, Not Verified)

3. **Itinerary Finalization**
   - Calculates realistic drive times between stops
   - Generates calendar events with arrival/departure times
   - Aggregates total costs (motels, meals, activities, gas)
   - Provides offline map planning instructions

4. **Calendar Export**
   - Generates `.ics` file for calendar integration
   - Includes all stops, drive segments, arrival times
   - Supports Google Calendar, Apple Calendar, Outlook

5. **Trip Management**
   - Save trips to user accounts
   - List user's saved trips
   - View trip details
   - Update or delete trips

6. **Budget Filtering**
   - Filters motels by per-night budget
   - Filters restaurants by per-person meal budget
   - Labels recommendations: "Within budget", "Slightly above budget", "Budget unknown"

7. **Mode Indicators**
   - Visual badges in UI: "Sample Mode" (📦) vs "Live Mode" (🌐)
   - API response includes `mode` and `modeInfo` fields
   - Clear indication of which data source is used

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React Frontend)                  │
│  - RoutePlanner component                                   │
│  - TripList, Dashboard, Auth components                     │
│  - Leaflet maps for route visualization                     │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST (JSON)
┌──────────────────▼──────────────────────────────────────────┐
│              API Layer (Express / Vercel)                   │
│  - Routes: /route/plan, /route/finalize, /trips, /auth     │
│  - Request validation, authentication middleware            │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│         Route Planning Service (Facade Pattern)             │
│  RoutePlanningService.planRoute(request)                    │
│    ├─ if (SAMPLE_DATA_MODE) →                               │
│    │    SampleItineraryService.planRoute()                  │
│    └─ else →                                                │
│         LiveItineraryService.planRoute()                    │
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
                                │
                    ┌───────────▼───────────┐
                    │   Neon PostgreSQL     │
                    │  (Trip persistence)   │
                    └───────────────────────┘
```

### Request Flow

1. **Client Request**: User submits route planning request via React UI
2. **API Validation**: Express/Vercel route handler validates input (origin, destination, date, travelers)
3. **Authentication**: JWT token validation (if required endpoint)
4. **Service Routing**: RoutePlanningService checks `SAMPLE_DATA_MODE`:
   - `true` → SampleItineraryService (deterministic data)
   - `false` → LiveItineraryService (external APIs)
5. **Data Generation**: Service generates route summary, stop options, recommendations
6. **Response**: Consistent `RouteResponse` schema returned to client
7. **Finalization**: User selects stops → RoutePlanningService.finalizeItinerary() → Calendar events + costs
8. **Persistence**: Trip saved to Neon PostgreSQL (optional)

---

## Design Patterns

### 1. Facade Pattern

**Implementation**: `RoutePlanningService` acts as a facade, routing requests to appropriate service based on mode.

**Purpose**: Simplifies client interaction, hides complexity of service selection.

**Location**: `backend/src/services/routePlanningService.ts`

```typescript
async planRoute(request: RouteRequest): Promise<RouteResponse> {
  if (config.sampleDataMode) {
    return await sampleItineraryService.planRoute(request);
  }
  return await liveItineraryService.planRoute(request);
}
```

### 2. Strategy Pattern

**Implementation**: `SampleItineraryService` and `LiveItineraryService` are interchangeable strategies for route generation.

**Purpose**: Allows runtime selection of route generation strategy based on configuration.

**Benefits**: Easy to add new strategies (e.g., cached mode, ML-based mode).

### 3. Service Layer Pattern

**Implementation**: Clear separation between routes (handlers), services (business logic), and external APIs.

**Purpose**: 
- Routes handle HTTP concerns (validation, auth)
- Services contain business logic (time calculation, cost aggregation)
- External APIs abstracted behind service interfaces

**Structure**:
```
Routes → Services → External APIs / Data
```

### 4. Repository Pattern (Partial)

**Implementation**: `storage.ts` abstracts database operations.

**Purpose**: Decouples business logic from database implementation (can switch from PostgreSQL to another DB).

**Location**: `backend/src/utils/storage.ts`

### 5. Configuration Pattern

**Implementation**: Centralized configuration in `backend/src/config/index.ts`.

**Purpose**: Single source of truth for environment variables, feature flags, API keys.

**Benefits**: Easy to test different configurations, clear dependency on environment.

---

## Technology Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI library | 18.x / 19.x |
| TypeScript | Type safety | 4.9+ |
| React Router | Navigation | 6.x |
| Leaflet | Maps | 1.9+ |
| React-Leaflet | React wrapper for Leaflet | 4.x |
| Axios | HTTP client | 1.13+ |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| Express.js | Web framework | 4.18+ |
| TypeScript | Type safety | 5.6+ |
| Node.js | Runtime | 20+ |
| jsonwebtoken | JWT authentication | 9.0+ |
| bcryptjs | Password hashing | 2.4+ |
| Axios | HTTP client for external APIs | 1.13+ |
| uuid | Unique ID generation | 9.0+ |
| dotenv | Environment variables | Latest |

### Database

| Technology | Purpose | Provider |
|------------|---------|----------|
| PostgreSQL | Relational database | Neon (free tier) |
| @neondatabase/serverless | Neon client | 1.0+ |

### External APIs

| API | Purpose | Cost |
|-----|---------|------|
| Google Gemini AI | Route recommendations, stop generation | Free tier available |
| OSRM | Driving route calculation | Free (open source) |
| Nominatim (OpenStreetMap) | Geocoding (address → coordinates) | Free (rate-limited) |
| Overpass API | POI data (parks, museums, viewpoints) | Free |
| OpenStreetMap | Fallback route generation | Free |

### Hosting & Deployment

| Service | Purpose | Cost |
|---------|---------|------|
| Vercel | Frontend + serverless functions | Free tier |
| Neon PostgreSQL | Database hosting | Free tier |
| Railway (previously considered) | Backend hosting | Not free, avoided |

---

## Directory Structure

### Root Level

```
travelm8/
├── README.md                  # Project overview, setup instructions
├── DESIGN.md                  # System design, architecture, trade-offs
├── VIDEO_SCRIPT.md            # 5-10 minute walkthrough script
├── PROJECT_CONTEXT.md         # This file - complete context
├── DEPLOYMENT.md              # Deployment instructions
│
├── backend/                   # Express backend (local dev)
│   ├── src/
│   │   ├── config/           # Configuration (SAMPLE_DATA_MODE)
│   │   ├── routes/           # API route handlers
│   │   │   ├── auth.ts
│   │   │   ├── routePlanning.ts
│   │   │   └── trips.ts
│   │   ├── services/         # Business logic
│   │   │   ├── routePlanningService.ts    # Facade
│   │   │   ├── sampleItineraryService.ts  # Sample mode
│   │   │   ├── liveItineraryService.ts    # Live mode
│   │   │   ├── geocodingService.ts
│   │   │   └── osmRouteService.ts         # OSM fallback
│   │   ├── types/            # TypeScript types
│   │   │   └── route.ts      # RouteRequest, RouteResponse, etc.
│   │   ├── utils/            # Shared utilities
│   │   │   ├── auth.ts       # JWT utilities
│   │   │   ├── response.ts   # API response helpers
│   │   │   └── storage.ts    # Database operations
│   │   └── server.ts         # Express entry point
│   ├── .env.example          # Environment template
│   └── package.json
│
├── frontend/                  # React frontend
│   ├── api/                   # Vercel serverless functions (prod)
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   └── demo.ts
│   │   ├── route/
│   │   │   ├── plan.ts
│   │   │   ├── finalize.ts
│   │   │   └── export-calendar.ts
│   │   └── trips/
│   ├── lib/                   # Shared libraries
│   │   └── db.ts             # Database connection (Neon)
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── RoutePlanner.tsx    # Main planning UI
│   │   │   ├── TripList.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Auth.tsx
│   │   ├── utils/            # Client utilities
│   │   │   ├── api.ts        # API client (axios wrapper)
│   │   │   └── auth.ts       # Auth utilities
│   │   └── types/            # TypeScript types
│   └── package.json
│
├── infrastructure/            # AWS CDK infrastructure (legacy, not used)
│   ├── lib/
│   └── package.json
│
└── docs/                      # Additional documentation
```

### Key Files

**Backend Core**:
- `backend/src/services/routePlanningService.ts`: Main facade, service routing
- `backend/src/services/sampleItineraryService.ts`: Deterministic LA→SF data
- `backend/src/services/liveItineraryService.ts`: Real-time API integration (placeholder)
- `backend/src/config/index.ts`: Centralized configuration
- `backend/src/types/route.ts`: Type definitions (RouteRequest, RouteResponse, etc.)

**Frontend Core**:
- `frontend/src/components/RoutePlanner.tsx`: Main planning interface
- `frontend/src/utils/api.ts`: API client with retry logic
- `frontend/src/utils/auth.ts`: Authentication utilities

**API Endpoints** (Vercel serverless functions):
- `frontend/api/route/plan.ts`: Route planning endpoint
- `frontend/api/route/finalize.ts`: Itinerary finalization endpoint
- `frontend/api/auth/login.ts`, `register.ts`, `demo.ts`: Authentication endpoints

---

## Dual-Mode Data Architecture

### Overview

The application supports two data modes controlled by `SAMPLE_DATA_MODE` environment variable:

- **Live Mode** (`SAMPLE_DATA_MODE=false`): Real-time external APIs
- **Sample Data Mode** (`SAMPLE_DATA_MODE=true`): Deterministic, predefined data

### Live Mode

**Data Sources**:
- Google Gemini AI: Generates route recommendations, POIs, restaurants, motels
- OSRM: Calculates actual driving distance and time
- Nominatim: Geocodes addresses to coordinates
- OpenStreetMap APIs (Overpass, Nominatim): Fallback when Gemini fails

**Characteristics**:
- Dynamic, supports any origin/destination
- Up-to-date data (ratings, prices, availability)
- Subject to API rate limits
- May have latency (external API calls)
- Requires API keys (Gemini)

**Use Case**: Production, actual user traffic

### Sample Data Mode

**Data Sources**:
- Predefined, hardcoded LA→SF itinerary data
- No external API calls
- Deterministic output (same input → same output)

**Characteristics**:
- Fast (no network calls)
- Consistent (reproducible results)
- Free (no API costs)
- Limited route support (currently only LA→SF)
- Static data (not updated)

**Use Case**: Development, testing, debugging, documentation, user onboarding

### Implementation

**Service Routing** (in `routePlanningService.ts`):
```typescript
async planRoute(request: RouteRequest): Promise<RouteResponse> {
  if (config.sampleDataMode) {
    try {
      return await sampleItineraryService.planRoute(request);
    } catch (error) {
      // Fallback to live mode if route not supported
      console.warn(`Route not supported in sample mode, falling back...`);
    }
  }
  
  // Live Mode: Use external APIs
  return await liveItineraryService.planRoute(request);
}
```

**Configuration** (`backend/src/config/index.ts`):
```typescript
export const config = {
  sampleDataMode: process.env.SAMPLE_DATA_MODE === 'true',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  // ... other config
};
```

**Response Schema**: Both modes return identical `RouteResponse` structure with `mode` and `modeInfo` fields.

---

## AWS Architecture (Original Planning)

### Initial AWS Design (Not Implemented - Too Costly)

**Original Intent**: Serverless architecture on AWS with managed services.

**Planned Services**:

1. **AWS Lambda**
   - Serverless function execution
   - Route planning, itinerary generation
   - Calendar export generation

2. **AWS DynamoDB**
   - NoSQL database for trips, users
   - Partition key: `userId`
   - Sort key: `tripId`

3. **AWS Cognito**
   - User authentication and authorization
   - JWT token generation
   - User pools for registration/login

4. **AWS API Gateway**
   - REST API endpoint management
   - Request/response transformation
   - Rate limiting, CORS handling

5. **AWS Amplify**
   - Frontend hosting and deployment
   - CI/CD pipeline
   - Environment management

6. **AWS S3** (Optional)
   - Calendar file storage
   - Static asset hosting

7. **AWS CloudFront** (Optional)
   - CDN for static assets
   - Edge caching

### Why We Moved Away

1. **Cost**: AWS services can become expensive with traffic
2. **Free Tier Limits**: Limited requests, storage, compute time
3. **Complexity**: Multiple AWS services to manage
4. **Vendor Lock-in**: Heavy dependency on AWS ecosystem

### Current Free-Tier Architecture

- **Frontend**: Vercel (free tier)
- **Backend**: Vercel serverless functions (free tier)
- **Database**: Neon PostgreSQL (free tier)
- **APIs**: Free external APIs (OSRM, Nominatim, OSM)

---

## Free-Tier Architecture (Current Implementation)

### Deployment Architecture

```
User Browser
    ↓
Vercel Frontend (React)
    ├─ Static assets (CDN)
    └─ Serverless Functions (API endpoints)
            ├─ /api/route/plan → routePlanningService
            ├─ /api/route/finalize → itineraryService
            ├─ /api/auth/* → authService
            └─ /api/trips/* → tripService
                    ↓
            Neon PostgreSQL (Serverless)
            └─ Tables: users, trips
```

### Vercel Serverless Functions

**Location**: `frontend/api/` directory

**Function Structure**:
```typescript
// frontend/api/route/plan.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { routePlanningService } from '../../../backend/src/services/routePlanningService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const routePlan = await routePlanningService.planRoute(req.body);
  return res.status(200).json({ success: true, data: routePlan });
}
```

**Benefits**:
- Automatic scaling
- No server management
- Free tier: 100GB bandwidth/month, 100GB-hours compute
- Easy deployment (git push)

### Neon PostgreSQL

**Setup**: Serverless PostgreSQL database

**Schema**:
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  origin VARCHAR(255),
  destination VARCHAR(255),
  route_data JSONB,
  itinerary JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Connection**: `@neondatabase/serverless` package for serverless-friendly connections.

---

## Event-Driven Architecture & Kafka Considerations

### Current Architecture (Request-Response)

**Pattern**: Synchronous request-response via HTTP/REST.

**Flow**:
1. Client sends HTTP POST request
2. API endpoint processes request
3. Service calls external APIs synchronously
4. Response returned immediately

**Limitations**:
- Long-running operations (AI generation) may timeout
- No background processing
- No event logging/auditing
- Difficult to retry failed operations

### Event-Driven Architecture (Future Consideration)

**Potential Use Cases**:

1. **Async Route Generation**
   - User submits route request → Event published to Kafka
   - Background worker consumes event, generates route
   - WebSocket/SSE notifies client when ready

2. **Trip Status Updates**
   - Trip created → Event: `trip.created`
   - Route generated → Event: `route.generated`
   - Itinerary finalized → Event: `itinerary.finalized`
   - Calendar exported → Event: `calendar.exported`

3. **Analytics & Monitoring**
   - All events logged to Kafka
   - Consumer processes events for analytics
   - Real-time dashboards from event stream

4. **Notification System**
   - Event: `trip.reminder` → Email/SMS notification
   - Event: `route.updated` → Push notification

### Kafka Integration (Hypothetical)

**Topics**:
- `route.requests`: Route planning requests
- `route.responses`: Route planning completions
- `itinerary.updates`: Itinerary finalization events
- `trip.events`: All trip-related events

**Producer**: API endpoints publish events after processing

**Consumers**:
- Route generation worker (consumes `route.requests`)
- Notification service (consumes `trip.events`)
- Analytics service (consumes all events)

**Benefits**:
- Decoupling of services
- Scalability (horizontal scaling of workers)
- Reliability (events persisted, retryable)
- Auditability (event log for debugging)

**Challenges**:
- Complexity (additional infrastructure)
- Cost (Kafka cluster hosting)
- Latency (event processing may be slower than direct calls)

**Alternatives** (Free Tier):
- Bull/BullMQ (Redis-based job queue) - simpler, free-tier Redis available
- Vercel Background Functions - serverless background jobs
- RabbitMQ (self-hosted or cloud) - message broker

---

## User Types & Personas

### Primary User Types

1. **Road Trip Planner** (Primary)
   - **Goal**: Plan a multi-day road trip with stops
   - **Needs**: Route calculation, POI suggestions, accommodation booking, budget planning
   - **Usage**: Infrequent (once per trip, 2-4 times per year)

2. **Frequent Traveler** (Secondary)
   - **Goal**: Quick route planning for regular travel
   - **Needs**: Fast route generation, saved trip templates
   - **Usage**: Frequent (weekly or monthly)

3. **Budget-Conscious Traveler** (Tertiary)
   - **Goal**: Find cheapest options for meals, accommodations
   - **Needs**: Budget filtering, cost estimates, free/cheap POI suggestions
   - **Usage**: Occasional (based on budget constraints)

4. **Demo User** (Testing/Onboarding)
   - **Goal**: Explore platform without signing up
   - **Needs**: Quick access, no registration, sample data
   - **Implementation**: Demo account (`demo@daymate.app` / `demo123`)

### User Roles

Currently, no role-based access control (RBAC). All authenticated users have same permissions:
- Create trips
- View own trips
- Update own trips
- Delete own trips

**Future Roles** (Not Implemented):
- **Admin**: View all trips, analytics, user management
- **Premium User**: Advanced features (more routes, priority support)
- **Guest**: Limited features (view-only, no save)

---

## Testing Strategy

### Current State

**No test files or test infrastructure currently in place**. However, testing strategy is designed for future implementation.

### Unit Testing Strategy

**Target Files**:
- Service methods (`routePlanningService`, `sampleItineraryService`)
- Utility functions (`geocodingService`, time calculations, cost aggregation)
- Business logic (budget filtering, stop ranking)

**Framework**: Jest + ts-jest (already in `package.json`)

**Example Test Cases**:
```typescript
// backend/src/services/routePlanningService.test.ts
describe('RoutePlanningService', () => {
  it('should route to SampleItineraryService when SAMPLE_DATA_MODE=true', () => {
    // Mock config.sampleDataMode = true
    // Verify sampleItineraryService.planRoute called
  });
  
  it('should calculate drive time proportionally to distance', () => {
    // Test time calculation logic
  });
  
  it('should aggregate costs correctly', () => {
    // Test cost calculation: motel + meals + activities + gas
  });
});
```

### Integration Testing Strategy

**Target**: API endpoints with test database

**Setup**:
- Test database (separate Neon instance or SQLite for tests)
- Mock external APIs (Gemini, OSRM, Nominatim)
- Test full request/response cycle

**Example Test Cases**:
```typescript
// backend/src/routes/routePlanning.test.ts
describe('POST /route/plan', () => {
  it('should return route plan for valid request', async () => {
    // Mock authentication
    // Send POST request
    // Verify response structure
  });
  
  it('should return 400 for missing origin', async () => {
    // Test validation
  });
});
```

### E2E Testing Strategy

**Target**: Full user flow

**Flow**:
1. Register user
2. Login
3. Plan route (LA → SF)
4. Select stops
5. Finalize itinerary
6. Export calendar
7. View saved trip

**Framework**: Playwright or Cypress (for browser automation)

### Sample Data Mode Testing

**Advantage**: Deterministic output enables reliable tests

**Test Strategy**:
```typescript
describe('SampleItineraryService', () => {
  it('should return identical output for same input', () => {
    const request1 = await service.planRoute(LA_SF_REQUEST);
    const request2 = await service.planRoute(LA_SF_REQUEST);
    expect(request1).toEqual(request2); // Deterministic
  });
  
  it('should only support LA → SF route', () => {
    // Verify other routes throw error
  });
});
```

### External API Mocking

**Strategy**: Mock external APIs in tests to avoid:
- API rate limits
- Network dependencies
- Costs

**Mock Libraries**: 
- `nock` for HTTP mocking
- `jest.mock` for service mocking

---

## Deployment Strategies

### Current Deployment

**Production**: Vercel (automatic deployment from Git)

**Process**:
1. Push to GitHub repository
2. Vercel automatically builds and deploys
3. Environment variables configured in Vercel dashboard

**Local Development**: Express backend on `localhost:3001`, React frontend on `localhost:3000`

### Deployment Environments

**Development**:
- Backend: `localhost:3001` (Express)
- Frontend: `localhost:3000` (React dev server)
- Database: Neon PostgreSQL (dev instance)
- Mode: `SAMPLE_DATA_MODE=true` (for testing)

**Production**:
- Frontend: Vercel (custom domain or vercel.app)
- Backend: Vercel serverless functions (same domain, `/api/*` routes)
- Database: Neon PostgreSQL (production instance)
- Mode: `SAMPLE_DATA_MODE=false` (live APIs)

**Staging** (Not Currently Implemented):
- Separate Vercel project
- Separate Neon database instance
- `SAMPLE_DATA_MODE=false` with test API keys

### Environment Variables

**Required Variables**:
```bash
# Dual-Mode
SAMPLE_DATA_MODE=false

# API Keys
GEMINI_API_KEY=your_key_here

# Database
DATABASE_URL=postgresql://user:pass@host/db

# Authentication
JWT_SECRET=your_secret_here

# Server
PORT=3001
NODE_ENV=production
```

**Vercel Configuration**: Set in Vercel dashboard → Project Settings → Environment Variables

### CI/CD (Future)

**Potential Setup**:
- GitHub Actions for automated testing before deployment
- Automated tests on PR creation
- Deployment to staging on merge to `develop` branch
- Deployment to production on merge to `main` branch

---

## Scalability Analysis

### What Scales Well

1. **Stateless Services**
   - Vercel serverless functions are stateless
   - Can scale horizontally automatically
   - No session state to manage

2. **Database Read Operations**
   - Read-only queries can use read replicas (future)
   - Can cache frequently accessed routes
   - Trip listing queries can be paginated

3. **External API Calls**
   - Can be cached (Redis) to reduce API calls
   - Can batch multiple API calls
   - Can use rate limiting to prevent abuse

4. **Frontend Assets**
   - CDN caching via Vercel
   - Static assets cached at edge
   - Code splitting for smaller bundles

### What Doesn't Scale Well (Current Limitations)

1. **Synchronous External API Calls**
   - Gemini AI calls can take 10-45 seconds
   - Blocks request/response cycle
   - Timeout issues on Vercel (10-second default, 60-second max)

2. **Database Connection Pooling**
   - Neon free tier has connection limits
   - Need connection pooling (`pg-pool`) for concurrent requests

3. **Sample Mode Route Support**
   - Only LA→SF route supported
   - Cannot scale to support more routes without code changes

4. **Memory/CPU Limits (Vercel Free Tier)**
   - Limited compute resources
   - Large responses may fail
   - Need optimization for response sizes

### Scalability Mitigations

#### Short-Term (1-3 months)

1. **Caching**
   - Redis for route responses (cache common routes)
   - Redis for geocoding results (cache addresses)
   - Cache TTL: 24 hours for routes, 7 days for geocoding

2. **Rate Limiting**
   - Per-user rate limiting (e.g., 10 route plans per hour)
   - Per-IP rate limiting (e.g., 100 requests per hour)
   - Vercel Edge Functions for rate limiting

3. **Connection Pooling**
   - Use `pg-pool` for Neon PostgreSQL
   - Pool size: 5-10 connections
   - Connection timeout: 30 seconds

#### Medium-Term (3-6 months)

4. **Async Processing**
   - Bull/BullMQ for long-running tasks
   - Queue route generation jobs
   - WebSocket/SSE for real-time updates to client

5. **Database Indexing**
   - Index on `users.email` (unique constraint)
   - Index on `trips.user_id` (for user trip queries)
   - Index on `trips.created_at` (for sorting)

6. **CDN & Edge Caching**
   - Cache static API responses at edge
   - Cache common routes (LA→SF, NY→DC) at edge
   - Reduce latency for frequent requests

#### Long-Term (6-12 months)

7. **Horizontal Scaling**
   - Multiple Vercel deployments (can scale automatically)
   - Database read replicas for heavy read workloads
   - Load balancing (if needed, Vercel handles this)

8. **Event-Driven Architecture**
   - Kafka or BullMQ for async processing
   - Decouple route generation from request/response
   - Background workers for heavy operations

9. **Microservices** (If Needed)
   - Separate service for route generation
   - Separate service for user management
   - Separate service for analytics

### Failure Points & Mitigations

1. **Gemini API Rate Limits** (Most Likely)
   - **Mitigation**: Fallback to OpenStreetMap APIs, exponential backoff retry, caching

2. **Database Connection Pool Exhaustion**
   - **Mitigation**: Connection pooling, connection limits, connection timeout

3. **Vercel Function Timeout** (45 seconds for Pro, 10 seconds for Free)
   - **Mitigation**: Async processing, WebSocket for updates, optimize API calls

4. **OSRM/Nominatim Downtime**
   - **Mitigation**: Fallback to calculated distance, cached geocoding, multiple OSRM instances

5. **Memory/CPU Limits** (Vercel Free Tier)
   - **Mitigation**: Optimize response sizes, pagination, reduce external API response sizes

---

## Future Features & Roadmap

### Short-Term (1-3 months)

1. **More Sample Routes**
   - New York → Washington DC (225 miles)
   - Chicago → Nashville (470 miles)
   - Miami → Orlando (235 miles)

2. **Enhanced Caching**
   - Redis integration for route responses
   - Geocoding cache (address → coordinates)
   - Route cache (origin+destination → route summary)

3. **Rate Limiting**
   - Per-user rate limits
   - Per-IP rate limits
   - Rate limit headers in responses

4. **Improved Error Handling**
   - User-friendly error messages
   - Retry UI in frontend
   - Error logging and monitoring (Sentry, LogRocket)

### Medium-Term (3-6 months)

5. **Offline Maps**
   - Leaflet tile caching
   - Route polyline storage
   - Offline POI data storage
   - Download instructions for offline maps

6. **Mobile App**
   - React Native application
   - Offline-first architecture
   - Push notifications for trip reminders

7. **Analytics Dashboard**
   - Popular routes tracking
   - User behavior analytics
   - Route success/failure rates
   - Cost estimation accuracy tracking

8. **Social Features**
   - Trip sharing (public/private links)
   - Collaborative planning (multiple users edit same trip)
   - Trip reviews and ratings

### Long-Term (6-12 months)

9. **Machine Learning**
   - Personalized recommendations based on user history
   - Trip pattern recognition
   - Predictive pricing (gas, hotels)
   - Route optimization based on user preferences

10. **Multi-Modal Transportation**
    - Flights integration (booking flights, not just driving)
    - Public transport options
    - Rideshare integration (Uber, Lyft)

11. **Enterprise Features**
    - Team trip planning (company travel)
    - Business travel management
    - Expense tracking and reporting
    - Integration with expense management tools

12. **Advanced AI Features**
    - Natural language route input ("plan a route from LA to SF with beach stops")
    - Smart scheduling (optimize stop order for time efficiency)
    - Weather-aware recommendations
    - Traffic-aware routing

---

## Business Logic & Constraints

### Route Planning Constraints

1. **Drive Time Calculation**
   - Based on OSRM actual routes (not straight-line distance)
   - Accounts for highways, roads, traffic (if available)
   - Fallback to calculated estimate if OSRM unavailable

2. **Stop Distribution**
   - Stops distributed along route (not clustered at start/end)
   - Early route stops: ~25% of distance
   - Mid-route stops: ~50% of distance
   - Late route stops: ~75% of distance

3. **Budget Filtering**
   - Motels filtered by per-night budget
   - Restaurants filtered by per-person meal budget
   - Labels: "Within budget", "Slightly above budget", "Budget unknown"

4. **Detour Time Limits**
   - Maximum 30 minutes off-route for stops
   - Prioritizes stops with minimal detour (0-10 minutes)

5. **Rating & Review Requirements**
   - Prioritizes stops with ratings ≥ 4.0
   - Requires minimum review count (e.g., 50+ reviews) for "verified" status

### Time Calculation Logic

**Drive Time Between Stops**:
```typescript
// Proportional to distance ratio
driveTime = (distanceBetweenStops / totalDistance) * totalDriveTime
```

**Arrival Time at Stop**:
```typescript
// Cumulative from departure
arrivalTime = departureTime + cumulativeDriveTime + cumulativeStopTime
```

**Total Trip Duration**:
```typescript
totalDuration = sum(driveTimes) + sum(stopTimes)
```

### Cost Aggregation Logic

```typescript
totalCost = (
  motelCost * nights +                          // Accommodation
  mealCost * travelers * mealCount +             // Meals
  activityCost * travelers +                     // Activities
  gasCost (distance * $0.15/mile)               // Gas (estimated)
)
```

**Breakdown**:
- Motels: Price per night × number of nights
- Meals: Price per person × travelers × number of meals
- Activities: Price per person × travelers (if paid activity)
- Gas: $0.15 per mile (estimated based on distance)

---

## API Specifications

### Authentication Endpoints

**POST `/api/auth/register`**
- **Request**: `{ email, password }`
- **Response**: `{ success: true, data: { token, user } }`
- **Error**: `{ success: false, error: "Email already exists" }`

**POST `/api/auth/login`**
- **Request**: `{ email, password }`
- **Response**: `{ success: true, data: { token, user } }`
- **Error**: `{ success: false, error: "Invalid credentials" }`

**POST `/api/auth/demo`**
- **Request**: None (or empty body)
- **Response**: `{ success: true, data: { token, user } }` (demo user)
- **Purpose**: Quick access without registration

### Route Planning Endpoints

**POST `/api/route/plan`**
- **Request**: 
  ```json
  {
    "origin": "Los Angeles",
    "destination": "San Francisco",
    "departureDate": "2025-01-20",
    "departureTime": "08:00",
    "travelers": 2,
    "budget": {
      "motelPerNight": 80,
      "mealBudget": 15
    }
  }
  ```
- **Response**: `RouteResponse` with route summary, stop options, mode indicator

**POST `/api/route/finalize`**
- **Request**: 
  ```json
  {
    "routeRequest": { ... },
    "selections": {
      "selectedPois": ["poi-1", "poi-2"],
      "selectedRestaurants": ["rest-1"],
      "selectedMotel": "motel-1"
    }
  }
  ```
- **Response**: `FinalItinerary` with calendar events, costs, timing

**POST `/api/route/export-calendar`**
- **Request**: `{ events: CalendarEvent[], tripTitle }`
- **Response**: `{ icsContent: string, filename: string }`

### Trip Management Endpoints

**GET `/api/trips`** - List user's trips
**POST `/api/trips`** - Create trip
**GET `/api/trips/:id`** - Get trip details
**PUT `/api/trips/:id`** - Update trip
**DELETE `/api/trips/:id`** - Delete trip

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### Trips Table

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  origin VARCHAR(255),
  destination VARCHAR(255),
  route_data JSONB,        -- Full RouteResponse object
  itinerary JSONB,         -- FinalItinerary object
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);
```

**Note**: `route_data` and `itinerary` stored as JSONB for flexibility, but could be normalized into separate tables for better query performance.

---

## Error Handling & Reliability

### Error Types

1. **Input Errors** (400 Bad Request)
   - Missing required fields
   - Invalid date format
   - Invalid traveler count (< 1)

2. **Authentication Errors** (401 Unauthorized)
   - Missing or invalid JWT token
   - Expired token

3. **Route Errors** (404 Not Found)
   - Route not supported in Sample Mode
   - Geocoding failure (invalid address)

4. **API Errors** (502 Bad Gateway, 503 Service Unavailable)
   - External API timeout (Gemini, OSRM)
   - Rate limiting (429 Too Many Requests)
   - Service unavailability

5. **Server Errors** (500 Internal Server Error)
   - Unexpected exceptions
   - Database errors

### Retry Logic

**Implementation**: Exponential backoff with jitter

```typescript
retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  for (attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (isRetryable(error) && attempt < maxRetries - 1) {
        const delay = initialDelay * 2^attempt + jitter;
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
}
```

**Retryable Errors**: 429 (rate limit), 500 (server error), 503 (service unavailable), network timeouts

**Non-Retryable Errors**: 400 (bad request), 401 (unauthorized), 404 (not found)

### Fallback Strategy

1. **Primary**: Gemini AI for route generation
2. **Fallback 1**: OpenStreetMap APIs (Overpass + Nominatim)
3. **Fallback 2**: Sample Data Mode (if supported route)
4. **Fallback 3**: Generic error message with retry suggestion

---

## Security Considerations

### Authentication

- **JWT Tokens**: Signed with secret, 24-hour expiration
- **Password Hashing**: bcrypt with salt rounds (10)
- **Token Storage**: HTTP-only cookies (preferred) or localStorage (current implementation)

### Authorization

- **Route Protection**: Middleware checks JWT token on protected routes
- **User Isolation**: Users can only access their own trips (user_id check)

### Data Validation

- **Input Validation**: Express validator or manual checks
- **SQL Injection**: Parameterized queries (Neon client handles this)
- **XSS Prevention**: React escapes by default, sanitize user inputs

### API Security

- **CORS**: Configured for specific origins (Vercel, localhost)
- **Rate Limiting**: Should be implemented (future)
- **HTTPS**: Enforced by Vercel (automatic SSL)

### Environment Variables

- **Secrets**: Never committed to Git (use `.env`, `.env.example`)
- **API Keys**: Stored in environment variables, not in code
- **Database URLs**: Include credentials, keep secure

---

## Additional Context

### Code Quality

- **TypeScript**: Full type safety across frontend and backend
- **ESLint**: Code linting (configured in backend)
- **Prettier**: Code formatting (should be added)
- **Comments**: Minimal, only where necessary for complex logic

### Performance Optimizations

- **Frontend**: Code splitting, lazy loading, memoization
- **Backend**: Response caching, connection pooling, batch API calls
- **Database**: Indexing, query optimization, pagination

### Monitoring & Logging

**Current**: Console logging (`console.log`, `console.error`)

**Future**:
- Structured logging (Winston, Pino)
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- User analytics (Google Analytics, Mixpanel)

---

**End of Project Context Documentation**

This document provides complete context about the TravelM8/DayMate project for LLM training and reference. All information is based on actual implementation and discussions during development.
