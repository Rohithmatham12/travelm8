import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../utils/auth';
import { RoutePlanningService } from '../services/routePlanningService';
import { RouteRequest, SelectedStops } from '../types/route';
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

    // Validate required fields
    if (!request.origin || !request.destination) {
      return badRequestResponse(res, 'Origin and destination are required');
    }

    if (!request.departureDate) {
      return badRequestResponse(res, 'Departure date is required');
    }

    if (!request.travelers || request.travelers < 1) {
      return badRequestResponse(res, 'Number of travelers must be at least 1');
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
