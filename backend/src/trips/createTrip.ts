import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { TripService } from '../services/tripService';
import { CreateTripRequest } from '../types/trip';
import { 
  successResponse, 
  createdResponse, 
  badRequestResponse, 
  unauthorizedResponse, 
  internalErrorResponse,
  extractUserId 
} from '../utils/response';

const tripService = new TripService();

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    console.log('Create Trip Event:', JSON.stringify(event, null, 2));

    // Extract user ID from JWT token
    const userId = extractUserId(event);
    if (!userId) {
      return unauthorizedResponse('User not authenticated');
    }

    // Parse request body
    if (!event.body) {
      return badRequestResponse('Request body is required');
    }

    let request: CreateTripRequest;
    try {
      request = JSON.parse(event.body);
    } catch (error) {
      return badRequestResponse('Invalid JSON in request body');
    }

    // Validate required fields
    const requiredFields = ['title', 'destination', 'startDate', 'endDate', 'travelers'];
    const missingFields = requiredFields.filter(field => !request[field as keyof CreateTripRequest]);
    
    if (missingFields.length > 0) {
      return badRequestResponse(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate dates
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return badRequestResponse('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
    }

    if (startDate >= endDate) {
      return badRequestResponse('End date must be after start date');
    }

    // Validate travelers count
    if (request.travelers < 1 || request.travelers > 20) {
      return badRequestResponse('Number of travelers must be between 1 and 20');
    }

    // Create the trip
    const trip = await tripService.createTrip(userId, request);
    
    return createdResponse(trip, 'Trip created successfully');
  } catch (error) {
    console.error('Error creating trip:', error);
    return internalErrorResponse('Failed to create trip');
  }
};
