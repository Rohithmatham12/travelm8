import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trip } from '../types/trip';
import { get, del } from '../utils/api';
import { toast } from '../utils/toast';
import './TripList.css';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', planning: 'Planning', confirmed: 'Confirmed',
  completed: 'Completed', cancelled: 'Cancelled',
};

const TripListSkeleton = () => (
  <div className="tl-grid">
    {[1,2,3,4,5,6].map(i => (
      <div key={i} className="tl-skeleton">
        <div className="skeleton" style={{ height: 18, width: '70%', borderRadius: 6, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 13, width: '50%', borderRadius: 4, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 13, width: '40%', borderRadius: 4 }} />
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
      const r = await get<{ trips: Trip[] }>('/trips?limit=50');
      if (r.success && r.data) {
        const loaded = r.data.trips || [];
        setAllTrips(loaded);
        setTrips(statusFilter === 'all' ? loaded : loaded.filter(t => t.status === statusFilter));
      } else {
        toast.error(r.error || 'Failed to load trips');
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
    if (!window.confirm(`Delete "${title}"?`)) return;
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

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const counts = allTrips.reduce(
    (acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; },
    { all: allTrips.length } as Record<string, number>
  );

  if (loading) {
    return (
      <div className="tl-page">
        <div className="tl-header">
          <h1 className="tl-title">My Trips</h1>
          <Link to="/trips/new" className="btn btn-primary">+ New Trip</Link>
        </div>
        <TripListSkeleton />
      </div>
    );
  }

  return (
    <div className="tl-page">
      <div className="tl-header">
        <h1 className="tl-title">My Trips</h1>
        <Link to="/trips/new" className="btn btn-primary">+ New Trip</Link>
      </div>

      {/* Filter pills */}
      <div className="tl-filters" role="group" aria-label="Filter trips by status">
        {(['all', 'planning', 'confirmed', 'completed', 'draft', 'cancelled'] as const).map(s => (
          <button
            key={s}
            className={`tl-filter${statusFilter === s ? ' tl-filter-active' : ''}`}
            onClick={() => setStatusFilter(s)}
            aria-pressed={statusFilter === s}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]} {counts[s] ? <span className="tl-count">{counts[s]}</span> : null}
          </button>
        ))}
      </div>

      {trips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <h2>No trips yet</h2>
          <p>{statusFilter === 'all' ? 'Start planning your first road trip.' : `No ${STATUS_LABELS[statusFilter]?.toLowerCase()} trips.`}</p>
          <Link to="/trips/new" className="btn btn-primary">Create a trip</Link>
        </div>
      ) : (
        <div className="tl-grid">
          {trips.map(trip => (
            <div key={trip.tripId} className="tl-card-wrap">
              <Link to={`/trips/${trip.tripId}`} className={`tl-card tl-card-${trip.status}`}>
                <div className="tl-card-top">
                  <span className={`tl-status tl-status-${trip.status}`}>{STATUS_LABELS[trip.status] || trip.status}</span>
                  <span className="tl-travelers">👥 {trip.travelers}</span>
                </div>
                <h3 className="tl-card-title">{trip.title}</h3>
                <p className="tl-card-dest">📍 {trip.destination}</p>
                <p className="tl-card-dates">{fmtDate(trip.startDate)} – {fmtDate(trip.endDate)}</p>
              </Link>
              <button
                className="tl-del"
                onClick={e => handleDelete(e, trip.tripId, trip.title)}
                disabled={deletingId === trip.tripId}
                aria-label={`Delete ${trip.title}`}
              >
                {deletingId === trip.tripId ? '…' : '×'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripList;
