import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { post } from '../utils/api';
import './RoutePlanner.css';

interface RouteStop {
  id: string; name: string; category: string; type: string; description: string;
  coordinates: { lat: number; lng: number }; address?: string;
  detourTime: number; estimatedTimeAtStop: number; rating?: number; reviewCount?: number;
  priceRange?: string; priceEstimate?: number; currency?: string; budgetFit?: string;
  verificationStatus: string; openHours?: string; amenities?: string[];
  distanceFromStart: number; confidenceScore?: number; whyRecommended?: string[]; riskFlags?: string[];
}

interface StopOptionSet {
  setId: string; label: string;
  distanceRange: { from: number; to: number };
  pois: RouteStop[]; restaurants: RouteStop[]; motels: RouteStop[];
}

interface AIInsight {
  tripSummary: string;
  fatigueWarning: string | null;
  lateArrivalNote: string | null;
  topTip: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface StopInsight {
  whyStop: string;
  bestTimeToVisit: string;
  localTip: string;
}

interface RouteResponse {
  inputsRecognized: any;
  routeSummary: {
    origin: string; destination: string; totalDistance: number;
    estimatedDriveTime: number; suggestedStops: number; majorCities: string[];
  };
  stopOptionSets: StopOptionSet[];
  topRatedMotels: RouteStop[]; budgetFriendlyMotels: RouteStop[];
  destinationHighlights?: RouteStop[];
  offlineMapPlan: { corridorWidth: number; regions: any[]; instructions: string[]; estimatedDownloadSize?: string; };
  calendarExportReady: boolean; userChoicePrompt: string;
  aiInsights?: AIInsight;
}

// Simple group voting state (localStorage-backed for demo)
interface VoteSession {
  code: string;
  stops: { id: string; name: string; votes: number }[];
  voters: string[];
}

const generateCode = () => Math.random().toString(36).slice(2, 7).toUpperCase();

const RoutePlanner: React.FC = () => {
  const location = useLocation();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  useEffect(() => {
    const state = location.state as { destination?: string; routeRequest?: any } | null;
    if (!state) return;
    if (state.routeRequest) {
      const rq = state.routeRequest;
      if (rq.origin) setOrigin(rq.origin);
      if (rq.destination) setDestination(rq.destination);
      if (rq.departureDate) setDepartureDate(rq.departureDate);
      if (rq.departureTime) setDepartureTime(rq.departureTime);
      if (rq.travelers) setTravelers(String(rq.travelers));
      if (rq.budget?.motelPerNight) setMotelBudget(String(rq.budget.motelPerNight));
      if (rq.budget?.mealBudget) setMealBudget(String(rq.budget.mealBudget));
    } else if (state.destination) {
      setDestination(state.destination);
    }
  }, [location.state]);
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [travelers, setTravelers] = useState('');
  const [motelBudget, setMotelBudget] = useState('');
  const [mealBudget, setMealBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routePlan, setRoutePlan] = useState<RouteResponse | null>(null);
  const [selectedPois, setSelectedPois] = useState<string[]>([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
  const [selectedMotel, setSelectedMotel] = useState<string>('');
  const [finalItinerary, setFinalItinerary] = useState<any>(null);
  const [stopInsights, setStopInsights] = useState<Record<string, StopInsight | 'loading'>>({});
  const [tripSaveState, setTripSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Group voting state
  const [voteSession, setVoteSession] = useState<VoteSession | null>(null);
  const [voterName, setVoterName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const getRouteRequest = () => {
    const travelerCount = travelers ? Number(travelers) : 1;
    if (!origin.trim() || !destination.trim()) throw new Error('Please enter both origin and destination.');
    if (!Number.isFinite(travelerCount) || travelerCount < 1 || travelerCount > 20) throw new Error('Travelers must be between 1 and 20.');
    const budget: any = {};
    if (motelBudget) budget.motelPerNight = Number(motelBudget);
    if (mealBudget) budget.mealBudget = Number(mealBudget);
    return {
      origin: origin.trim(), destination: destination.trim(),
      departureDate: departureDate || new Date().toISOString().split('T')[0],
      departureTime: departureTime || '08:00',
      travelers: travelerCount,
      ...(Object.keys(budget).length > 0 && { budget }),
      preferences: { stopFrequency: 'moderate' },
      needsOfflineMaps: true
    };
  };

  const handlePlanRoute = async () => {
    setLoading(true); setError(null); setRoutePlan(null);
    setFinalItinerary(null); setSelectedPois([]); setSelectedRestaurants([]); setSelectedMotel('');
    setTripSaveState('idle');
    try {
      const result = await post<RouteResponse>('/route/plan', getRouteRequest());
      if (result.success && result.data) {
        setRoutePlan(result.data);
        const pois = result.data.stopOptionSets.map((s) => s.pois[0]?.id).filter(Boolean) as string[];
        const rests = result.data.stopOptionSets.map((s) => s.restaurants[0]?.id).filter(Boolean) as string[];
        const motel = result.data.budgetFriendlyMotels[0]?.id || result.data.topRatedMotels[0]?.id || '';
        setSelectedPois(pois); setSelectedRestaurants(rests); setSelectedMotel(motel);
      } else { setError(result.error || 'Failed to plan route'); }
    } catch (err: any) { setError(err.message || 'Failed to plan route'); }
    finally { setLoading(false); }
  };

  const handleFinalize = async () => {
    if (!routePlan) return;
    setLoading(true);
    try {
      const result = await post<any>('/route/finalize', {
        routeRequest: getRouteRequest(),
        selections: { routeId: 'route-1', selectedPois, selectedRestaurants, selectedMotel, departureTime }
      });
      if (result.success && result.data) setFinalItinerary(result.data);
      else setError(result.error || 'Failed to generate itinerary');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSaveTrip = async () => {
    if (tripSaveState === 'saving' || tripSaveState === 'saved') return;
    setTripSaveState('saving');
    try {
      const result = await post<any>('/trips/save-route', {
        routeRequest: getRouteRequest(),
        routePlan,
        finalItinerary,
      });
      setTripSaveState(result.success ? 'saved' : 'error');
    } catch { setTripSaveState('error'); }
  };

  const handleExportCalendar = async () => {
    if (!finalItinerary) return;
    try {
      const result = await post<any>('/route/export-calendar', {
        events: finalItinerary.calendarEvents,
        tripTitle: `${origin} to ${destination} Road Trip`
      });
      if (result.success && result.data) {
        const blob = new Blob([result.data.icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = result.data.filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }
    } catch (err) { console.error('Failed to export calendar:', err); }
  };

  const handleDownloadPDF = () => {
    if (!routePlan) return;
    const { routeSummary, aiInsights, stopOptionSets } = routePlan;
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>TravelM8 Route Packet — ${routeSummary.origin} → ${routeSummary.destination}</title>
<style>
  body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; color: #111; }
  h1 { font-size: 1.6rem; border-bottom: 3px solid #F59E0B; padding-bottom: 8px; }
  h2 { font-size: 1.1rem; color: #555; margin-top: 24px; }
  .meta { display: flex; gap: 32px; margin: 12px 0 24px; }
  .meta-item { }
  .meta-item strong { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: #888; }
  .meta-item span { font-size: 1.2rem; font-weight: 700; color: #111; }
  .risk { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 0.85rem; }
  .risk-low { background: #d1fae5; color: #065f46; }
  .risk-medium { background: #fef3c7; color: #92400e; }
  .risk-high { background: #fee2e2; color: #991b1b; }
  .alert { padding: 10px 14px; border-radius: 4px; margin: 8px 0; }
  .fatigue-alert { background: #fef3c7; border-left: 4px solid #F59E0B; }
  .late-alert { background: #fee2e2; border-left: 4px solid #EF4444; }
  .tip-box { background: #ecfeff; border-left: 4px solid #22D3EE; padding: 10px 14px; margin: 8px 0; }
  .stop-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; margin: 8px 0; }
  .stop-card h4 { margin: 0 0 4px; font-size: 0.95rem; }
  .stop-card p { margin: 0; font-size: 0.85rem; color: #555; }
  .route-line { font-size: 0.9rem; color: #555; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>TravelM8 Offline Route Packet</h1>
<div class="route-line">${routeSummary.origin} → ${routeSummary.majorCities.join(' → ')} → ${routeSummary.destination}</div>
<div class="meta">
  <div class="meta-item"><strong>Distance</strong><span>${routeSummary.totalDistance} mi</span></div>
  <div class="meta-item"><strong>Drive Time</strong><span>${Math.floor(routeSummary.estimatedDriveTime / 60)}h ${routeSummary.estimatedDriveTime % 60}m</span></div>
  <div class="meta-item"><strong>Stops</strong><span>${routeSummary.suggestedStops}</span></div>
  <div class="meta-item"><strong>Risk</strong><span class="risk risk-${aiInsights?.riskLevel ?? 'low'}">${(aiInsights?.riskLevel ?? 'low').toUpperCase()}</span></div>
</div>
${aiInsights ? `
<h2>AI Copilot Summary</h2>
<p>${aiInsights.tripSummary}</p>
${aiInsights.fatigueWarning ? `<div class="alert fatigue-alert">⚠️ Fatigue Warning: ${aiInsights.fatigueWarning}</div>` : ''}
${aiInsights.lateArrivalNote ? `<div class="alert late-alert">🌙 Late Arrival: ${aiInsights.lateArrivalNote}</div>` : ''}
<div class="tip-box">💡 Top Tip: ${aiInsights.topTip}</div>
` : ''}
<h2>Planned Stops</h2>
${stopOptionSets.map(set => `
  <h3 style="font-size:0.9rem;color:#555;margin-top:16px;">${set.label} (${set.distanceRange.from}–${set.distanceRange.to} mi)</h3>
  ${[...set.pois, ...set.restaurants].map(s => `
    <div class="stop-card">
      <h4>${s.name} <small style="color:#888;font-weight:400;">${s.category}</small></h4>
      <p>${s.description}</p>
      ${s.address ? `<p style="color:#888;font-size:0.78rem;">📍 ${s.address}</p>` : ''}
      ${s.openHours ? `<p style="color:#888;font-size:0.78rem;">🕒 ${s.openHours}</p>` : ''}
    </div>
  `).join('')}
`).join('')}
<p style="margin-top:40px;font-size:0.75rem;color:#aaa;">Generated by TravelM8 — save as PDF via File → Print → Save as PDF</p>
</body>
</html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  };

  // Group voting helpers
  const createVoteSession = () => {
    if (!routePlan) return;
    const allStops = routePlan.stopOptionSets.flatMap(s => [...s.pois, ...s.restaurants]).slice(0, 10);
    const session: VoteSession = {
      code: generateCode(),
      stops: allStops.map(s => ({ id: s.id, name: s.name, votes: 0 })),
      voters: []
    };
    setVoteSession(session);
    localStorage.setItem(`tm8-vote-${session.code}`, JSON.stringify(session));
  };

  const joinSession = () => {
    const saved = localStorage.getItem(`tm8-vote-${joinCode.toUpperCase()}`);
    if (saved) { setVoteSession(JSON.parse(saved)); setShowJoin(false); }
    else { alert('Session not found. Try the code again.'); }
  };

  const voteForStop = (stopId: string) => {
    if (!voteSession || !voterName.trim()) return;
    if (voteSession.voters.includes(voterName.trim())) { alert('You already voted in this session.'); return; }
    const updated: VoteSession = {
      ...voteSession,
      stops: voteSession.stops.map(s => s.id === stopId ? { ...s, votes: s.votes + 1 } : s),
      voters: [...voteSession.voters, voterName.trim()]
    };
    setVoteSession(updated);
    localStorage.setItem(`tm8-vote-${updated.code}`, JSON.stringify(updated));
  };

  const getVerificationBadge = (status: string) => {
    const map: Record<string, string> = { verified: 'verified', 'partially-verified': 'partial' };
    return <span className={`badge ${map[status] || 'unverified'}`}>{status === 'verified' ? '✓ Verified' : status === 'partially-verified' ? '~ Estimated' : '? Unverified'}</span>;
  };

  const getBudgetBadge = (budgetFit?: string) => {
    const map: Record<string, string> = { 'within-budget': 'budget-ok', 'slightly-above': 'budget-warn', 'above-budget': 'budget-over' };
    const labels: Record<string, string> = { 'within-budget': '✓ Budget', 'slightly-above': '~ Slightly Over', 'above-budget': '✗ Over Budget' };
    return <span className={`badge ${map[budgetFit || ''] || 'budget-unknown'}`}>{labels[budgetFit || ''] || 'Price Unknown'}</span>;
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60), m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Helper: get selected stop id for a given option set + category
  const getSelectedForSet = (setId: string, category: 'poi' | 'restaurant' | 'motel') => {
    const set = routePlan?.stopOptionSets.find(s => s.setId === setId);
    if (!set) return '';
    const pool = category === 'poi' ? set.pois : category === 'restaurant' ? set.restaurants : set.motels;
    const ids = pool.map(s => s.id);
    if (category === 'motel') return ids.includes(selectedMotel) ? selectedMotel : '';
    const arr = category === 'poi' ? selectedPois : selectedRestaurants;
    return arr.find(id => ids.includes(id)) || '';
  };

  const handleSetSelect = (setId: string, category: 'poi' | 'restaurant' | 'motel', stopId: string) => {
    const set = routePlan?.stopOptionSets.find(s => s.setId === setId);
    if (!set) return;
    if (category === 'poi') {
      const setIds = set.pois.map(s => s.id);
      setSelectedPois(prev => { const f = prev.filter(x => !setIds.includes(x)); return stopId ? [...f, stopId] : f; });
    } else if (category === 'restaurant') {
      const setIds = set.restaurants.map(s => s.id);
      setSelectedRestaurants(prev => { const f = prev.filter(x => !setIds.includes(x)); return stopId ? [...f, stopId] : f; });
    } else {
      setSelectedMotel(stopId);
    }

    if (!stopId) return;
    const stop = [...(set.pois), ...(set.restaurants), ...(set.motels)].find(s => s.id === stopId);
    if (!stop || stopInsights[stopId]) return;
    setStopInsights(prev => ({ ...prev, [stopId]: 'loading' }));
    post<StopInsight>('/route/stop-insight', {
      stopName: stop.name,
      stopCategory: stop.category,
      origin,
      destination,
    }).then(r => {
      if (r.success && r.data) setStopInsights(prev => ({ ...prev, [stopId]: r.data as StopInsight }));
      else setStopInsights(prev => { const n = { ...prev }; delete n[stopId]; return n; });
    }).catch(() => {
      setStopInsights(prev => { const n = { ...prev }; delete n[stopId]; return n; });
    });
  };

  const findStop = (id: string): RouteStop | undefined =>
    routePlan?.stopOptionSets.flatMap(s => [...s.pois, ...s.restaurants, ...s.motels]).find(s => s.id === id);

  const mapsLink = (stop: RouteStop) =>
    `https://www.google.com/maps/search/?api=1&query=${stop.coordinates.lat},${stop.coordinates.lng}`;

  return (
    <div className="route-planner">
      {/* Form */}
      <section className="route-form">
        <h2>Plan a road trip</h2>
        <div className="rp-from-to">
          <div className="form-group">
            <label>From</label>
            <input type="text" value={origin} onChange={e => setOrigin(e.target.value)} placeholder="New York, NY" />
          </div>
          <div className="rp-arrow">→</div>
          <div className="form-group">
            <label>To</label>
            <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder="San Francisco, CA" />
          </div>
        </div>
        <div className="rp-options">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Depart time</label>
            <input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Travelers</label>
            <input type="number" min="1" max="10" value={travelers} onChange={e => setTravelers(e.target.value)} placeholder="1" />
          </div>
          <div className="form-group">
            <label>Motel / night</label>
            <div className="input-with-prefix"><span>$</span><input type="number" value={motelBudget} onChange={e => setMotelBudget(e.target.value)} placeholder="80" /></div>
          </div>
          <div className="form-group">
            <label>Meal / stop</label>
            <div className="input-with-prefix"><span>$</span><input type="number" value={mealBudget} onChange={e => setMealBudget(e.target.value)} placeholder="15" /></div>
          </div>
        </div>
        <button className="btn-primary plan-btn" onClick={handlePlanRoute} disabled={loading || !origin.trim() || !destination.trim()}>
          {loading ? '⟳ Planning your route...' : 'Plan My Route →'}
        </button>
      </section>

      {error && <div className="error-message">{error}</div>}

      {routePlan && (
        <>
          {/* AI Copilot Panel */}
          {routePlan.aiInsights && (
            <div className="ai-copilot-panel">
              <div className="ai-panel-header">
                <div className="ai-panel-title">
                  <span className="ai-chip">AI</span>
                  <span>Copilot Analysis</span>
                </div>
                <span className={`risk-badge risk-${routePlan.aiInsights.riskLevel}`}>
                  <span className="risk-dot" />
                  {routePlan.aiInsights.riskLevel.toUpperCase()} RISK
                </span>
              </div>
              <div className="ai-panel-body">
                <p className="ai-trip-summary">{routePlan.aiInsights.tripSummary}</p>
                <div className="ai-alerts">
                  {routePlan.aiInsights.fatigueWarning && (
                    <div className="ai-alert fatigue">
                      <span className="ai-alert-icon">⚠️</span>
                      <div className="ai-alert-text">
                        <strong>Fatigue Warning</strong>
                        <p>{routePlan.aiInsights.fatigueWarning}</p>
                      </div>
                    </div>
                  )}
                  {routePlan.aiInsights.lateArrivalNote && (
                    <div className="ai-alert late">
                      <span className="ai-alert-icon">🌙</span>
                      <div className="ai-alert-text">
                        <strong>Late Arrival Alert</strong>
                        <p>{routePlan.aiInsights.lateArrivalNote}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="ai-top-tip">
                  <span className="ai-top-tip-label">Top Tip</span>
                  <p>{routePlan.aiInsights.topTip}</p>
                </div>
              </div>
            </div>
          )}

          {/* Route Summary */}
          <section className="route-summary">
            <span className="section-kicker">Drive summary</span>
            <div className="summary-cards" style={{ marginTop: '1rem' }}>
              <div className="summary-card">
                <span className="label">Total Distance</span>
                <span className="value">{routePlan.routeSummary.totalDistance} mi</span>
              </div>
              <div className="summary-card">
                <span className="label">Drive Time</span>
                <span className="value">{formatDuration(routePlan.routeSummary.estimatedDriveTime)}</span>
              </div>
              <div className="summary-card">
                <span className="label">Planned Stops</span>
                <span className="value">{routePlan.routeSummary.suggestedStops}</span>
              </div>
            </div>
            <div className="route-cities"><strong>Route:</strong> {routePlan.routeSummary.majorCities.join(' → ')}</div>
          </section>

          {/* Stop Option Sets — dropdown per category */}
          {routePlan.stopOptionSets.map(optionSet => (
            <section key={optionSet.setId} className="stop-options">
              <div className="stop-zone-header">
                <h3>{optionSet.label}</h3>
                <span className="distance-range">{optionSet.distanceRange.from}–{optionSet.distanceRange.to} mi from start</span>
              </div>

              {optionSet.pois.length > 0 && (() => {
                const selId = getSelectedForSet(optionSet.setId, 'poi');
                const selStop = selId ? findStop(selId) : null;
                return (
                  <div className="stop-category">
                    <label className="stop-cat-label">🏛 Places to Explore</label>
                    <select className="stop-select" value={selId} onChange={e => handleSetSelect(optionSet.setId, 'poi', e.target.value)}>
                      <option value="">— Skip this zone —</option>
                      {optionSet.pois.map(poi => (
                        <option key={poi.id} value={poi.id}>
                          {poi.name}{poi.address ? ` · ${poi.address}` : ` · ${poi.category}`}{poi.detourTime > 0 ? ` · +${poi.detourTime}min` : ''}{poi.rating ? ` · ★${poi.rating.toFixed(1)}` : ''}
                        </option>
                      ))}
                    </select>
                    {selStop && (
                      <div className="stop-detail">
                        <p className="stop-detail-desc">{selStop.description}</p>
                        <div className="stop-detail-meta">
                          {selStop.address && (
                            <a href={mapsLink(selStop)} target="_blank" rel="noopener noreferrer" className="stop-map-link">
                              📍 {selStop.address}
                            </a>
                          )}
                          {selStop.openHours && <span>🕒 {selStop.openHours}</span>}
                          {typeof selStop.priceEstimate === 'number' && <span>💵 ${selStop.priceEstimate} {selStop.currency || 'USD'}</span>}
                          {selStop.estimatedTimeAtStop > 0 && <span>⏱ ~{selStop.estimatedTimeAtStop}min visit</span>}
                        </div>
                        {stopInsights[selStop.id] === 'loading' && <div className="stop-insight-loading"><span className="insight-dot" /><span className="insight-dot" /><span className="insight-dot" /></div>}
                        {stopInsights[selStop.id] && stopInsights[selStop.id] !== 'loading' && (() => {
                          const ins = stopInsights[selStop.id] as StopInsight;
                          return (
                            <div className="stop-insight">
                              <div className="stop-insight-label">✦ AI Insight</div>
                              <p className="stop-insight-why">{ins.whyStop}</p>
                              <div className="stop-insight-meta">
                                <span>🕐 {ins.bestTimeToVisit}</span>
                                <span>💡 {ins.localTip}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })()}

              {optionSet.restaurants.length > 0 && (() => {
                const selId = getSelectedForSet(optionSet.setId, 'restaurant');
                const selStop = selId ? findStop(selId) : null;
                return (
                  <div className="stop-category">
                    <label className="stop-cat-label">🍽 Food Stop</label>
                    <select className="stop-select" value={selId} onChange={e => handleSetSelect(optionSet.setId, 'restaurant', e.target.value)}>
                      <option value="">— Skip food here —</option>
                      {optionSet.restaurants.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name}{r.address ? ` · ${r.address}` : ` · ${r.category}`}{typeof r.priceEstimate === 'number' ? ` · $${r.priceEstimate}` : ''}{r.rating ? ` · ★${r.rating.toFixed(1)}` : ''}
                        </option>
                      ))}
                    </select>
                    {selStop && (
                      <div className="stop-detail">
                        <p className="stop-detail-desc">{selStop.description}</p>
                        <div className="stop-detail-meta">
                          {selStop.address && (
                            <a href={mapsLink(selStop)} target="_blank" rel="noopener noreferrer" className="stop-map-link">
                              📍 {selStop.address}
                            </a>
                          )}
                          {selStop.openHours && <span>🕒 {selStop.openHours}</span>}
                          {typeof selStop.priceEstimate === 'number' && <span>💵 ~${selStop.priceEstimate}/person</span>}
                        </div>
                        {stopInsights[selStop.id] === 'loading' && <div className="stop-insight-loading"><span className="insight-dot" /><span className="insight-dot" /><span className="insight-dot" /></div>}
                        {stopInsights[selStop.id] && stopInsights[selStop.id] !== 'loading' && (() => {
                          const ins = stopInsights[selStop.id] as StopInsight;
                          return (
                            <div className="stop-insight">
                              <div className="stop-insight-label">✦ AI Insight</div>
                              <p className="stop-insight-why">{ins.whyStop}</p>
                              <div className="stop-insight-meta">
                                <span>🕐 {ins.bestTimeToVisit}</span>
                                <span>💡 {ins.localTip}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })()}

              {optionSet.motels.length > 0 && (() => {
                const selId = getSelectedForSet(optionSet.setId, 'motel');
                const selStop = selId ? findStop(selId) : null;
                return (
                  <div className="stop-category">
                    <label className="stop-cat-label">🛏 Overnight Stay</label>
                    <select className="stop-select" value={selId} onChange={e => handleSetSelect(optionSet.setId, 'motel', e.target.value)}>
                      <option value="">— Drive through, no overnight —</option>
                      {optionSet.motels.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.address ? ` · ${m.address}` : ''}{typeof m.priceEstimate === 'number' ? ` · $${m.priceEstimate}/night` : ''}{m.rating ? ` · ★${m.rating.toFixed(1)}` : ''}
                        </option>
                      ))}
                    </select>
                    {selStop && (
                      <div className="stop-detail">
                        <p className="stop-detail-desc">{selStop.description}</p>
                        <div className="stop-detail-meta">
                          {selStop.address && (
                            <a href={mapsLink(selStop)} target="_blank" rel="noopener noreferrer" className="stop-map-link">
                              📍 {selStop.address}
                            </a>
                          )}
                          {selStop.openHours && <span>🕒 {selStop.openHours}</span>}
                          {typeof selStop.priceEstimate === 'number' && <span>💵 ${selStop.priceEstimate}/night</span>}
                        </div>
                        {stopInsights[selStop.id] === 'loading' && <div className="stop-insight-loading"><span className="insight-dot" /><span className="insight-dot" /><span className="insight-dot" /></div>}
                        {stopInsights[selStop.id] && stopInsights[selStop.id] !== 'loading' && (() => {
                          const ins = stopInsights[selStop.id] as StopInsight;
                          return (
                            <div className="stop-insight">
                              <div className="stop-insight-label">✦ AI Insight</div>
                              <p className="stop-insight-why">{ins.whyStop}</p>
                              <div className="stop-insight-meta">
                                <span>🕐 {ins.bestTimeToVisit}</span>
                                <span>💡 {ins.localTip}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })()}
            </section>
          ))}

          {/* Motel comparison */}
          <div className="motel-comparison">
            <div className="motel-column">
              <h3>★ Top-Rated Motels</h3>
              {routePlan.topRatedMotels.map(m => (
                <div key={m.id} className={`motel-card ${selectedMotel === m.id ? 'selected' : ''}`} onClick={() => setSelectedMotel(m.id)}>
                  <h5>{m.name}</h5>
                  <p>{m.rating?.toFixed(1)} ★ · {m.detourTime} min detour</p>
                  {typeof m.priceEstimate === 'number' && <p>${m.priceEstimate}/night {getBudgetBadge(m.budgetFit)}</p>}
                  {getVerificationBadge(m.verificationStatus)}
                </div>
              ))}
            </div>
            <div className="motel-column">
              <h3>$ Budget-Friendly Motels</h3>
              {routePlan.budgetFriendlyMotels.map(m => (
                <div key={m.id} className={`motel-card ${selectedMotel === m.id ? 'selected' : ''}`} onClick={() => setSelectedMotel(m.id)}>
                  <h5>{m.name}</h5>
                  {typeof m.priceEstimate === 'number' && <p>${m.priceEstimate}/night {getBudgetBadge(m.budgetFit)}</p>}
                  <p>{m.rating?.toFixed(1)} ★ · {m.detourTime} min detour</p>
                  {getVerificationBadge(m.verificationStatus)}
                </div>
              ))}
            </div>
          </div>

          {/* Destination Highlights */}
          {routePlan.destinationHighlights && routePlan.destinationHighlights.length > 0 && (
            <section className="dest-highlights">
              <div className="dest-highlights-header">
                <span className="section-kicker">At your destination</span>
                <h3>Popular places in {routePlan.routeSummary.destination}</h3>
              </div>
              <div className="highlights-grid">
                {routePlan.destinationHighlights.map(place => (
                  <div key={place.id} className="highlight-card">
                    <div className="highlight-card-top">
                      <span className="highlight-badge">{place.category}</span>
                      {place.rating && <span className="highlight-rating">★ {place.rating.toFixed(1)}</span>}
                    </div>
                    <h4 className="highlight-name">{place.name}</h4>
                    <p className="highlight-desc">{place.description}</p>
                    <div className="highlight-footer">
                      {place.address && (
                        <a href={mapsLink(place)} target="_blank" rel="noopener noreferrer" className="highlight-location">
                          📍 {place.address}
                        </a>
                      )}
                      <div className="highlight-meta">
                        {place.openHours && <span>{place.openHours}</span>}
                        {typeof place.priceEstimate === 'number' && (
                          <span>{place.priceEstimate === 0 ? 'Free entry' : `$${place.priceEstimate}`}</span>
                        )}
                        {place.estimatedTimeAtStop > 0 && <span>~{place.estimatedTimeAtStop}min</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Group Voting */}
          <section className="group-section">
            <h3>Group Trip Voting</h3>
            <p>Share a code with your travel group — everyone votes on stops before you finalize.</p>
            {!voteSession ? (
              <div className="group-actions">
                <button className="btn-ghost" onClick={createVoteSession}>+ Create Vote Session</button>
                <button className="btn-secondary" onClick={() => setShowJoin(v => !v)}>Join Session</button>
              </div>
            ) : (
              <div className="session-active">
                <div className="session-code-label">Share this code with your group</div>
                <div className="session-code">{voteSession.code}</div>
                <div className="session-hint">Others enter this code to vote on stops</div>
                <div className="vote-tally">
                  <h4>Vote tally</h4>
                  {voteSession.stops.sort((a, b) => b.votes - a.votes).slice(0, 5).map(s => (
                    <div key={s.id} className="tally-row">
                      <span>{s.name}</span>
                      <span className="tally-count">{s.votes} votes</span>
                    </div>
                  ))}
                </div>
                {voteSession.voters.length === 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '0.5rem' }}>Cast your vote:</p>
                    <div className="join-row">
                      <input className="form-group input" placeholder="Your name" value={voterName} onChange={e => setVoterName(e.target.value)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '0.5rem' }}>
                      {voteSession.stops.slice(0, 6).map(s => (
                        <div key={s.id} style={{ padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-3)' }}
                          onClick={() => voteForStop(s.id)}>
                          {s.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="voter-list" style={{ marginTop: '0.75rem' }}>
                  {voteSession.voters.map(v => <span key={v} className="voter-chip">{v}</span>)}
                </div>
              </div>
            )}
            {showJoin && (
              <div className="join-row" style={{ marginTop: '0.75rem' }}>
                <input placeholder="Enter session code" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
                <button className="btn-primary" onClick={joinSession}>Join</button>
              </div>
            )}
          </section>

          {/* Offline Packet */}
          <section className="offline-section">
            <h3>Offline Route Packet</h3>
            <p>Download a full printable guide — stops, hours, backup options, emergency notes. Works without internet.</p>
            <div className="offline-info-grid">
              <div className="offline-stat">
                <div className="label">Corridor</div>
                <div className="val">{routePlan.offlineMapPlan.corridorWidth} mi wide</div>
              </div>
              <div className="offline-stat">
                <div className="label">Est. Download</div>
                <div className="val">{routePlan.offlineMapPlan.estimatedDownloadSize || '~120MB'}</div>
              </div>
              <div className="offline-stat">
                <div className="label">Regions</div>
                <div className="val">{routePlan.offlineMapPlan.regions.length || '4'} zones</div>
              </div>
            </div>
            {routePlan.offlineMapPlan.instructions.length > 0 && (
              <ul className="instructions-list">
                {routePlan.offlineMapPlan.instructions.slice(0, 4).map((inst, i) => <li key={i}>{inst}</li>)}
              </ul>
            )}
            <div className="offline-actions">
              <button className="btn-primary" onClick={handleDownloadPDF}>⬇ Download Route PDF</button>
            </div>
          </section>

          {/* Selection Summary */}
          <section className="selection-summary">
            <h3>Your Selections</h3>
            <div className="selections">
              <div className="selection-chip"><div className="sel-label">POIs</div><div className="sel-val">{selectedPois.length}</div></div>
              <div className="selection-chip"><div className="sel-label">Food Stops</div><div className="sel-val">{selectedRestaurants.length}</div></div>
              <div className="selection-chip"><div className="sel-label">Motel</div><div className="sel-val">{selectedMotel ? '1' : '0'}</div></div>
            </div>
            <button className="btn-primary finalize-btn" onClick={handleFinalize} disabled={loading || (selectedPois.length === 0 && selectedRestaurants.length === 0 && !selectedMotel)}>
              {loading ? '⟳  Generating itinerary...' : '→  Generate Final Itinerary'}
            </button>
          </section>
        </>
      )}

      {/* Final Itinerary */}
      {finalItinerary && (
        <section className="final-itinerary">
          <h2>Your Final Itinerary</h2>
          <div className="cost-summary">
            <h4>Total Estimated Cost: ${finalItinerary.totalEstimatedCost.amount}</h4>
            <div className="cost-breakdown">
              <span>Motels: ${finalItinerary.totalEstimatedCost.breakdown.motels}</span>
              <span>Meals: ${finalItinerary.totalEstimatedCost.breakdown.meals}</span>
              <span>Activities: ${finalItinerary.totalEstimatedCost.breakdown.activities}</span>
              <span>Gas: ${finalItinerary.totalEstimatedCost.breakdown.gas}</span>
            </div>
          </div>
          <div className="calendar-events">
            {finalItinerary.calendarEvents.map((event: any) => (
              <div key={event.id} className={`event-card ${event.type || 'stop'}`}>
                <div className="event-time">{new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="event-details">
                  <h5>{event.title}</h5>
                  <p>{event.description}</p>
                  {event.location && <span className="location">📍 {event.location}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="itinerary-actions">
            <button className="btn-secondary" onClick={handleExportCalendar}>📅 Export to Calendar (.ics)</button>
            <button className="btn-ghost" onClick={handleDownloadPDF}>⬇ Download PDF Packet</button>
            <button
              className={`btn-save-trip${tripSaveState === 'saved' ? ' saved' : ''}`}
              onClick={handleSaveTrip}
              disabled={tripSaveState === 'saving' || tripSaveState === 'saved'}
            >
              {tripSaveState === 'saving' ? '⟳ Saving...' : tripSaveState === 'saved' ? '✓ Saved to My Trips' : tripSaveState === 'error' ? '✕ Save failed — retry' : '💾 Save Trip'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default RoutePlanner;
