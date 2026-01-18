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
    console.log('Get Travel Info Event:', JSON.stringify(event, null, 2));

    // Extract user ID from JWT token
    const userId = extractUserId(event);
    if (!userId) {
      return unauthorizedResponse('User not authenticated');
    }

    // Extract destination from query parameters
    const destination = event.queryStringParameters?.destination;
    if (!destination) {
      return badRequestResponse('Destination parameter is required');
    }

    // Get travel information
    const travelInfo = await externalApiService.getTravelInfo(destination);
    
    return successResponse(travelInfo, 'Travel information retrieved successfully');
  } catch (error) {
    console.error('Error getting travel info:', error);
    return internalErrorResponse('Failed to get travel information');
  }
};
