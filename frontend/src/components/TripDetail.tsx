import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trip } from '../types/trip';
import { get, del } from '../utils/api';

const TripDetail: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTrip = useCallback(async () => {
    try {
      setLoading(true);
      const response = await get<Trip>(`/trips/${tripId}`);
      
      if (response.success && response.data) {
        setTrip(response.data);
      } else {
        setError(response.error || 'Failed to load trip');
      }
    } catch (err) {
      console.error('Error loading trip:', err);
      setError('Failed to load trip');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (tripId) {
      loadTrip();
    }
  }, [tripId, loadTrip]);

  const handleDelete = async () => {
    if (!tripId || !window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await del(`/trips/${tripId}`);
      
      if (response.success) {
        navigate('/trips');
      } else {
        setError(response.error || 'Failed to delete trip');
      }
    } catch (err) {
      console.error('Error deleting trip:', err);
      setError('Failed to delete trip');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  const getDuration = () => {
    if (!trip) return 0;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <div className="trip-detail">
        <div className="loading">Loading trip details...</div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="trip-detail">
        <div className="error-message">
          {error || 'Trip not found'}
        </div>
        <Link to="/trips" className="btn btn-secondary">
          Back to Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="trip-detail">
      <div className="trip-detail-header">
        <div className="trip-header-content">
          <div className="trip-title-section">
            <h1>{trip.title}</h1>
            <span className={`status ${getStatusColor(trip.status)}`}>
              {trip.status}
            </span>
          </div>
          
          <div className="trip-actions">
            <Link to={`/trips/${trip.tripId}/edit`} className="btn btn-secondary">
              Edit Trip
            </Link>
            <Link to={`/trips/${trip.tripId}/itinerary`} className="btn btn-secondary">
              Manage Itinerary
            </Link>
            <Link to={`/trips/${trip.tripId}/recommendations`} className="btn btn-secondary">
              Destination Ideas
            </Link>
            <Link to={`/trips/${trip.tripId}/share`} className="btn btn-secondary">
              Share Trip
            </Link>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Trip'}
            </button>
          </div>
        </div>

        {trip.description && (
          <p className="trip-description">{trip.description}</p>
        )}
      </div>

      <div className="trip-detail-content">
        <div className="trip-info-grid">
          <div className="info-card">
            <h3>📍 Destination</h3>
            <p>{trip.destination}</p>
          </div>

          <div className="info-card">
            <h3>📅 Dates</h3>
            <p>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
            <p className="duration">{getDuration()} days</p>
          </div>

          <div className="info-card">
            <h3>👥 Travelers</h3>
            <p>{trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}</p>
          </div>

          {trip.budget && (
            <div className="info-card">
              <h3>💰 Budget</h3>
              <p>{trip.currency || 'USD'} {trip.budget.toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="trip-preferences">
          <h2>Preferences</h2>
          <div className="preferences-grid">
            {trip.preferences?.accommodationType && trip.preferences.accommodationType !== 'any' && (
              <div className="preference-item">
                <strong>Accommodation:</strong> {trip.preferences.accommodationType}
              </div>
            )}
            
            {trip.preferences?.transportMode && trip.preferences.transportMode !== 'any' && (
              <div className="preference-item">
                <strong>Transport:</strong> {trip.preferences.transportMode}
              </div>
            )}
            
            {trip.preferences?.budgetLevel && (
              <div className="preference-item">
                <strong>Budget Level:</strong> {trip.preferences.budgetLevel}
              </div>
            )}
            
            {trip.preferences?.activityTypes && trip.preferences.activityTypes.length > 0 && (
              <div className="preference-item">
                <strong>Activities:</strong> {trip.preferences.activityTypes.join(', ')}
              </div>
            )}
            
            {trip.preferences?.foodPreferences && trip.preferences.foodPreferences.length > 0 && (
              <div className="preference-item">
                <strong>Food:</strong> {trip.preferences.foodPreferences.join(', ')}
              </div>
            )}
          </div>
        </div>

        <div className="trip-itinerary">
          <h2>Itinerary</h2>
          {trip.itinerary && trip.itinerary.length > 0 ? (
            <div className="itinerary-list">
              {trip.itinerary.map((item) => (
                <div key={item.id} className="itinerary-item">
                  <div className="itinerary-item-header">
                    <h4>{item.title}</h4>
                    <span className={`item-status ${item.status}`}>
                      {item.status}
                    </span>
                  </div>
                  
                  <div className="itinerary-item-details">
                    <p className="item-date">{formatDate(item.date)}</p>
                    {item.time && <p className="item-time">🕐 {item.time}</p>}
                    {item.location && <p className="item-location">📍 {item.location}</p>}
                    {item.duration && <p className="item-duration">⏱️ {item.duration} minutes</p>}
                    {item.cost && <p className="item-cost">💰 {item.currency || 'USD'} {item.cost}</p>}
                    {item.description && <p className="item-description">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-itinerary">
              <p>No itinerary items yet. Start planning your activities!</p>
              <button className="btn btn-primary">
                Add Itinerary Item
              </button>
            </div>
          )}
        </div>

        <div className="trip-meta">
          <p className="created-date">
            Created: {formatDate(trip.createdAt)}
          </p>
          <p className="updated-date">
            Last updated: {formatDate(trip.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
