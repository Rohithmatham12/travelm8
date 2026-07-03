import { VoteSession, CreateVoteSessionRequest, CastVoteRequest } from '../types/voteSession';
import { putItem, getItem } from '../utils/storage';

const TABLE = 'vote_sessions';

function generateCode(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

export class VoteSessionService {
  async createSession(req: CreateVoteSessionRequest): Promise<VoteSession> {
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const session: VoteSession = {
      code: generateCode(),
      stops: req.stops.map(s => ({ id: s.id, name: s.name, votes: 0 })),
      voters: [],
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };

    await putItem(TABLE, session);
    return session;
  }

  async getSession(code: string): Promise<VoteSession | null> {
    const session = await getItem(TABLE, { code }) as VoteSession | null;
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) return null;
    return session;
  }

  async castVote(code: string, req: CastVoteRequest): Promise<VoteSession> {
    const session = await this.getSession(code);
    if (!session) throw new Error('Session not found or expired');

    const name = req.voterName.trim();
    if (session.voters.includes(name)) throw new Error('Already voted');

    const stop = session.stops.find(s => s.id === req.stopId);
    if (!stop) throw new Error('Stop not found in session');

    const updated: VoteSession = {
      ...session,
      stops: session.stops.map(s => s.id === req.stopId ? { ...s, votes: s.votes + 1 } : s),
      voters: [...session.voters, name],
    };

    await putItem(TABLE, updated);
    return updated;
  }
}
