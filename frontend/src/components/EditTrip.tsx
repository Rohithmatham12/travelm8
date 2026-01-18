import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Trip, UpdateTripRequest, TripPreferences } from '../types/trip';
import { get, put } from '../utils/api';

interface FormData {
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  travelers: number;
  status: string;
  accommodationType: string;
  transportMode: string;
  activityTypes: string[];
  foodPreferences: string[];
  budgetLevel: string;
}

const EditTrip: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>();

  const watchedStartDate = watch('startDate');

  const loadTrip = useCallback(async () => {
    try {
      setLoading(true);
      const response = await get<Trip>(`/trips/${tripId}`);
      
      if (response.success && response.data) {
        const tripData = response.data;
        setTrip(tripData);
        
        // Populate form with existing data
        setValue('title', tripData.title);
        setValue('description', tripData.description || '');
        setValue('destination', tripData.destination);
        setValue('startDate', tripData.startDate);
        setValue('endDate', tripData.endDate);
        setValue('budget', tripData.budget || 0);
        setValue('currency', tripData.currency || 'USD');
        setValue('travelers', tripData.travelers);
        setValue('status', tripData.status);
        setValue('accommodationType', tripData.preferences?.accommodationType || 'any');
        setValue('transportMode', tripData.preferences?.transportMode || 'any');
        setValue('activityTypes', tripData.preferences?.activityTypes || []);
        setValue('foodPreferences', tripData.preferences?.foodPreferences || []);
        setValue('budgetLevel', tripData.preferences?.budgetLevel || 'mid-range');
      } else {
        setError(response.error || 'Failed to load trip');
      }
    } catch (err) {
      console.error('Error loading trip:', err);
      setError('Failed to load trip');
    } finally {
      setLoading(false);
    }
  }, [tripId, setValue]);

  useEffect(() => {
    if (tripId) {
      loadTrip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      setError(null);

      // Prepare preferences
      const preferences: TripPreferences = {
        accommodationType: data.accommodationType as any,
        transportMode: data.transportMode as any,
        activityTypes: data.activityTypes,
        foodPreferences: data.foodPreferences,
        budgetLevel: data.budgetLevel as any,
      };

      const updateRequest: UpdateTripRequest = {
        title: data.title,
        description: data.description || undefined,
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget || undefined,
        currency: data.currency,
        travelers: data.travelers,
        status: data.status as any,
        preferences,
      };

      const result = await put<Trip>(`/trips/${tripId}`, updateRequest);
      
      if (result.success) {
        navigate(`/trips/${tripId}`);
      } else {
        setError(result.error || 'Failed to update trip');
      }
    } catch (err: any) {
      console.error('Error updating trip:', err);
      setError(err.message || 'Failed to update trip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const activityOptions = [
    'sightseeing', 'adventure', 'relaxation', 'culture', 'food', 'nightlife',
    'nature', 'history', 'shopping', 'sports', 'photography', 'wellness'
  ];

  const foodOptions = [
    'vegetarian', 'vegan', 'local-cuisine', 'fine-dining', 'street-food',
    'seafood', 'meat-lover', 'spicy-food', 'desserts', 'wine-tasting'
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'planning', label: 'Planning' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  if (loading) {
    return (
      <div className="edit-trip">
        <div className="loading">Loading trip details...</div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="edit-trip">
        <div className="error-message">
          {error || 'Trip not found'}
        </div>
        <button onClick={() => navigate('/trips')} className="btn btn-secondary">
          Back to Trips
        </button>
      </div>
    );
  }

  return (
    <div className="edit-trip">
      <div className="edit-trip-header">
        <h1>Edit Trip: {trip.title}</h1>
        <p>Update your travel plans and preferences</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="trip-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="title">Trip Title *</label>
            <input
              type="text"
              id="title"
              {...register('title', { required: 'Trip title is required' })}
              className={errors.title ? 'error' : ''}
              placeholder="e.g., Summer Vacation in Paris"
            />
            {errors.title && <span className="error-text">{errors.title.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              placeholder="Tell us about your trip goals and interests..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="destination">Destination *</label>
            <input
              type="text"
              id="destination"
              {...register('destination', { required: 'Destination is required' })}
              className={errors.destination ? 'error' : ''}
              placeholder="e.g., Paris, France"
            />
            {errors.destination && <span className="error-text">{errors.destination.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                {...register('startDate', { required: 'Start date is required' })}
                className={errors.startDate ? 'error' : ''}
              />
              {errors.startDate && <span className="error-text">{errors.startDate.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date *</label>
              <input
                type="date"
                id="endDate"
                {...register('endDate', { 
                  required: 'End date is required',
                  validate: (value) => {
                    if (watchedStartDate && value <= watchedStartDate) {
                      return 'End date must be after start date';
                    }
                    return true;
                  }
                })}
                className={errors.endDate ? 'error' : ''}
              />
              {errors.endDate && <span className="error-text">{errors.endDate.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="travelers">Number of Travelers *</label>
              <input
                type="number"
                id="travelers"
                {...register('travelers', { 
                  required: 'Number of travelers is required',
                  min: { value: 1, message: 'At least 1 traveler required' },
                  max: { value: 20, message: 'Maximum 20 travelers' }
                })}
                className={errors.travelers ? 'error' : ''}
                min="1"
                max="20"
              />
              {errors.travelers && <span className="error-text">{errors.travelers.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" {...register('status')}>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="budget">Budget</label>
              <input
                type="number"
                id="budget"
                {...register('budget', { min: 0 })}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <select id="currency" {...register('currency')}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Preferences</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="accommodationType">Accommodation Type</label>
              <select id="accommodationType" {...register('accommodationType')}>
                <option value="any">Any</option>
                <option value="hotel">Hotel</option>
                <option value="hostel">Hostel</option>
                <option value="airbnb">Airbnb</option>
                <option value="resort">Resort</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="transportMode">Transport Mode</label>
              <select id="transportMode" {...register('transportMode')}>
                <option value="any">Any</option>
                <option value="flight">Flight</option>
                <option value="train">Train</option>
                <option value="bus">Bus</option>
                <option value="car">Car</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="budgetLevel">Budget Level</label>
              <select id="budgetLevel" {...register('budgetLevel')}>
                <option value="budget">Budget</option>
                <option value="mid-range">Mid-range</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Activity Types</label>
            <div className="checkbox-group">
              {activityOptions.map((activity) => (
                <label key={activity} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={activity}
                    {...register('activityTypes')}
                  />
                  <span>{activity}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Food Preferences</label>
            <div className="checkbox-group">
              {foodOptions.map((food) => (
                <label key={food} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={food}
                    {...register('foodPreferences')}
                  />
                  <span>{food}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(`/trips/${tripId}`)}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTrip;
