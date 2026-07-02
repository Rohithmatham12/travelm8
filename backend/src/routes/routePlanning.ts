import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../utils/auth';
import { RoutePlanningService } from '../services/routePlanningService';
import { RouteRequest, SelectedStops } from '../types/route';
import { getStopInsight } from '../services/aiService';
import {
  successResponse,
  badRequestResponse,
  internalErrorResponse
} from '../utils/response';

export const routePlanningRouter = Router();
const routePlanningService = new RoutePlanningService();

// All routes require authentication
routePlanningRouter.use(authenticateToken);

// Plan a route
routePlanningRouter.post('/plan', async (req: AuthRequest, res) => {
  try {
    const request: RouteRequest = req.body;

    const validationError = validateRouteRequest(request);
    if (validationError) {
      return badRequestResponse(res, validationError);
    }

    const routePlan = await routePlanningService.planRoute(request);
    return successResponse(res, routePlan, 'Route planned successfully');
  } catch (error) {
    console.error('Error planning route:', error);
    return internalErrorResponse(res, 'Failed to plan route');
  }
});

// Generate final itinerary after user selections
routePlanningRouter.post('/finalize', async (req: AuthRequest, res) => {
  try {
    const { routeRequest, selections } = req.body as {
      routeRequest: RouteRequest;
      selections: SelectedStops;
    };

    if (!routeRequest || !selections) {
      return badRequestResponse(res, 'Route request and selections are required');
    }

    const validationError = validateRouteRequest(routeRequest);
    if (validationError) {
      return badRequestResponse(res, validationError);
    }

    if (!isValidTime(selections.departureTime)) {
      return badRequestResponse(res, 'Departure time must use HH:mm format');
    }

    // Relaxed validation: allow finalizing with restaurants or motels even without POIs
    if (!selections.selectedPois || selections.selectedPois.length === 0) {
      if ((!selections.selectedRestaurants || selections.selectedRestaurants.length === 0) &&
          !selections.selectedMotel) {
        return badRequestResponse(res, 'Please select at least one stop (POI, restaurant, or motel)');
      }
    }

    const itinerary = await routePlanningService.generateFinalItinerary(routeRequest, selections);
    return successResponse(res, itinerary, 'Itinerary generated successfully');
  } catch (error) {
    console.error('Error generating itinerary:', error);
    return internalErrorResponse(res, 'Failed to generate itinerary');
  }
});

// AI insight for a specific stop (lazy-fetched by frontend on stop select)
routePlanningRouter.post('/stop-insight', async (req: AuthRequest, res) => {
  try {
    const { stopName, stopCategory, origin, destination } = req.body;
    if (!stopName || !stopCategory) {
      return badRequestResponse(res, 'stopName and stopCategory are required');
    }
    const routeContext = origin && destination ? `${origin} → ${destination}` : 'a road trip';
    const insight = await getStopInsight(stopName, stopCategory, routeContext);
    return successResponse(res, insight);
  } catch (error) {
    console.error('Error fetching stop insight:', error);
    return internalErrorResponse(res, 'Failed to fetch stop insight');
  }
});

// Export calendar events (ICS format)
routePlanningRouter.post('/export-calendar', async (req: AuthRequest, res) => {
  try {
    const { events, tripTitle } = req.body;

    if (!events || events.length === 0) {
      return badRequestResponse(res, 'No events to export');
    }

    // Generate ICS content
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TravelM8//DayMate//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${tripTitle || 'Road Trip'}
`;

    for (const event of events) {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      
      icsContent += `BEGIN:VEVENT
UID:${event.id}@travelm8
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
END:VEVENT
`;
    }

    icsContent += 'END:VCALENDAR';

    return successResponse(res, {
      icsContent,
      filename: `${tripTitle || 'road-trip'}.ics`
    }, 'Calendar export ready');
  } catch (error) {
    console.error('Error exporting calendar:', error);
    return internalErrorResponse(res, 'Failed to export calendar');
  }
});

function formatDateForICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function validateRouteRequest(request: RouteRequest): string | null {
  if (!request.origin || !request.destination) {
    return 'Origin and destination are required';
  }

  if (!request.departureDate || !isValidDate(request.departureDate)) {
    return 'Departure date must use YYYY-MM-DD format';
  }

  if (request.departureTime && !isValidTime(request.departureTime)) {
    return 'Departure time must use HH:mm format';
  }

  if (!Number.isFinite(request.travelers) || request.travelers < 1 || request.travelers > 20) {
    return 'Number of travelers must be between 1 and 20';
  }

  if (request.budget?.mealBudget !== undefined && !isFiniteNonNegative(request.budget.mealBudget)) {
    return 'Meal budget must be a valid non-negative number';
  }

  if (request.budget?.motelPerNight !== undefined && !isFiniteNonNegative(request.budget.motelPerNight)) {
    return 'Motel budget must be a valid non-negative number';
  }

  return null;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime());
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}
