import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../utils/auth';
import { RecommendationService } from '../services/recommendationService';
import { RecommendationRequest } from '../types/recommendation';
import {
  successResponse,
  badRequestResponse,
  internalErrorResponse
} from '../utils/response';

export const recommendationsRouter = Router();
const recommendationService = new RecommendationService();

// All routes require authentication
recommendationsRouter.use(authenticateToken);

// Generate recommendations
recommendationsRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const request: RecommendationRequest = req.body;

    // Validate required fields
    const requiredFields = ['destination', 'startDate', 'endDate', 'travelers'];
    const missingFields = requiredFields.filter(field => !request[field as keyof RecommendationRequest]);

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

    const recommendations = await recommendationService.generateRecommendations(request);
    successResponse(res, recommendations, 'Recommendations generated successfully');
  } catch (error) {
    console.error('Error generating recommendations:', error);
    internalErrorResponse(res, 'Failed to generate recommendations');
  }
});

