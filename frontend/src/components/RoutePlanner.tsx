<<<<<<< Current (Your changes)
=======
import React, { useState } from 'react';
import { post } from '../utils/api';
import './RoutePlanner.css';

interface RouteStop {
  id: string;
  name: string;
  category: string;
  type: string;
  description: string;
  coordinates: { lat: number; lng: number };
  address?: string;
  detourTime: number;
  estimatedTimeAtStop: number;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  priceEstimate?: number;
  currency?: string;
  budgetFit?: string;
  verificationStatus: string;
  openHours?: string;
  amenities?: string[];
  distanceFromStart: number;
}

interface StopOptionSet {
  setId: string;
  label: string;
  distanceRange: { from: number; to: number };
  pois: RouteStop[];
  restaurants: RouteStop[];
  motels: RouteStop[];
}

interface RouteResponse {
  inputsRecognized: any;
  routeSummary: {
    origin: string;
    destination: string;
    totalDistance: number;
    estimatedDriveTime: number;
    suggestedStops: number;
    majorCities: string[];
  };
  stopOptionSets: StopOptionSet[];
  topRatedMotels: RouteStop[];
  budgetFriendlyMotels: RouteStop[];
  offlineMapPlan: {
    corridorWidth: number;
    regions: any[];
    instructions: string[];
    estimatedDownloadSize?: string;
  };
  calendarExportReady: boolean;
  userChoicePrompt: string;
}

