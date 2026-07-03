import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trip } from '../types/trip';
import { get, post, del } from '../utils/api';
import { toast } from '../utils/toast';
import { generatePacketHtml, downloadPacket } from '../utils/routePacket';
import './TripDetail.css';

const TripDetailSkeleton = () => (
  <div className="td-page">
    <div className="skeleton" style={{ height: 14, width: 80, borderRadius: 4, marginBottom: 20 }} />
    <div className="skeleton" style={{ height: 28, width: '60%', borderRadius: 6, marginBottom: 8 }} />
    <div className="skeleton" style={{ height: 14, width: 200, borderRadius: 4, marginBottom: 24 }} />
    <div className="skeleton" style={{ height: 80, borderRadius: 14, marginBottom: 12 }} />
    <div className="skeleton" style={{ height: 160, borderRadius: 14, marginBottom: 12 }} />
    <div className="skeleton" style={{ height: 80, borderRadius: 14, marginBottom: 12 }} />
  </div>
);

interface TripFeedback {
  feedbackId: string;
  tripId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  whatWorked: string;
  whatDidnt: string;
  overallNote: string;
  updatedAt: string;
}

const TripDetail: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedback, setFeedback] = useState<TripFeedback | null>(null);
  const [fbRating, setFbRating] = useState<number>(0);
  const [fbWorked, setFbWorked] = useState('');
  const [fbDidnt, setFbDidnt] = useState('');
  const [fbNote, setFbNote] = useState('');
  const [fbSaving, setFbSaving] = useState(false);
  const [fbSaved, setFbSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadTrip = useCallback(async () => {
    try {
      const response = await get<Trip>(`/trips/${tripId}`);
      if (response.success && response.data) setTrip(response.data);
      else { setError(response.error || 'Failed to load trip'); toast.error(response.error || 'Failed to load trip'); }
    } catch { setError('Failed to load trip'); toast.error('Failed to load trip'); }
    finally { setLoading(false); }
  }, [tripId]);

  useEffect(() => { if (tripId) loadTrip(); }, [tripId, loadTrip]);

  useEffect(() => {
    if (!tripId) return;
    get<TripFeedback>(`/trips/${tripId}/feedback`).then(r => {
      if (r.success && r.data) {
        setFeedback(r.data);
        setFbRating(r.data.rating);
        setFbWorked(r.data.whatWorked);
        setFbDidnt(r.data.whatDidnt);
        setFbNote(r.data.overallNote);
      }
    }).catch(() => {});
  }, [tripId]);

  const handleSaveFeedback = async () => {
    if (!tripId || fbRating < 1) return;
    setFbSaving(true); setFbSaved(false);
    try {
      const r = await post<TripFeedback>(`/trips/${tripId}/feedback`, {
        rating: fbRating,
        whatWorked: fbWorked,
        whatDidnt: fbDidnt,
        overallNote: fbNote,
      });
      if (r.success && r.data) { setFeedback(r.data); setFbSaved(true); toast.success('Feedback saved!'); }
    } catch {}
    finally { setFbSaving(false); }
  };

  const handleDownloadPacket = async () => {
    if (!trip) return;
    setDownloading(true);
    try {
      const budgetRes = await get<any>(`/trips/${tripId}/budget`);
      const budget = budgetRes.success ? budgetRes.data : undefined;
      const html = generatePacketHtml({
        title: trip.title,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        travelers: trip.travelers,
        routePlan: trip.routeData?.routePlan,
        finalItinerary: trip.routeData?.finalItinerary,
        budget,
      });
      const slug = trip.title.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
      downloadPacket(html, `travelm8-${slug}.html`);
    } catch {
      toast.error('Failed to generate packet');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!tripId) return;
    setDeleting(true);
    try {
      const response = await del(`/trips/${tripId}`);
      if (response.success) { toast.success('Trip deleted'); navigate('/dashboard'); }
      else { toast.error(response.error || 'Failed to delete trip'); setDeleting(false); setConfirmDelete(false); }
    } catch { toast.error('Failed to delete trip'); setDeleting(false); setConfirmDelete(false); }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const fmtMins = (m: number) =>
    m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ''}`.trim() : `${m}m`;

  if (loading) return <TripDetailSkeleton />;

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
            <Link to={`/trips/${tripId}/budget`} className="td-replan-btn">$ Budget</Link>
            <button className="td-replan-btn" onClick={handleDownloadPacket} disabled={downloading}>
              {downloading ? '…' : '⬇ Packet'}
            </button>
            {rq && (
              <button
                className="td-replan-btn"
                onClick={() => navigate('/route-planner', { state: { routeRequest: rq } })}
              >
                ↺ Re-plan
              </button>
            )}
            {confirmDelete ? (
              <div className="td-confirm-delete">
                <span>Sure?</span>
                <button className="td-confirm-yes" onClick={handleDelete} disabled={deleting}>
                  {deleting ? '…' : 'Delete'}
                </button>
                <button className="td-confirm-no" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </div>
            ) : (
              <button className="td-delete-btn" onClick={() => setConfirmDelete(true)}>
                🗑 Delete
              </button>
            )}
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
          {ai?.riskLevel && (
            <>
              <div className="td-route-divider" />
              <div className="td-route-stat">
                <span className="td-route-lbl">Risk</span>
                <span className={`td-risk-pill risk-pill-${ai.riskLevel}`}>
                  <span className="risk-dot" />
                  {ai.riskLevel.toUpperCase()}
                </span>
              </div>
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

      {/* Post-trip feedback */}
      <div className="td-feedback">
        <h2 className="td-section-title">How did it go?</h2>
        <div className="td-stars">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              className={`td-star${fbRating >= n ? ' td-star-on' : ''}`}
              onClick={() => setFbRating(n)}
              aria-label={`${n} star`}
            >★</button>
          ))}
          {fbRating > 0 && (
            <span className="td-star-label">
              {['', 'Rough', 'Okay', 'Good', 'Great', 'Amazing'][fbRating]}
            </span>
          )}
        </div>
        <div className="td-feedback-fields">
          <div className="td-feedback-field">
            <label>What worked well?</label>
            <textarea
              value={fbWorked}
              onChange={e => setFbWorked(e.target.value)}
              placeholder="Stops, timing, route, food…"
              rows={2}
            />
          </div>
          <div className="td-feedback-field">
            <label>What would you change?</label>
            <textarea
              value={fbDidnt}
              onChange={e => setFbDidnt(e.target.value)}
              placeholder="Traffic, detours, missed spots…"
              rows={2}
            />
          </div>
          <div className="td-feedback-field">
            <label>Overall note</label>
            <textarea
              value={fbNote}
              onChange={e => setFbNote(e.target.value)}
              placeholder="Anything else worth remembering…"
              rows={2}
            />
          </div>
        </div>
        <div className="td-feedback-footer">
          {feedback && <span className="td-feedback-saved-label">Last saved {fmtDate(feedback.updatedAt)}</span>}
          <button
            className="btn-primary td-feedback-btn"
            onClick={handleSaveFeedback}
            disabled={fbRating < 1 || fbSaving}
          >
            {fbSaving ? 'Saving…' : fbSaved ? '✓ Saved' : feedback ? 'Update feedback' : 'Save feedback'}
          </button>
        </div>
      </div>

      <p className="td-meta">Saved {fmtDate(trip.createdAt)}</p>
    </div>
  );
};

export default TripDetail;
