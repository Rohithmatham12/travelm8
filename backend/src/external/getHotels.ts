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
    console.log('Get Hotels Event:', JSON.stringify(event, null, 2));

    // Extract user ID from JWT token
    const userId = extractUserId(event);
    if (!userId) {
      return unauthorizedResponse('User not authenticated');
    }

    // Extract parameters from query string
    const destination = event.queryStringParameters?.destination;
    const checkIn = event.queryStringParameters?.checkIn;
    const checkOut = event.queryStringParameters?.checkOut;
    const guests = event.queryStringParameters?.guests;

    if (!destination || !checkIn || !checkOut || !guests) {
      return badRequestResponse('Destination, checkIn, checkOut, and guests parameters are required');
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return badRequestResponse('Invalid date format. Use YYYY-MM-DD');
    }

    if (checkInDate >= checkOutDate) {
      return badRequestResponse('Check-out date must be after check-in date');
    }

    // Validate guests count
    const guestCount = parseInt(guests, 10);
    if (isNaN(guestCount) || guestCount < 1 || guestCount > 10) {
      return badRequestResponse('Guests must be a number between 1 and 10');
    }

    // Get hotel information
    const hotels = await externalApiService.getHotelInfo(destination, checkIn, checkOut, guestCount);
    
    return successResponse({ hotels }, 'Hotel information retrieved successfully');
  } catch (error) {
    console.error('Error getting hotels:', error);
    return internalErrorResponse('Failed to get hotel information');
  }
};