const RoutePlanner: React.FC = () => {
  const [origin, setOrigin] = useState('Los Angeles');
  const [destination, setDestination] = useState('San Francisco');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('08:00');
  const [travelers, setTravelers] = useState(2);
  const [motelBudget, setMotelBudget] = useState(80);
  const [mealBudget, setMealBudget] = useState(15);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routePlan, setRoutePlan] = useState<RouteResponse | null>(null);
  
  const [selectedPois, setSelectedPois] = useState<string[]>([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
  const [selectedMotel, setSelectedMotel] = useState<string>('');
  
  const [finalItinerary, setFinalItinerary] = useState<any>(null);

  const handlePlanRoute = async () => {
    setLoading(true);
    setError(null);
    setRoutePlan(null);
    setFinalItinerary(null);
    
    try {
      const result = await post<RouteResponse>('/route/plan', {
        origin,
        destination,
        departureDate: departureDate || new Date().toISOString().split('T')[0],
        departureTime,
        travelers,
        budget: {
          motelPerNight: motelBudget,
          mealBudget: mealBudget
        },
        preferences: {
          stopFrequency: 'moderate'
        },
        needsOfflineMaps: true
      });
      
      if (result.success && result.data) {
        setRoutePlan(result.data);
      } else {
        setError(result.error || 'Failed to plan route');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to plan route');
    } finally {
      setLoading(false);
    }
  };

  const togglePoi = (id: string) => {
    setSelectedPois(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleRestaurant = (id: string) => {
    setSelectedRestaurants(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleFinalize = async () => {
    if (!routePlan) return;
    
    setLoading(true);
    try {
      const result = await post<any>('/route/finalize', {
        routeRequest: {
          origin,
          destination,
          departureDate: departureDate || new Date().toISOString().split('T')[0],
          travelers,
          budget: { motelPerNight: motelBudget, mealBudget }
        },
        selections: {
          routeId: 'route-1',
          selectedPois,
          selectedRestaurants,
          selectedMotel,
          departureTime
        }
      });
      
      if (result.success && result.data) {
        setFinalItinerary(result.data);
      } else {
        setError(result.error || 'Failed to generate itinerary');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCalendar = async () => {
    if (!finalItinerary) return;
    
    try {
      const result = await post<any>('/route/export-calendar', {
        events: finalItinerary.calendarEvents,
        tripTitle: `${origin} to ${destination} Road Trip`
      });
      
      if (result.success && result.data) {
        // Download ICS file
        const blob = new Blob([result.data.icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export calendar:', err);
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="badge verified">✓ Verified</span>;
      case 'partially-verified':
        return <span className="badge partial">⚠ Partially Verified</span>;
      default:
        return <span className="badge unverified">✗ Not Verified</span>;
    }
  };

  const getBudgetBadge = (budgetFit?: string) => {
    switch (budgetFit) {
      case 'within-budget':
        return <span className="badge budget-ok">💰 Within Budget</span>;
      case 'slightly-above':
        return <span className="badge budget-warn">💸 Slightly Above</span>;
      case 'above-budget':
        return <span className="badge budget-over">❌ Above Budget</span>;
      default:
        return <span className="badge budget-unknown">❓ Price Unknown</span>;
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="route-planner">
      <header className="planner-header">
        <h1>🚗 DayMate Route Planner</h1>
        <p>AI-powered route-based travel assistant with verified stops</p>
      </header>

      {/* Route Input Form */}
      <section className="route-form">
        <h2>📍 Plan Your Route</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Origin</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g., Los Angeles"
            />
          </div>
          <div className="form-arrow">→</div>
          <div className="form-group">
            <label>Destination</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g., San Francisco"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Departure Date</label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Departure Time</label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Travelers</label>
            <input
              type="number"
              min="1"
              max="10"
              value={travelers}
              onChange={(e) => setTravelers(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Motel Budget (per night)</label>
            <div className="input-with-prefix">
              <span>$</span>
              <input
                type="number"
                value={motelBudget}
                onChange={(e) => setMotelBudget(parseInt(e.target.value))}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Meal Budget (per meal)</label>
            <div className="input-with-prefix">
              <span>$</span>
              <input
                type="number"
                value={mealBudget}
                onChange={(e) => setMealBudget(parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <button 
          className="btn-primary plan-btn"
          onClick={handlePlanRoute}
          disabled={loading}
        >
          {loading ? 'Planning...' : '🗺️ Plan My Route'}
        </button>
      </section>

      {error && <div className="error-message">{error}</div>}

      {/* Route Summary */}
      {routePlan && (
        <>
          <section className="route-summary">
            <h2>📊 Route Summary</h2>
            <div className="summary-cards">
              <div className="summary-card">
                <span className="label">Total Distance</span>
                <span className="value">{routePlan.routeSummary.totalDistance} miles</span>
              </div>
              <div className="summary-card">
                <span className="label">Drive Time</span>
                <span className="value">{formatDuration(routePlan.routeSummary.estimatedDriveTime)}</span>
              </div>
              <div className="summary-card">
                <span className="label">Suggested Stops</span>
                <span className="value">{routePlan.routeSummary.suggestedStops}</span>
              </div>
            </div>
            <div className="route-cities">
              <strong>Route:</strong> {routePlan.routeSummary.majorCities.join(' → ')}
            </div>
          </section>

          {/* Stop Option Sets */}
          {routePlan.stopOptionSets.map((optionSet) => (
            <section key={optionSet.setId} className="stop-options">
              <h3>📍 {optionSet.label}</h3>
              <p className="distance-range">
                Distance: {optionSet.distanceRange.from} - {optionSet.distanceRange.to} miles from start
              </p>

              {/* POIs */}
              {optionSet.pois.length > 0 && (
                <div className="stop-category">
                  <h4>🏛️ Places to Explore</h4>
                  <div className="stops-grid">
                    {optionSet.pois.map((poi) => (
                      <div
                        key={poi.id}
                        className={`stop-card ${selectedPois.includes(poi.id) ? 'selected' : ''}`}
                        onClick={() => togglePoi(poi.id)}
                      >
                        <div className="stop-header">
                          <h5>{poi.name}</h5>
                          {getVerificationBadge(poi.verificationStatus)}
                        </div>
                        <p className="category">{poi.category}</p>
                        <p className="description">{poi.description}</p>
                        <div className="stop-meta">
                          <span>⏱️ {poi.detourTime} min detour</span>
                          <span>🕐 {poi.estimatedTimeAtStop} min at stop</span>
                        </div>
                        {poi.rating && (
                          <div className="rating">
                            ⭐ {poi.rating.toFixed(1)} ({poi.reviewCount} reviews)
                          </div>
                        )}
                        {poi.priceEstimate && (
                          <div className="price">
                            ${poi.priceEstimate} {getBudgetBadge(poi.budgetFit)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Restaurants */}
              {optionSet.restaurants.length > 0 && (
                <div className="stop-category">
                  <h4>🍽️ Food Stops</h4>
                  <div className="stops-grid">
                    {optionSet.restaurants.map((restaurant) => (
                      <div
                        key={restaurant.id}
                        className={`stop-card ${selectedRestaurants.includes(restaurant.id) ? 'selected' : ''}`}
                        onClick={() => toggleRestaurant(restaurant.id)}
                      >
                        <div className="stop-header">
                          <h5>{restaurant.name}</h5>
                          {getVerificationBadge(restaurant.verificationStatus)}
                        </div>
                        <p className="category">{restaurant.category} • {restaurant.priceRange}</p>
                        <p className="description">{restaurant.description}</p>
                        <div className="stop-meta">
                          <span>⏱️ {restaurant.detourTime} min detour</span>
                          <span>🕐 {restaurant.estimatedTimeAtStop} min meal</span>
                        </div>
                        {restaurant.rating && (
                          <div className="rating">
                            ⭐ {restaurant.rating.toFixed(1)} ({restaurant.reviewCount} reviews)
                          </div>
                        )}
                        <div className="price">
                          ~${restaurant.priceEstimate}/person {getBudgetBadge(restaurant.budgetFit)}
                        </div>
                        {restaurant.openHours && (
                          <div className="hours">🕐 {restaurant.openHours}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Motels in this set */}
              {optionSet.motels.length > 0 && (
                <div className="stop-category">
                  <h4>🏨 Overnight Options</h4>
                  <div className="stops-grid">
                    {optionSet.motels.map((motel) => (
                      <div
                        key={motel.id}
                        className={`stop-card ${selectedMotel === motel.id ? 'selected' : ''}`}
                        onClick={() => setSelectedMotel(motel.id)}
                      >
                        <div className="stop-header">
                          <h5>{motel.name}</h5>
                          {getVerificationBadge(motel.verificationStatus)}
                        </div>
                        <p className="category">{motel.category}</p>
                        <p className="description">{motel.description}</p>
                        <div className="stop-meta">
                          <span>⏱️ {motel.detourTime} min from route</span>
                        </div>
                        {motel.rating && (
                          <div className="rating">
                            ⭐ {motel.rating.toFixed(1)} ({motel.reviewCount} reviews)
                          </div>
                        )}
                        <div className="price">
                          ${motel.priceEstimate}/night {getBudgetBadge(motel.budgetFit)}
                        </div>
                        {motel.amenities && (
                          <div className="amenities">
                            {motel.amenities.join(' • ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ))}

          {/* Top Rated vs Budget Motels */}
          <section className="motel-comparison">
            <div className="motel-column">
              <h3>⭐ Top-Rated Motels</h3>
              {routePlan.topRatedMotels.map((motel) => (
                <div
                  key={motel.id}
                  className={`motel-card ${selectedMotel === motel.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMotel(motel.id)}
                >
                  <h5>{motel.name}</h5>
                  <p>⭐ {motel.rating?.toFixed(1)} ({motel.reviewCount} reviews)</p>
                  <p>${motel.priceEstimate}/night • {motel.detourTime} min detour</p>
                  {getVerificationBadge(motel.verificationStatus)}
                </div>
              ))}
            </div>
            <div className="motel-column">
              <h3>💰 Budget-Friendly Motels</h3>
              {routePlan.budgetFriendlyMotels.map((motel) => (
                <div
                  key={motel.id}
                  className={`motel-card ${selectedMotel === motel.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMotel(motel.id)}
                >
                  <h5>{motel.name}</h5>
                  <p>${motel.priceEstimate}/night {getBudgetBadge(motel.budgetFit)}</p>
                  <p>⭐ {motel.rating?.toFixed(1)} • {motel.detourTime} min detour</p>
                  {getVerificationBadge(motel.verificationStatus)}
                </div>
              ))}
            </div>
          </section>

          {/* Offline Map Plan */}
          <section className="offline-maps">
            <h3>📴 Offline Maps Plan</h3>
            <div className="offline-info">
              <p><strong>Corridor Width:</strong> {routePlan.offlineMapPlan.corridorWidth} miles</p>
              <p><strong>Estimated Download:</strong> {routePlan.offlineMapPlan.estimatedDownloadSize}</p>
            </div>
            <div className="instructions">
              <h4>Download Instructions:</h4>
              <ul>
                {routePlan.offlineMapPlan.instructions.map((instruction, idx) => (
                  <li key={idx}>{instruction}</li>
                ))}
              </ul>
            </div>
            <div className="regions">
              <h4>Regions to Download:</h4>
              <ul>
                {routePlan.offlineMapPlan.regions.map((region, idx) => (
                  <li key={idx}>{region.name} ({region.radius} mile radius)</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Selection Summary & Finalize */}
          <section className="selection-summary">
            <h3>✅ Your Selections</h3>
            <div className="selections">
              <p><strong>POIs:</strong> {selectedPois.length} selected</p>
              <p><strong>Restaurants:</strong> {selectedRestaurants.length} selected</p>
              <p><strong>Motel:</strong> {selectedMotel ? '1 selected' : 'None selected'}</p>
            </div>
            <button
              className="btn-primary finalize-btn"
              onClick={handleFinalize}
              disabled={loading || selectedPois.length === 0}
            >
              {loading ? 'Generating...' : '📅 Generate Final Itinerary'}
            </button>
          </section>
        </>
      )}

      {/* Final Itinerary */}
      {finalItinerary && (
        <section className="final-itinerary">
          <h2>📅 Your Final Itinerary</h2>
          
          <div className="cost-summary">
            <h4>💵 Total Estimated Cost: ${finalItinerary.totalEstimatedCost.amount}</h4>
            <div className="cost-breakdown">
              <span>🏨 Motels: ${finalItinerary.totalEstimatedCost.breakdown.motels}</span>
              <span>🍽️ Meals: ${finalItinerary.totalEstimatedCost.breakdown.meals}</span>
              <span>🎯 Activities: ${finalItinerary.totalEstimatedCost.breakdown.activities}</span>
              <span>⛽ Gas: ${finalItinerary.totalEstimatedCost.breakdown.gas}</span>
            </div>
          </div>

          <div className="calendar-events">
            <h4>📆 Calendar Events</h4>
            {finalItinerary.calendarEvents.map((event: any) => (
              <div key={event.id} className={`event-card ${event.type}`}>
                <div className="event-time">
                  {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="event-details">
                  <h5>{event.title}</h5>
                  <p>{event.description}</p>
                  {event.location && <span className="location">📍 {event.location}</span>}
                </div>
              </div>
            ))}
          </div>

          <button className="btn-secondary export-btn" onClick={handleExportCalendar}>
            📥 Export to Calendar (.ics)
          </button>
        </section>
      )}
    </div>
  );
};

export default RoutePlanner;


>>>>>>> Incoming (Background Agent changes)
