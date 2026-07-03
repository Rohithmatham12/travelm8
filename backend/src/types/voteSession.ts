export interface VoteStop {
  id: string;
  name: string;
  votes: number;
}

export interface VoteSession {
  code: string;
  stops: VoteStop[];
  voters: string[];
  createdAt: string;
  expiresAt: string;
}

export interface CreateVoteSessionRequest {
  stops: { id: string; name: string }[];
}

export interface CastVoteRequest {
  voterName: string;
  stopId: string;
}
