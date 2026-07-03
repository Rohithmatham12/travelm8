import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../utils/auth';
import { VoteSessionService } from '../services/voteSessionService';
import {
  successResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse,
} from '../utils/response';

export const voteSessionRouter = Router();
const service = new VoteSessionService();

// Create session — requires auth (trip owner)
voteSessionRouter.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { stops } = req.body;
    if (!Array.isArray(stops) || stops.length === 0) {
      return badRequestResponse(res, 'stops array required');
    }
    const session = await service.createSession({ stops });
    return createdResponse(res, session, 'Vote session created');
  } catch (error) {
    console.error('Error creating vote session:', error);
    return internalErrorResponse(res, 'Failed to create vote session');
  }
});

// Get session by code — public (code is the access token)
voteSessionRouter.get('/:code', async (req: Request, res: Response) => {
  try {
    const code = req.params.code.toUpperCase();
    const session = await service.getSession(code);
    if (!session) return notFoundResponse(res, 'Session not found or expired');
    return successResponse(res, session);
  } catch (error) {
    console.error('Error getting vote session:', error);
    return internalErrorResponse(res, 'Failed to get vote session');
  }
});

// Cast vote — public
voteSessionRouter.post('/:code/vote', async (req: Request, res: Response) => {
  try {
    const code = req.params.code.toUpperCase();
    const { voterName, stopId } = req.body;
    if (!voterName?.trim()) return badRequestResponse(res, 'voterName required');
    if (!stopId) return badRequestResponse(res, 'stopId required');

    const session = await service.castVote(code, { voterName, stopId });
    return successResponse(res, session, 'Vote cast');
  } catch (error: any) {
    if (error.message === 'Already voted') return badRequestResponse(res, 'Already voted in this session');
    if (error.message === 'Session not found or expired') return notFoundResponse(res, error.message);
    console.error('Error casting vote:', error);
    return internalErrorResponse(res, 'Failed to cast vote');
  }
});
