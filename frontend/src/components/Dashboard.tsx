import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trip } from '../types/trip';
import { get } from '../utils/api';
import { isDemoMode } from '../utils/auth';

const Dashboard: React.FC = () => {
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const demoMode = isDemoMode();

  useEffect(() => {
    loadRecentTrips();
  }, []);

  const loadRecentTrips = async () => {
    try {
      setLoading(true);
      const response = await get<{ trips: Trip[]; nextToken?: string }>('/trips?limit=5');
      
      if (response.success && response.data) {
        setRecentTrips(response.data.trips || []);
      } else {
        setError(response.error || 'Failed to load trips');
      }
    } catch (err) {
      console.error('Error loading trips:', err);
      setError('Failed to load recent trips');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'status-draft';
      case 'planning': return 'status-planning';
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-draft';
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-hero-copy">
          <span className="eyebrow">Road-trip execution, not generic lists</span>
          <h1>Plan routes with safer stops, budgets, meals, and offline backups.</h1>
          <p>
            TravelM8 turns a drive into an explainable route packet: stop confidence,
            fatigue signals, meal timing, motel fallback, and calendar-ready execution.
          </p>
          <div className="dashboard-actions">
            <Link to="/route-planner" className="btn btn-primary">Plan Route</Link>
            <Link to="/trips/new" className="btn btn-secondary">Create Trip</Link>
          </div>
        </div>
        <div className="route-command-panel">
          <div className="command-panel-header">
            <span>Planner modes</span>
            {demoMode && <strong>Demo Mode</strong>}
          </div>
          <div className="command-stat">
            <strong>{recentTrips.length}</strong>
            <span>Recent trips</span>
          </div>
          <div className="command-list">
            <span>Route Planner: stops along the drive</span>
            <span>Trip Recommendations: places near the stay</span>
            <span>Itinerary: scheduled activities and reservations</span>
            <span>Offline packet and calendar export</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <section className="usp-grid">
        <div className="usp-card">
          <span>01</span>
          <h3>Verified and estimated route stops</h3>
          <p>Known corridors use curated data; other routes use free open-map estimates with trust labels.</p>
        </div>
        <div className="usp-card">
          <span>02</span>
          <h3>Fatigue and late-arrival planning</h3>
          <p>Stop zones, overnight backups, and risk flags are built around the drive itself.</p>
        </div>
        <div className="usp-card">
          <span>03</span>
          <h3>Budget guardrails</h3>
          <p>Meal and motel options stay tied to the user’s budget rather than generic recommendations.</p>
        </div>
        <div className="usp-card">
          <span>04</span>
          <h3>Offline route packet</h3>
          <p>Every plan includes download guidance and fallback preparation for low-signal stretches.</p>
        </div>
      </section>

      <div className="dashboard-content">
        <div className="recent-trips">
          <h2>Recent Trips</h2>
          {recentTrips.length === 0 ? (
            <div className="empty-state">
              <p>No trips yet. Start planning your first adventure!</p>
              <Link to="/trips/new" className="btn btn-secondary">
                Create Your First Trip
              </Link>
            </div>
          ) : (
            <div className="trip-cards">
              {recentTrips.map((trip) => (
                <Link key={trip.tripId} to={`/trips/${trip.tripId}`} className="trip-card">
                  <div className="trip-card-header">
                    <h3>{trip.title}</h3>
                    <span className={`status ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </div>
                  <div className="trip-card-body">
                    <p className="destination">📍 {trip.destination}</p>
                    <p className="dates">
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </p>
                    <p className="travelers">👥 {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-cards">
            <Link to="/trips/new" className="action-card">
              <div className="action-icon">01</div>
              <h3>Plan New Trip</h3>
              <p>Create the destination, dates, budget, and preferences for a saved trip.</p>
            </Link>
            
            <Link to="/trips" className="action-card">
              <div className="action-icon">02</div>
              <h3>View All Trips</h3>
              <p>Manage your existing travel plans</p>
            </Link>
            
            <Link to="/ai-recommendations" className="action-card">
              <div className="action-icon">03</div>
              <h3>Trip Recommendations</h3>
              <p>Find accommodations, restaurants, and activities near a destination.</p>
            </Link>

            <Link to="/route-planner" className="action-card">
              <div className="action-icon">04</div>
              <h3>Route Planner</h3>
              <p>Build drive-corridor stops, meals, motels, and calendar export.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
