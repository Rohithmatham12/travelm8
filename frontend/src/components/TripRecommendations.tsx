import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get, post } from '../utils/api';
import { Trip } from '../types/trip';

interface Recommendation {
  title: string;
  description: string;
  price: number;
  rating?: number;
  duration?: number;
  time?: string;
  category?: string;
  cuisine?: string;
  location?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  amenities?: string[];
  bookingUrl?: string;
  reservationUrl?: string;
  openingHours?: string;
  bookingRequired?: boolean;
}

interface ItineraryDay {
  day: number;
  date: string;
  activities: Recommendation[];
}

interface RecommendationData {
  destination: string;
  duration: number;
  recommendations: {
    accommodations: Recommendation[];
    activities: Recommendation[];
    restaurants: Recommendation[];
  };
  itinerary: ItineraryDay[];
  totalEstimatedCost: number;
  budgetBreakdown?: {
    accommodation: number;
    food: number;
    activities: number;
    transport: number;
  };
  tips: string[];
}

const TripRecommendations: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [tripData, setTripData] = useState<any>(null);

  useEffect(() => {
    if (tripId) {
      loadTripAndGenerateRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const loadTripAndGenerateRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get the trip data
      const tripResult = await get<Trip>(`/trips/${tripId}`);

      if (!tripResult.success || !tripResult.data) {
        throw new Error(tripResult.error || 'Failed to load trip');
      }

      const trip = tripResult.data;
      setTripData(trip);

      // Now generate AI recommendations based on trip data
      const recommendationRequest = {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        travelers: trip.travelers,
        budget: trip.budget,
        budgetLevel: trip.preferences?.budgetLevel || 'mid-range',
        preferences: trip.preferences || {}
      };

      const result = await post<RecommendationData>('/recommendations', recommendationRequest);

      if (result.success && result.data) {
        setRecommendations(result.data);
      } else {
        setError(result.error || 'Failed to generate recommendations');
      }
    } catch (err: any) {
      console.error('Error generating recommendations:', err);
      setError(err.message || 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '⭐' : '');
  };

  if (loading) {
    return (
      <div className="trip-recommendations">
        <div className="ai-loading">
          <div className="loading-spinner">🤖</div>
          <h2>AI is crafting your perfect trip...</h2>
          <p>Analyzing your preferences and generating personalized recommendations</p>
          <div className="loading-dots">
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trip-recommendations">
        <div className="error-message">
          <h2>❌ Failed to Generate Recommendations</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={loadTripAndGenerateRecommendations} className="btn btn-primary">
              Try Again
            </button>
            <button onClick={() => navigate(`/trips/${tripId}`)} className="btn btn-secondary">
              View Trip Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="trip-recommendations">
        <div className="no-recommendations">
          <h2>No recommendations available</h2>
          <button onClick={() => navigate(`/trips/${tripId}`)} className="btn btn-secondary">
            Back to Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-recommendations">
      <div className="recommendations-header">
        <div className="header-content">
          <h1>🤖 AI Travel Recommendations</h1>
          <div className="trip-info">
            <h2>{tripData?.title || recommendations.destination}</h2>
            <p>{recommendations.duration} days • {recommendations.destination}</p>
            <div className="cost-breakdown">
              <div className="total-cost">
                <strong>Total Estimated Cost: {formatCurrency(recommendations.totalEstimatedCost)}</strong>
              </div>
              {recommendations.budgetBreakdown && (
                <div className="budget-details">
                  <div className="budget-item">🏨 Accommodation: {formatCurrency(recommendations.budgetBreakdown.accommodation)}</div>
                  <div className="budget-item">🍽️ Food: {formatCurrency(recommendations.budgetBreakdown.food)}</div>
                  <div className="budget-item">🎯 Activities: {formatCurrency(recommendations.budgetBreakdown.activities)}</div>
                  <div className="budget-item">🚗 Transport: {formatCurrency(recommendations.budgetBreakdown.transport)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate(`/trips/${tripId}`)} className="btn btn-secondary">
            View Trip Details
          </button>
          <button onClick={() => navigate(`/trips/${tripId}/edit`)} className="btn btn-primary">
            Customize Trip
          </button>
        </div>
      </div>

      <div className="recommendations-content">
        {/* Accommodations */}
        <section className="recommendation-section">
          <h3>🏨 Recommended Accommodations</h3>
          <div className="recommendations-grid">
            {recommendations.recommendations.accommodations.map((accommodation, index) => (
              <div key={index} className="recommendation-card enhanced">
                <div className="card-header">
                  <h4>{accommodation.title}</h4>
                  {accommodation.coordinates && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${accommodation.coordinates.lat},${accommodation.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="map-link"
                    >
                      🗺️ Map
                    </a>
                  )}
                </div>
                <p>{accommodation.description}</p>
                {accommodation.address && (
                  <div className="address">📍 {accommodation.address}</div>
                )}
                {accommodation.amenities && (
                  <div className="amenities">
                    <strong>Amenities:</strong> {accommodation.amenities.join(', ')}
                  </div>
                )}
                <div className="recommendation-meta">
                  <span className="price">{formatCurrency(accommodation.price)}/night</span>
                  {accommodation.rating && (
                    <span className="rating">{renderStars(accommodation.rating)} {accommodation.rating}</span>
                  )}
                  {accommodation.bookingUrl && (
                    <a
                      href={accommodation.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="booking-link"
                    >
                      🏨 Book Now
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Activities */}
        <section className="recommendation-section">
          <h3>🎯 Recommended Activities</h3>
          <div className="recommendations-grid">
            {recommendations.recommendations.activities.map((activity, index) => (
              <div key={index} className="recommendation-card enhanced">
                <div className="card-header">
                  <h4>{activity.title}</h4>
                  {activity.coordinates && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${activity.coordinates.lat},${activity.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="map-link"
                    >
                      🗺️ Map
                    </a>
                  )}
                </div>
                <p>{activity.description}</p>
                {activity.address && (
                  <div className="address">📍 {activity.address}</div>
                )}
                {activity.openingHours && (
                  <div className="hours">🕒 {activity.openingHours}</div>
                )}
                <div className="recommendation-meta">
                  <span className="price">{formatCurrency(activity.price)}</span>
                  {activity.duration && (
                    <span className="duration">⏱️ {Math.floor(activity.duration / 60)}h {activity.duration % 60}m</span>
                  )}
                  {activity.category && (
                    <span className="category">#{activity.category}</span>
                  )}
                  {activity.bookingRequired && (
                    <span className="booking-required">📝 Booking Required</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Restaurants */}
        <section className="recommendation-section">
          <h3>🍽️ Recommended Restaurants</h3>
          <div className="recommendations-grid">
            {recommendations.recommendations.restaurants.map((restaurant, index) => (
              <div key={index} className="recommendation-card enhanced">
                <div className="card-header">
                  <h4>{restaurant.title}</h4>
                  {restaurant.coordinates && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${restaurant.coordinates.lat},${restaurant.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="map-link"
                    >
                      🗺️ Map
                    </a>
                  )}
                </div>
                <p>{restaurant.description}</p>
                {restaurant.address && (
                  <div className="address">📍 {restaurant.address}</div>
                )}
                {restaurant.openingHours && (
                  <div className="hours">🕒 {restaurant.openingHours}</div>
                )}
                <div className="recommendation-meta">
                  <span className="price">{formatCurrency(restaurant.price)} avg/person</span>
                  {restaurant.rating && (
                    <span className="rating">{renderStars(restaurant.rating)} {restaurant.rating}</span>
                  )}
                  {restaurant.cuisine && (
                    <span className="cuisine">🍴 {restaurant.cuisine}</span>
                  )}
                  {restaurant.reservationUrl && (
                    <a
                      href={restaurant.reservationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="booking-link"
                    >
                      🍽️ Reserve
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI-Generated Itinerary */}
        <section className="recommendation-section">
          <h3>📅 AI-Generated Itinerary</h3>
          <div className="itinerary-timeline">
            {recommendations.itinerary.map((day, index) => (
              <div key={index} className="itinerary-day">
                <div className="day-header">
                  <h4>Day {day.day}</h4>
                  <span className="day-date">{new Date(day.date).toLocaleDateString()}</span>
                </div>
                <div className="day-activities">
                  {day.activities.map((activity, actIndex) => (
                    <div key={actIndex} className="itinerary-activity">
                      <div className="activity-time">
                        {actIndex === 0 ? '9:00 AM' : '2:00 PM'}
                      </div>
                      <div className="activity-details">
                        <h5>{activity.title}</h5>
                        <p>{activity.description}</p>
                        <span className="activity-price">{formatCurrency(activity.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Travel Tips */}
        <section className="recommendation-section">
          <h3>💡 AI Travel Tips</h3>
          <div className="tips-list">
            {recommendations.tips.map((tip, index) => (
              <div key={index} className="tip-item">
                <span className="tip-icon">💡</span>
                <p>{tip}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="recommendations-actions">
        <button onClick={() => navigate('/trips')} className="btn btn-secondary">
          All Trips
        </button>
        <button onClick={loadTripAndGenerateRecommendations} className="btn btn-secondary">
          🔄 Regenerate
        </button>
        <button onClick={() => navigate(`/trips/${tripId}/itinerary`)} className="btn btn-primary">
          Build Itinerary
        </button>
      </div>
    </div>
  );
};

export default TripRecommendations;
