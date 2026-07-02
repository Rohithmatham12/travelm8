import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trip } from '../types/trip';
import { get, del } from '../utils/api';
import './TripDetail.css';

const TripDetail: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTrip = useCallback(async () => {
    try {
      const response = await get<Trip>(`/trips/${tripId}`);
      if (response.success && response.data) setTrip(response.data);
      else setError(response.error || 'Failed to load trip');
    } catch { setError('Failed to load trip'); }
    finally { setLoading(false); }
  }, [tripId]);

  useEffect(() => { if (tripId) loadTrip(); }, [tripId, loadTrip]);

  const handleDelete = async () => {
    if (!tripId || !window.confirm('Delete this trip? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const response = await del(`/trips/${tripId}`);
      if (response.success) navigate('/dashboard');
      else setError(response.error || 'Failed to delete trip');
    } catch { setError('Failed to delete trip'); }
    finally { setDeleting(false); }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const fmtMins = (m: number) =>
    m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ''}`.trim() : `${m}m`;

  if (loading) return <div className="td-page"><div className="td-loading">Loading…</div></div>;

  if (error || !trip) return (
    <div className="td-page">
      <p className="td-error">{error || 'Trip not found'}</p>
      <Link to="/dashboard" className="td-back">← Dashboard</Link>
    </div>
  );

  const rd = trip.routeData;
  const rq = rd?.routeRequest;
  const rp = rd?.routePlan;
  const fi = rd?.finalItinerary;
  const ai = rp?.aiInsights;
  const rs = rp?.routeSummary;

  const eventTypeIcon: Record<string, string> = {
    drive: '🚗', stop: '📍', meal: '🍽', overnight: '🛏', activity: '🏛',
  };

  return (
    <div className="td-page">
      {/* Header */}
      <div className="td-header">
        <Link to="/dashboard" className="td-back">← Dashboard</Link>
        <div className="td-header-row">
          <div>
            <h1 className="td-title">{trip.title}</h1>
            <p className="td-subtitle">
              {rq ? `${fmtDate(rq.departureDate)} · ${rq.travelers} traveler${rq.travelers > 1 ? 's' : ''}` : fmtDate(trip.startDate)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {rq && (
              <button
                className="td-replan-btn"
                onClick={() => navigate('/route-planner', { state: { routeRequest: rq } })}
              >
                ↺ Re-plan
              </button>
            )}
            <button className="td-delete-btn" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : '🗑 Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Route summary bar */}
      {rs && (
        <div className="td-route-bar">
          <div className="td-route-stat"><span className="td-route-val">{rs.totalDistance}</span><span className="td-route-lbl">miles</span></div>
          <div className="td-route-divider" />
          <div className="td-route-stat"><span className="td-route-val">{fmtMins(rs.estimatedDriveTime)}</span><span className="td-route-lbl">drive time</span></div>
          {rs.majorCities?.length > 0 && (
            <>
              <div className="td-route-divider" />
              <div className="td-route-stat td-route-cities"><span className="td-route-lbl">via</span><span className="td-route-val">{rs.majorCities.slice(0, 3).join(', ')}</span></div>
            </>
          )}
        </div>
      )}

      {/* AI Copilot */}
      {ai && (
        <div className="td-ai-panel">
          <div className="td-ai-header">
            <div className="td-ai-title"><span className="td-ai-chip">AI</span> Copilot Analysis</div>
            <span className={`td-risk-badge risk-${ai.riskLevel}`}>{ai.riskLevel.toUpperCase()} RISK</span>
          </div>
          <p className="td-ai-summary">{ai.tripSummary}</p>
          {ai.fatigueWarning && (
            <div className="td-ai-alert fatigue">
              <span className="td-ai-alert-icon">⚠️</span>
              <p>{ai.fatigueWarning}</p>
            </div>
          )}
          {ai.lateArrivalNote && (
            <div className="td-ai-alert late">
              <span className="td-ai-alert-icon">🌙</span>
              <p>{ai.lateArrivalNote}</p>
            </div>
          )}
          {ai.topTip && (
            <div className="td-ai-tip">
              <span className="td-ai-tip-label">TOP TIP</span>
              <p>{ai.topTip}</p>
            </div>
          )}
        </div>
      )}

      {/* Cost breakdown */}
      {fi?.totalEstimatedCost && (
        <div className="td-cost">
          <div className="td-cost-total">
            <span className="td-cost-label">Total Estimated Cost</span>
            <span className="td-cost-amount">${fi.totalEstimatedCost.amount}</span>
          </div>
          <div className="td-cost-breakdown">
            {fi.totalEstimatedCost.breakdown.motels > 0 && <span>🛏 Motels · ${fi.totalEstimatedCost.breakdown.motels}</span>}
            {fi.totalEstimatedCost.breakdown.meals > 0 && <span>🍽 Meals · ${fi.totalEstimatedCost.breakdown.meals}</span>}
            {fi.totalEstimatedCost.breakdown.activities > 0 && <span>🏛 Activities · ${fi.totalEstimatedCost.breakdown.activities}</span>}
            {fi.totalEstimatedCost.breakdown.gas > 0 && <span>⛽ Gas · ${fi.totalEstimatedCost.breakdown.gas}</span>}
          </div>
        </div>
      )}

      {/* Calendar events / itinerary */}
      {fi?.calendarEvents?.length > 0 && (
        <div className="td-events">
          <h2 className="td-section-title">Itinerary</h2>
          <div className="td-event-list">
            {fi.calendarEvents.map((ev: any) => (
              <div key={ev.id} className={`td-event td-event-${ev.type || 'stop'}`}>
                <div className="td-event-time">{fmtTime(ev.startTime)}</div>
                <div className="td-event-dot" />
                <div className="td-event-body">
                  <div className="td-event-title">{eventTypeIcon[ev.type] || '📍'} {ev.title}</div>
                  {ev.description && <p className="td-event-desc">{ev.description}</p>}
                  {ev.location && <span className="td-event-loc">📍 {ev.location}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback: generic trip info (no routeData) */}
      {!rd && (
        <div className="td-generic">
          <div className="td-info-grid">
            <div className="td-info-card"><div className="td-info-label">Destination</div><div className="td-info-val">{trip.destination}</div></div>
            <div className="td-info-card"><div className="td-info-label">Dates</div><div className="td-info-val">{fmtDate(trip.startDate)} – {fmtDate(trip.endDate)}</div></div>
            <div className="td-info-card"><div className="td-info-label">Travelers</div><div className="td-info-val">{trip.travelers}</div></div>
            {trip.budget && <div className="td-info-card"><div className="td-info-label">Budget</div><div className="td-info-val">${trip.budget.toLocaleString()}</div></div>}
          </div>
          <p className="td-no-route">This trip has no saved route plan. <Link to="/route-planner">Plan a route →</Link></p>
        </div>
      )}

      <p className="td-meta">Saved {fmtDate(trip.createdAt)}</p>
    </div>
  );
};

export default TripDetail;
