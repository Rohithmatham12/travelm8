import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../utils/auth';
import { getAnalytics } from '../services/analyticsService';
import { successResponse, internalErrorResponse } from '../utils/response';

export const analyticsRouter = Router();

analyticsRouter.get('/', authenticateToken, async (_req: AuthRequest, res) => {
  try {
    const data = await getAnalytics();
    return successResponse(res, data);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return internalErrorResponse(res, 'Failed to fetch analytics');
  }
});
