import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../utils/auth';
import { TripService } from '../services/tripService';
import { CreateTripRequest, UpdateTripRequest } from '../types/trip';
import {
  successResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse
} from '../utils/response';

export const tripsRouter = Router();
const tripService = new TripService();

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

    if (startDate >= endDate) {
      return badRequestResponse(res, 'End date must be after start date');
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

      if (startDate >= endDate) {
        return badRequestResponse(res, 'End date must be after start date');
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

