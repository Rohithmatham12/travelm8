import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trip } from '../types/trip';
import { get } from '../utils/api';

const TripList: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      let path = '/trips?limit=50';
      
      if (statusFilter !== 'all') {
        path += `&status=${statusFilter}`;
      }
      
      const response = await get<{ trips: Trip[]; nextToken?: string }>(path);
      
      if (response.success && response.data) {
        const allTrips = response.data.trips || [];
        // Filter by status on client side if needed
        const filteredTrips = statusFilter === 'all' 
          ? allTrips 
          : allTrips.filter(trip => trip.status === statusFilter);
        setTrips(filteredTrips);
      } else {
        setError(response.error || 'Failed to load trips');
      }
    } catch (err) {
      console.error('Error loading trips:', err);
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadTrips();
  }, [statusFilter, loadTrips]);

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

  const getStatusCounts = () => {
    const counts = trips.reduce((acc, trip) => {
      acc[trip.status] = (acc[trip.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      all: trips.length,
      draft: counts.draft || 0,
      planning: counts.planning || 0,
      confirmed: counts.confirmed || 0,
      completed: counts.completed || 0,
      cancelled: counts.cancelled || 0,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="trip-list">
        <div className="loading">Loading trips...</div>
      </div>
    );
  }

  return (
    <div className="trip-list">
      <div className="trip-list-header">
        <h1>My Trips</h1>
        <Link to="/trips/new" className="btn btn-primary">
          New Trip
        </Link>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="trip-filters">
        <div className="filter-buttons">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
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
              : `No trips with status "${statusFilter}" found.`
            }
          </p>
          <Link to="/trips/new" className="btn btn-primary">
            Create Your First Trip
          </Link>
        </div>
      ) : (
        <div className="trip-grid">
          {trips.map((trip) => (
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
                
                {trip.budget && (
                  <p className="budget">
                    💰 {trip.currency || 'USD'} {trip.budget.toLocaleString()}
                  </p>
                )}
                
                {trip.description && (
                  <p className="description">{trip.description}</p>
                )}
              </div>
              
              <div className="trip-card-footer">
                <span className="created-date">
                  Created {formatDate(trip.createdAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripList;
