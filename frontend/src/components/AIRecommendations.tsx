import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../utils/api';

interface Recommendation {
  title: string;
  description: string;
  price?: {
    amount: number;
    currency: string;
    perPerson?: boolean;
  };
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
  source?: string;
  verificationNote?: string;
}

interface ItineraryDay {
  dayNumber: number;
  date: string;
  activities: Recommendation[];
  meals: Recommendation[];
  accommodation?: Recommendation;
  transport?: Recommendation[];
  estimatedCost: {
    amount: number;
    currency: string;
  };
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
  totalEstimatedCost: {
    amount: number;
    currency: string;
  };
  budgetBreakdown?: {
    accommodation: number;
    food: number;
    activities: number;
    transport: number;
  };
  tips: string[];
}

const AIRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [formData, setFormData] = useState({
    destination: 'Tokyo',
    duration: 7,
    travelers: 2,
    budget: 5000,
    budgetLevel: 'mid-range',
    preferences: {
      interests: ['sightseeing', 'food', 'culture'],
      accommodationType: 'hotel',
      transportMode: 'public'
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: value
      }
    }));
  };

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const recommendationRequest = {
        destination: formData.destination,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + formData.duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        travelers: formData.travelers,
        budget: formData.budget,
        budgetLevel: formData.budgetLevel,
        preferences: formData.preferences
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

  const formatCurrency = (amount: number | { amount: number; currency?: string } | undefined, currency: string = 'USD') => {
    const normalized = typeof amount === 'object' ? amount.amount : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: typeof amount === 'object' && amount.currency ? amount.currency : currency,
    }).format(Number.isFinite(normalized) ? normalized! : 0);
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '⭐' : '');
  };

  if (loading) {
    return (
      <div className="ai-recommendations">
        <div className="ai-loading">
          <div className="loading-spinner">TM8</div>
          <h2>Building destination recommendations...</h2>
          <p>Matching stays, meals, and activities to your destination, budget, and preferences.</p>
          <div className="loading-dots">
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-recommendations">
        <div className="error-message">
          <h2>❌ Failed to Generate Recommendations</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={generateRecommendations} className="btn btn-primary">
              Try Again
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (recommendations) {
    return (
      <div className="ai-recommendations">
        <div className="recommendations-header">
          <div className="header-content">
            <span className="section-kicker">Trip Recommendations</span>
            <h1>Destination ideas for your stay</h1>
            <div className="trip-info">
              <h2>{recommendations.destination}</h2>
              <p>{recommendations.duration} days • {formData.travelers} travelers</p>
              <p>
                These picks are near the destination. Use Route Planner for meals, stops, and
                motels along the drive from an origin.
              </p>
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
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              Back to Dashboard
            </button>
            <button onClick={() => navigate('/trips/new')} className="btn btn-primary">
              Create Trip
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
                    <span className="price">{formatCurrency(accommodation.price)}/night est.</span>
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
                    <span className="price">{formatCurrency(activity.price)} est.</span>
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
                    <span className="price">{formatCurrency(restaurant.price)} avg/person est.</span>
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

          {/* Suggested Itinerary */}
          <section className="recommendation-section">
            <h3>Suggested Itinerary</h3>
            <div className="itinerary-timeline">
              {recommendations.itinerary.map((day, index) => (
                <div key={index} className="itinerary-day">
                  <div className="day-header">
                    <h4>Day {day.dayNumber}</h4>
                    <span className="day-date">{new Date(day.date).toLocaleDateString()}</span>
                  </div>
                  <div className="day-activities">
                    {day.activities.map((activity, actIndex) => (
                      <div key={actIndex} className="itinerary-activity">
                        <div className="activity-time">
                          {activity.time || (actIndex === 0 ? '9:00 AM' : '2:00 PM')}
                        </div>
                        <div className="activity-details">
                          <h5>{activity.title}</h5>
                          <p>{activity.description}</p>
                          <span className="activity-price">{formatCurrency(activity.price)}</span>
                        </div>
                      </div>
                    ))}
                    {day.meals.map((meal, mealIndex) => (
                      <div key={`meal-${mealIndex}`} className="itinerary-activity">
                        <div className="activity-time">{mealIndex === 0 ? '12:30 PM' : '7:00 PM'}</div>
                        <div className="activity-details">
                          <h5>{meal.title}</h5>
                          <p>{meal.description}</p>
                          <span className="activity-price">{formatCurrency(meal.price)}</span>
                        </div>
                      </div>
                    ))}
                    {day.accommodation && (
                      <div className="itinerary-activity">
                        <div className="activity-time">Evening</div>
                        <div className="activity-details">
                          <h5>{day.accommodation.title}</h5>
                          <p>{day.accommodation.description}</p>
                          <span className="activity-price">{formatCurrency(day.accommodation.price)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Travel Tips */}
          <section className="recommendation-section">
            <h3>Travel Tips</h3>
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
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Back to Dashboard
          </button>
          <button onClick={generateRecommendations} className="btn btn-secondary">
            🔄 Regenerate
          </button>
          <button onClick={() => navigate('/trips/new')} className="btn btn-primary">
            Create Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-recommendations">
      <div className="recommendations-form">
        <div className="form-header">
          <h1>Trip Recommendations</h1>
          <p>Find places near a destination. Use Route Planner for stops along a drive.</p>
        </div>

        <div className="form-content">
          <div className="form-group">
            <label htmlFor="destination">Destination</label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              placeholder="e.g., Tokyo, Paris, New York"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duration (days)</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                max="30"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="travelers">Travelers</label>
              <input
                type="number"
                id="travelers"
                name="travelers"
                value={formData.travelers}
                onChange={handleInputChange}
                min="1"
                max="10"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="budget">Budget (USD)</label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              min="100"
              step="100"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="budgetLevel">Budget Level</label>
            <select
              id="budgetLevel"
              name="budgetLevel"
              value={formData.budgetLevel}
              onChange={handleInputChange}
            >
              <option value="budget">Budget</option>
              <option value="mid-range">Mid-Range</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="accommodationType">Accommodation Type</label>
            <select
              id="accommodationType"
              name="accommodationType"
              value={formData.preferences.accommodationType}
              onChange={handlePreferenceChange}
            >
              <option value="hotel">Hotel</option>
              <option value="hostel">Hostel</option>
              <option value="airbnb">Airbnb</option>
              <option value="resort">Resort</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="transportMode">Transport Mode</label>
            <select
              id="transportMode"
              name="transportMode"
              value={formData.preferences.transportMode}
              onChange={handlePreferenceChange}
            >
              <option value="public">Public Transport</option>
              <option value="rental">Car Rental</option>
              <option value="taxi">Taxi/Rideshare</option>
              <option value="walking">Walking</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Back to Dashboard
          </button>
          <button onClick={generateRecommendations} className="btn btn-primary">
            🤖 Generate AI Recommendations
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
