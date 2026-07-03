import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './PublicTripView.css';

interface PublicTrip {
  tripId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  routeData?: {
    routeRequest?: any;
    routePlan?: any;
    finalItinerary?: any;
  };
}

const eventTypeIcon: Record<string, string> = {
  drive: '🚗', stop: '📍', meal: '🍽', overnight: '🛏', activity: '🏛',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const PublicTripView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [trip, setTrip] = useState<PublicTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/trips/public/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) setTrip(data.data);
        else setError('Trip not found or this link has expired.');
      })
      .catch(() => setError('Failed to load trip.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="ptv-page">
      <div className="ptv-loading">Loading trip…</div>
    </div>
  );

  if (error || !trip) return (
    <div className="ptv-page">
      <div className="ptv-error">
        <p>🗺️ {error || 'Trip not found.'}</p>
        <Link to="/" className="ptv-home-link">Go to TravelM8 →</Link>
      </div>
    </div>
  );

  const rq = trip.routeData?.routeRequest;
  const fi = trip.routeData?.finalItinerary;
  const rs = trip.routeData?.routePlan?.routeSummary;
  const ai = trip.routeData?.routePlan?.aiInsights;

  return (
    <div className="ptv-page">
      <nav className="ptv-nav">
        <div className="ptv-logo">TravelM8</div>
        <Link to="/auth" className="ptv-cta">Plan your own trip →</Link>
      </nav>

      <div className="ptv-inner">
        <div className="ptv-badge">Shared Trip</div>
        <h1 className="ptv-title">{trip.title}</h1>
        <p className="ptv-meta">
          📍 {trip.destination} · {fmtDate(trip.startDate)}
          {trip.startDate !== trip.endDate ? ` – ${fmtDate(trip.endDate)}` : ''}
          · {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}
        </p>

        {rs && (
          <div className="ptv-summary">
            <div className="ptv-stat"><span className="ptv-stat-n">{rs.totalDistance}</span><span className="ptv-stat-l">miles</span></div>
            <div className="ptv-stat-div" />
            <div className="ptv-stat">
              <span className="ptv-stat-n">{Math.floor(rs.estimatedDriveTime / 60)}h {rs.estimatedDriveTime % 60}m</span>
              <span className="ptv-stat-l">drive time</span>
            </div>
            {rs.suggestedStops > 0 && (
              <>
                <div className="ptv-stat-div" />
                <div className="ptv-stat"><span className="ptv-stat-n">{rs.suggestedStops}</span><span className="ptv-stat-l">stops</span></div>
              </>
            )}
          </div>
        )}

        {ai && (
          <div className="ptv-ai-panel">
            <div className="ptv-ai-header">
              <span className="ptv-ai-chip">AI</span>
              <span className="ptv-ai-title">Copilot Analysis</span>
              <span className={`ptv-risk risk-${ai.riskLevel}`}>{ai.riskLevel.toUpperCase()} RISK</span>
            </div>
            <p className="ptv-ai-summary">{ai.tripSummary}</p>
            {ai.fatigueWarning && <div className="ptv-alert">⚠️ {ai.fatigueWarning}</div>}
            {ai.topTip && <div className="ptv-tip">💡 {ai.topTip}</div>}
          </div>
        )}

        {fi?.calendarEvents?.length > 0 && (
          <div className="ptv-events">
            <h2 className="ptv-section-title">Itinerary</h2>
            {fi.calendarEvents.map((ev: any) => (
              <div key={ev.id} className={`ptv-event ptv-event-${ev.type || 'stop'}`}>
                <div className="ptv-event-time">{fmtTime(ev.startTime)}</div>
                <div className="ptv-event-dot" />
                <div className="ptv-event-body">
                  <div className="ptv-event-title">{eventTypeIcon[ev.type] || '📍'} {ev.title}</div>
                  {ev.description && <p className="ptv-event-desc">{ev.description}</p>}
                  {ev.location && <span className="ptv-event-loc">📍 {ev.location}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="ptv-footer">
          <p>Want to plan your own road trip?</p>
          <Link to="/auth" className="ptv-footer-btn">Get TravelM8 free →</Link>
        </div>
      </div>
    </div>
  );
};

export default PublicTripView;
