import { Router, Request, Response } from 'express';
import { successResponse } from '../utils/response';
import { askAI } from '../services/aiService';

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

healthRouter.get('/ai', async (req: Request, res: Response) => {
  try {
    const result = await askAI('Reply with exactly: {"ok":true}');
    res.json({ raw: result, parsed: result ? JSON.parse(result.replace(/```json\n?|\n?```/g,'').trim()) : null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

