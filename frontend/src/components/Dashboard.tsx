import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trip } from '../types/trip';
import { get } from '../utils/api';
import { getUser } from '../utils/auth';
import './Auth.css';

const statusLabel: Record<string, string> = {
  draft: 'Draft', planning: 'Planning', confirmed: 'Confirmed',
  completed: 'Done', cancelled: 'Cancelled',
};
const statusClass: Record<string, string> = {
  draft: 'status-draft', planning: 'status-planning', confirmed: 'status-confirmed',
  completed: 'status-completed', cancelled: 'status-cancelled',
};

const TripSkeleton = () => (
  <div className="db-trips-skel">
    {[1, 2, 3].map(i => (
      <div key={i} className="db-trip-skel-row">
        <div className="skeleton skel-text" style={{ width: 200 }} />
        <div style={{ flex: 1 }} />
        <div className="skeleton skel-text" style={{ width: 56 }} />
      </div>
    ))}
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDest, setSearchDest] = useState('');

  useEffect(() => {
    get<{ trips: Trip[] }>('/trips?limit=5')
      .then(r => { if (r.success && r.data) setTrips(r.data.trips || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="db-page">
      {/* Hero search */}
      <div className="db-hero">
        <p className="db-greeting">Hey {firstName} 👋</p>
        <h1 className="db-title">Where are you<br />driving next?</h1>
        <div className="db-search-bar">
          <span className="db-search-icon">🚗</span>
          <input
            className="db-search-input"
            type="text"
            placeholder="Where do you want to drive?"
            value={searchDest}
            onChange={e => setSearchDest(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && searchDest.trim()) {
                navigate('/route-planner', { state: { destination: searchDest.trim() } });
              }
            }}
            autoComplete="off"
            aria-label="Enter a destination"
          />
          <button
            className="db-search-cta"
            disabled={!searchDest.trim()}
            onClick={() => searchDest.trim() && navigate('/route-planner', { state: { destination: searchDest.trim() } })}
          >
            Plan Route →
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="db-actions">
        <button className="db-action-btn" onClick={() => navigate('/ai-recommendations')}>
          🌍 Explore Destinations
        </button>
        <button className="db-action-btn" onClick={() => navigate('/trips')}>
          📋 My Trips
        </button>
        <Link to="/trips/new" className="db-action-btn">
          + New Trip
        </Link>
      </div>

      {/* Recent trips */}
      <div className="db-trips">
        <div className="db-trips-header">
          <h2>Recent trips</h2>
          <Link to="/trips" className="db-trips-link">View all →</Link>
        </div>

        {loading ? (
          <TripSkeleton />
        ) : trips.length === 0 ? (
          <div className="db-trips-empty">
            <p className="db-empty-icon">🗺️</p>
            <p>No trips yet.</p>
            <p>
              <button onClick={() => navigate('/route-planner')}>
                Plan your first road trip →
              </button>
            </p>
          </div>
        ) : (
          <div className="db-trip-list">
            {trips.map(trip => (
              <Link key={trip.tripId} to={`/trips/${trip.tripId}`} className="db-trip-row">
                <div className="db-trip-row-info">
                  <strong>{trip.title}</strong>
                  <span>{trip.destination} · {formatDate(trip.startDate)} – {formatDate(trip.endDate)}</span>
                </div>
                <span className={`status-chip ${statusClass[trip.status] || 'status-draft'}`}>
                  {statusLabel[trip.status] || trip.status}
                </span>
                <span className="db-trip-row-chevron">›</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
