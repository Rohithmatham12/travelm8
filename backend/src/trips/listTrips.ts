import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { TripService } from '../services/tripService';
import { 
  successResponse, 
  unauthorizedResponse, 
  internalErrorResponse,
  extractUserId 
} from '../utils/response';

const tripService = new TripService();

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    console.log('List Trips Event:', JSON.stringify(event, null, 2));

    // Extract user ID from JWT token
    const userId = extractUserId(event);
    if (!userId) {
      return unauthorizedResponse('User not authenticated');
    }

    // Extract query parameters
    const limit = event.queryStringParameters?.limit 
      ? parseInt(event.queryStringParameters.limit, 10) 
      : 20;
    
    const nextToken = event.queryStringParameters?.nextToken;
    const status = event.queryStringParameters?.status;

    // Validate limit
    if (limit < 1 || limit > 100) {
      return successResponse({ trips: [], message: 'Limit must be between 1 and 100' });
    }

    let result;
    if (status) {
      // List trips by status
      result = await tripService.listTripsByStatus(status, limit, nextToken);
    } else {
      // List user's trips
      result = await tripService.listUserTrips(userId, limit, nextToken);
    }

    return successResponse(result);
  } catch (error) {
    console.error('Error listing trips:', error);
    return internalErrorResponse('Failed to list trips');
  }
};





