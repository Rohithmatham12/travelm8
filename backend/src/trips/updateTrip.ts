import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { TripService } from '../services/tripService';
import { UpdateTripRequest } from '../types/trip';
import { 
  successResponse, 
  badRequestResponse, 
  unauthorizedResponse, 
  notFoundResponse,
  internalErrorResponse,
  extractUserId 
} from '../utils/response';

const tripService = new TripService();

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    console.log('Update Trip Event:', JSON.stringify(event, null, 2));

    // Extract user ID from JWT token
    const userId = extractUserId(event);
    if (!userId) {
      return unauthorizedResponse('User not authenticated');
    }

    // Extract trip ID from path parameters
    const tripId = event.pathParameters?.tripId;
    if (!tripId) {
      return badRequestResponse('Trip ID is required');
    }

    // Parse request body
    if (!event.body) {
      return badRequestResponse('Request body is required');
    }

    let updates: UpdateTripRequest;
    try {
      updates = JSON.parse(event.body);
    } catch (error) {
      return badRequestResponse('Invalid JSON in request body');
    }

    // Validate dates if provided
    if (updates.startDate || updates.endDate) {
      const startDate = updates.startDate ? new Date(updates.startDate) : null;
      const endDate = updates.endDate ? new Date(updates.endDate) : null;
      
      if (startDate && isNaN(startDate.getTime())) {
        return badRequestResponse('Invalid start date format. Use ISO 8601 format (YYYY-MM-DD)');
      }
      
      if (endDate && isNaN(endDate.getTime())) {
        return badRequestResponse('Invalid end date format. Use ISO 8601 format (YYYY-MM-DD)');
      }

      if (startDate && endDate && startDate >= endDate) {
        return badRequestResponse('End date must be after start date');
      }
    }

    // Validate travelers count if provided
    if (updates.travelers !== undefined && (updates.travelers < 1 || updates.travelers > 20)) {
      return badRequestResponse('Number of travelers must be between 1 and 20');
    }

    // Update the trip
    const updatedTrip = await tripService.updateTrip(userId, tripId, updates);
    
    if (!updatedTrip) {
      return notFoundResponse('Trip not found');
    }

    return successResponse(updatedTrip, 'Trip updated successfully');
  } catch (error) {
    console.error('Error updating trip:', error);
    return internalErrorResponse('Failed to update trip');
  }
};





