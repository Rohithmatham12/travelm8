import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { TripService } from '../services/tripService';
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
    console.log('Get Trip Event:', JSON.stringify(event, null, 2));

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

    // Get the trip
    const trip = await tripService.getTrip(userId, tripId);
    
    if (!trip) {
      return notFoundResponse('Trip not found');
    }

    return successResponse(trip);
  } catch (error) {
    console.error('Error getting trip:', error);
    return internalErrorResponse('Failed to get trip');
  }
};
