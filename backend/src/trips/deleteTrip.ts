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
    console.log('Delete Trip Event:', JSON.stringify(event, null, 2));

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

    // Check if trip exists before deleting
    const existingTrip = await tripService.getTrip(userId, tripId);
    if (!existingTrip) {
      return notFoundResponse('Trip not found');
    }

    // Delete the trip
    await tripService.deleteTrip(userId, tripId);

    return successResponse({ tripId }, 'Trip deleted successfully');
  } catch (error) {
    console.error('Error deleting trip:', error);
    return internalErrorResponse('Failed to delete trip');
  }
};
