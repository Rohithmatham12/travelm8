import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trip } from '../types/trip';
import { get, del } from '../utils/api';
import { toast } from '../utils/toast';

const TripListSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
    {[1,2,3,4].map(i => (
      <div key={i} className="skeleton-row">
        <div className="skeleton" style={{ height: 18, width: `${40 + i * 10}%`, borderRadius: 6 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <div className="skeleton" style={{ height: 13, width: 80, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 13, width: 60, borderRadius: 4 }} />
        </div>
      </div>
    ))}
  </div>
);

const TripList: React.FC = () => {
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const response = await get<{ trips: Trip[]; nextToken?: string }>('/trips?limit=50');
      if (response.success && response.data) {
        const loadedTrips = response.data.trips || [];
        setAllTrips(loadedTrips);
        setTrips(statusFilter === 'all' ? loadedTrips : loadedTrips.filter(t => t.status === statusFilter));
      } else {
        toast.error(response.error || 'Failed to load trips');
      }
    } catch {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const handleDelete = async (e: React.MouseEvent, tripId: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(tripId);
    try {
      const res = await del(`/trips/${tripId}`);
      if (res.success) {
        setAllTrips(prev => prev.filter(t => t.tripId !== tripId));
        setTrips(prev => prev.filter(t => t.tripId !== tripId));
        toast.success('Trip deleted');
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':     return 'status-draft';
      case 'planning':  return 'status-planning';
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default:          return 'status-draft';
    }
  };

  const statusCounts = allTrips.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, { all: allTrips.length } as Record<string, number>);

  if (loading) {
    return (
      <div className="trip-list">
        <div className="trip-list-header">
          <h1>My Trips</h1>
          <Link to="/trips/new" className="btn btn-primary">New Trip</Link>
        </div>
        <TripListSkeleton />
      </div>
    );
  }

  return (
    <div className="trip-list">
      <div className="trip-list-header">
        <h1>My Trips</h1>
        <Link to="/trips/new" className="btn btn-primary">New Trip</Link>
      </div>

      <div className="trip-filters">
        <div className="filter-buttons">
          {(['all', 'draft', 'planning', 'confirmed', 'completed', 'cancelled'] as const).map(s => (
            <button
              key={s}
              className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} ({statusCounts[s] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✈️</div>
          <h2>No trips found</h2>
          <p>
            {statusFilter === 'all'
              ? "You haven't created any trips yet. Start planning your first adventure!"
              : `No trips with status "${statusFilter}" found.`}
          </p>
          <Link to="/trips/new" className="btn btn-primary">Create Your First Trip</Link>
        </div>
      ) : (
        <div className="trip-grid">
          {trips.map(trip => (
            <div key={trip.tripId} style={{ position: 'relative' }}>
              <Link to={`/trips/${trip.tripId}`} className="trip-card">
                <div className="trip-card-header">
                  <h3>{trip.title}</h3>
                  <span className={`status ${getStatusColor(trip.status)}`}>{trip.status}</span>
                </div>
                <div className="trip-card-body">
                  <p className="destination">📍 {trip.destination}</p>
                  <p className="dates">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
                  <p className="travelers">👥 {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}</p>
                  {trip.budget && <p className="budget">💰 {trip.currency || 'USD'} {trip.budget.toLocaleString()}</p>}
                  {trip.description && <p className="description">{trip.description}</p>}
                </div>
                <div className="trip-card-footer">
                  <span className="created-date">Created {formatDate(trip.createdAt)}</span>
                </div>
              </Link>
              <button
                className="tl-del-btn"
                onClick={e => handleDelete(e, trip.tripId, trip.title)}
                disabled={deletingId === trip.tripId}
                title="Delete trip"
                aria-label={`Delete ${trip.title}`}
              >
                {deletingId === trip.tripId ? '…' : '🗑'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripList;
