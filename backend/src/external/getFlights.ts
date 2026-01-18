import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ExternalApiService } from '../services/externalApiService';
import { 
  successResponse, 
  badRequestResponse, 
  unauthorizedResponse, 
  internalErrorResponse,
  extractUserId 
} from '../utils/response';

const externalApiService = new ExternalApiService();

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    console.log('Get Flights Event:', JSON.stringify(event, null, 2));

    // Extract user ID from JWT token
    const userId = extractUserId(event);
    if (!userId) {
      return unauthorizedResponse('User not authenticated');
    }

    // Extract parameters from query string
    const origin = event.queryStringParameters?.origin;
    const destination = event.queryStringParameters?.destination;
    const date = event.queryStringParameters?.date;

    if (!origin || !destination || !date) {
      return badRequestResponse('Origin, destination, and date parameters are required');
    }

    // Validate date format
    const travelDate = new Date(date);
    if (isNaN(travelDate.getTime())) {
      return badRequestResponse('Invalid date format. Use YYYY-MM-DD');
    }

    // Get flight information
    const flights = await externalApiService.getFlightInfo(origin, destination, date);
    
    return successResponse({ flights }, 'Flight information retrieved successfully');
  } catch (error) {
    console.error('Error getting flights:', error);
    return internalErrorResponse('Failed to get flight information');
  }
};
