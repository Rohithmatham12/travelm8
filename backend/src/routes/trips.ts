import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../utils/auth';
import { TripService } from '../services/tripService';
import { FeedbackService } from '../services/feedbackService';
import { CreateTripRequest, UpdateTripRequest } from '../types/trip';
import { SaveFeedbackRequest } from '../types/feedback';
import {
  successResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse
} from '../utils/response';

export const tripsRouter = Router();
const tripService = new TripService();
const feedbackService = new FeedbackService();

// All routes require authentication
tripsRouter.use(authenticateToken);

// List trips
tripsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 20;
    const nextToken = req.query.nextToken as string | undefined;

    const result = await tripService.listUserTrips(userId, limit, nextToken);
    successResponse(res, result);
  } catch (error) {
    console.error('Error listing trips:', error);
    internalErrorResponse(res, 'Failed to list trips');
  }
});

// Update trip notes
tripsRouter.patch('/:tripId/notes', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;
    const { notes } = req.body;
    if (typeof notes !== 'string') return badRequestResponse(res, 'notes must be a string');
    const trip = await tripService.updateNotes(userId, tripId, notes);
    if (!trip) return notFoundResponse(res, 'Trip not found');
    return successResponse(res, trip);
  } catch (error) {
    console.error('Error updating trip notes:', error);
    return internalErrorResponse(res, 'Failed to update notes');
  }
});

// Get trip by ID
tripsRouter.get('/:tripId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;

    const trip = await tripService.getTrip(userId, tripId);
    if (!trip) {
      return notFoundResponse(res, 'Trip not found');
    }

    successResponse(res, trip);
  } catch (error) {
    console.error('Error getting trip:', error);
    internalErrorResponse(res, 'Failed to get trip');
  }
});

// Save a full route plan as a trip (one-click save from RoutePlanner)
tripsRouter.post('/save-route', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { routeRequest, routePlan, finalItinerary } = req.body;

    if (!routeRequest?.origin || !routeRequest?.destination) {
      return badRequestResponse(res, 'routeRequest with origin and destination required');
    }

    const title = `${routeRequest.origin} → ${routeRequest.destination}`;
    const startDate = routeRequest.departureDate || new Date().toISOString().split('T')[0];

    const trip = await tripService.createTrip(userId, {
      title,
      destination: routeRequest.destination,
      startDate,
      endDate: startDate,
      travelers: routeRequest.travelers || 1,
      preferences: {},
      routeData: { routeRequest, routePlan, finalItinerary },
    });

    return createdResponse(res, trip, 'Trip saved');
  } catch (error) {
    console.error('Error saving route trip:', error);
    return internalErrorResponse(res, 'Failed to save trip');
  }
});

// Create trip
tripsRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const request: CreateTripRequest = req.body;

    // Validate required fields
    const requiredFields = ['title', 'destination', 'startDate', 'endDate', 'travelers'];
    const missingFields = requiredFields.filter(field => !request[field as keyof CreateTripRequest]);

    if (missingFields.length > 0) {
      return badRequestResponse(res, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate dates
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return badRequestResponse(res, 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
    }

    if (startDate > endDate) {
      return badRequestResponse(res, 'End date must be the same as or after start date');
    }

    // Validate travelers count
    if (request.travelers < 1 || request.travelers > 20) {
      return badRequestResponse(res, 'Number of travelers must be between 1 and 20');
    }

    const trip = await tripService.createTrip(userId, request);
    createdResponse(res, trip, 'Trip created successfully');
  } catch (error) {
    console.error('Error creating trip:', error);
    internalErrorResponse(res, 'Failed to create trip');
  }
});

// Update trip
tripsRouter.put('/:tripId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;
    const updates: UpdateTripRequest = req.body;

    // Validate dates if provided
    if (updates.startDate && updates.endDate) {
      const startDate = new Date(updates.startDate);
      const endDate = new Date(updates.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return badRequestResponse(res, 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
      }

      if (startDate > endDate) {
        return badRequestResponse(res, 'End date must be the same as or after start date');
      }
    }

    const trip = await tripService.updateTrip(userId, tripId, updates);
    if (!trip) {
      return notFoundResponse(res, 'Trip not found');
    }

    successResponse(res, trip, 'Trip updated successfully');
  } catch (error) {
    console.error('Error updating trip:', error);
    internalErrorResponse(res, 'Failed to update trip');
  }
});

// Delete trip
tripsRouter.delete('/:tripId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;

    await tripService.deleteTrip(userId, tripId);
    successResponse(res, { tripId }, 'Trip deleted successfully');
  } catch (error) {
    console.error('Error deleting trip:', error);
    internalErrorResponse(res, 'Failed to delete trip');
  }
});

// Add itinerary item
tripsRouter.post('/:tripId/itinerary', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;
    const item = req.body;

    const trip = await tripService.addItineraryItem(userId, tripId, item);
    if (!trip) {
      return notFoundResponse(res, 'Trip not found');
    }

    successResponse(res, trip, 'Itinerary item added successfully');
  } catch (error) {
    console.error('Error adding itinerary item:', error);
    internalErrorResponse(res, 'Failed to add itinerary item');
  }
});

// Update itinerary item
tripsRouter.put('/:tripId/itinerary/:itemId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId, itemId } = req.params;
    const updates = req.body;

    const trip = await tripService.updateItineraryItem(userId, tripId, itemId, updates);
    if (!trip) {
      return notFoundResponse(res, 'Trip or itinerary item not found');
    }

    successResponse(res, trip, 'Itinerary item updated successfully');
  } catch (error) {
    console.error('Error updating itinerary item:', error);
    internalErrorResponse(res, 'Failed to update itinerary item');
  }
});

// Save post-trip feedback (upsert — one per trip)
tripsRouter.post('/:tripId/feedback', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;
    const { rating, whatWorked, whatDidnt, overallNote } = req.body as SaveFeedbackRequest;

    if (!rating || rating < 1 || rating > 5) return badRequestResponse(res, 'rating must be 1–5');

    const feedback = await feedbackService.saveFeedback(userId, tripId, {
      rating,
      whatWorked: whatWorked || '',
      whatDidnt: whatDidnt || '',
      overallNote: overallNote || '',
    });
    return successResponse(res, feedback, 'Feedback saved');
  } catch (error) {
    console.error('Error saving feedback:', error);
    return internalErrorResponse(res, 'Failed to save feedback');
  }
});

// Get post-trip feedback
tripsRouter.get('/:tripId/feedback', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;
    const feedback = await feedbackService.getFeedback(userId, tripId);
    return successResponse(res, feedback);
  } catch (error) {
    console.error('Error getting feedback:', error);
    return internalErrorResponse(res, 'Failed to get feedback');
  }
});

// Remove itinerary item
tripsRouter.delete('/:tripId/itinerary/:itemId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId, itemId } = req.params;

    const trip = await tripService.removeItineraryItem(userId, tripId, itemId);
    if (!trip) {
      return notFoundResponse(res, 'Trip or itinerary item not found');
    }

    successResponse(res, trip, 'Itinerary item removed successfully');
  } catch (error) {
    console.error('Error removing itinerary item:', error);
    internalErrorResponse(res, 'Failed to remove itinerary item');
  }
});
