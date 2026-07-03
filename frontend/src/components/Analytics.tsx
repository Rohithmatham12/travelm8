import React, { useState, useEffect } from 'react';
import { get } from '../utils/api';
import { toast } from '../utils/toast';
import './Analytics.css';

interface AnalyticsData {
  totalTrips: number;
  avgRating: number | null;
  ratingDistribution: Record<string, number>;
  totalVotesCast: number;
  uniqueRoutes: number;
  topVotedStops: { name: string; votes: number }[];
  popularRoutes: { route: string; count: number }[];
  recentFeedback: { rating: number; overallNote: string; updatedAt: string }[];
}

const STAR_LABELS: Record<number, string> = { 1: 'Rough', 2: 'Okay', 3: 'Good', 4: 'Great', 5: 'Amazing' };

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="an-stat">
    <span className="an-stat-val">{value}</span>
    <span className="an-stat-label">{label}</span>
    {sub && <span className="an-stat-sub">{sub}</span>}
  </div>
);

const SkeletonAnalytics = () => (
  <div className="an-page">
    <div className="skeleton" style={{ height: 28, width: 160, borderRadius: 6, marginBottom: 24 }} />
    <div className="an-stats">
      {[1,2,3,4].map(i => <div key={i} className="an-stat skeleton" style={{ height: 88 }} />)}
    </div>
    <div className="an-grid">
      <div className="skeleton" style={{ height: 220, borderRadius: 14 }} />
      <div className="skeleton" style={{ height: 220, borderRadius: 14 }} />
    </div>
    <div className="skeleton" style={{ height: 180, borderRadius: 14, marginTop: 16 }} />
  </div>
);

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<AnalyticsData>('/analytics')
      .then(r => {
        if (r.success && r.data) setData(r.data);
        else toast.error('Failed to load analytics');
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonAnalytics />;
  if (!data) return <div className="an-page"><p className="an-empty">No analytics data yet.</p></div>;

  const maxRouteCount = Math.max(...data.popularRoutes.map(r => r.count), 1);
  const maxVotes = Math.max(...data.topVotedStops.map(s => s.votes), 1);
  const maxRating = Math.max(...Object.values(data.ratingDistribution).map(Number), 1);
  const totalRatings = Object.values(data.ratingDistribution).reduce((s, v) => s + Number(v), 0);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="an-page">
      <h1 className="an-title">Analytics</h1>

      {/* Stat cards */}
      <div className="an-stats">
        <StatCard label="Total trips" value={data.totalTrips} />
        <StatCard
          label="Avg rating"
          value={data.avgRating !== null ? `${data.avgRating} ★` : '—'}
          sub={totalRatings > 0 ? `${totalRatings} review${totalRatings !== 1 ? 's' : ''}` : undefined}
        />
        <StatCard label="Votes cast" value={data.totalVotesCast} />
        <StatCard label="Unique routes" value={data.uniqueRoutes} />
      </div>

      <div className="an-grid">
        {/* Rating distribution */}
        <div className="an-card">
          <h2 className="an-card-title">Rating breakdown</h2>
          {totalRatings === 0 ? (
            <p className="an-empty-small">No ratings yet</p>
          ) : (
            <div className="an-rating-bars">
              {[5,4,3,2,1].map(star => {
                const count = Number(data.ratingDistribution[star] || 0);
                const pct = Math.round((count / maxRating) * 100);
                return (
                  <div key={star} className="an-rating-row">
                    <span className="an-rating-star">{star}★</span>
                    <div className="an-bar-track">
                      <div className="an-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="an-rating-count">{count}</span>
                    {count > 0 && <span className="an-rating-label">{STAR_LABELS[star]}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top voted stops */}
        <div className="an-card">
          <h2 className="an-card-title">Top voted stops</h2>
          {data.topVotedStops.length === 0 ? (
            <p className="an-empty-small">No votes yet</p>
          ) : (
            <div className="an-stop-list">
              {data.topVotedStops.map((s, i) => (
                <div key={s.name} className="an-stop-row">
                  <span className="an-stop-rank">{i + 1}</span>
                  <span className="an-stop-name">{s.name}</span>
                  <div className="an-bar-track" style={{ flex: 1 }}>
                    <div className="an-bar-fill" style={{ width: `${Math.round((s.votes / maxVotes) * 100)}%` }} />
                  </div>
                  <span className="an-stop-votes">{s.votes}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Popular routes */}
      <div className="an-card" style={{ marginTop: 16 }}>
        <h2 className="an-card-title">Popular routes</h2>
        {data.popularRoutes.length === 0 ? (
          <p className="an-empty-small">No routes yet</p>
        ) : (
          <div className="an-route-list">
            {data.popularRoutes.map(r => (
              <div key={r.route} className="an-route-row">
                <span className="an-route-name">{r.route}</span>
                <div className="an-bar-track" style={{ flex: 1, maxWidth: 160 }}>
                  <div className="an-bar-fill" style={{ width: `${Math.round((r.count / maxRouteCount) * 100)}%` }} />
                </div>
                <span className="an-route-count">{r.count} trip{r.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent feedback */}
      {data.recentFeedback.length > 0 && (
        <div className="an-card" style={{ marginTop: 16 }}>
          <h2 className="an-card-title">Recent feedback</h2>
          <div className="an-feedback-list">
            {data.recentFeedback.map((f, i) => (
              <div key={i} className="an-feedback-row">
                <span className="an-feedback-stars">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                <span className="an-feedback-note">{f.overallNote || <em>No note</em>}</span>
                <span className="an-feedback-date">{fmtDate(f.updatedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
