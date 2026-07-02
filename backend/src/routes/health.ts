import { Router, Request, Response } from 'express';
import { successResponse } from '../utils/response';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  successResponse(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'TravelM8 API',
    ai: {
      groq: !!process.env.GROQ_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
    }
  });
});
