import { readTable } from '../utils/storage';

export interface AnalyticsResult {
  totalTrips: number;
  avgRating: number | null;
  ratingDistribution: Record<number, number>;
  totalVotesCast: number;
  uniqueRoutes: number;
  topVotedStops: { name: string; votes: number }[];
  popularRoutes: { route: string; count: number }[];
  recentFeedback: { rating: number; overallNote: string; updatedAt: string }[];
}

export async function getAnalytics(): Promise<AnalyticsResult> {
  const [trips, feedbacks, sessions] = await Promise.all([
    readTable('trips'),
    readTable('feedback'),
    readTable('vote_sessions'),
  ]);

  // Trips
  const totalTrips = trips.length;

  const routeCounts: Record<string, number> = {};
  for (const t of trips) {
    const origin = t.routeData?.routeRequest?.origin;
    const dest   = t.routeData?.routeRequest?.destination || t.destination;
    if (origin && dest) {
      const key = `${origin} → ${dest}`;
      routeCounts[key] = (routeCounts[key] || 0) + 1;
    }
  }
  const popularRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([route, count]) => ({ route, count }));
  const uniqueRoutes = Object.keys(routeCounts).length;

  // Feedback
  const ratings = feedbacks.map(f => Number(f.rating)).filter(r => r >= 1 && r <= 5);
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
    : null;

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) ratingDistribution[r]++;

  const recentFeedback = [...feedbacks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
    .map(f => ({ rating: f.rating, overallNote: f.overallNote || '', updatedAt: f.updatedAt }));

  // Vote sessions
  const stopTotals: Record<string, number> = {};
  let totalVotesCast = 0;
  for (const s of sessions) {
    totalVotesCast += (s.voters?.length || 0);
    for (const stop of (s.stops || [])) {
      if (stop.name && stop.votes > 0) {
        stopTotals[stop.name] = (stopTotals[stop.name] || 0) + stop.votes;
      }
    }
  }
  const topVotedStops = Object.entries(stopTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, votes]) => ({ name, votes }));

  return {
    totalTrips,
    avgRating,
    ratingDistribution,
    totalVotesCast,
    uniqueRoutes,
    topVotedStops,
    popularRoutes,
    recentFeedback,
  };
}
