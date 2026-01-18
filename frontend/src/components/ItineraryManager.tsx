import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Trip, ItineraryItem } from '../types/trip';
import { get, put } from '../utils/api';

interface ItineraryFormData {
  date: string;
  time: string;
  type: string;
  title: string;
  description: string;
  location: string;
  duration: number;
  cost: number;
  currency: string;
  status: string;
}

const ItineraryManager: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ItineraryFormData>();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const onSubmit = async (data: ItineraryFormData) => {
    try {
      setSaving(true);
      setError(null);

      const newItem: ItineraryItem = {
        id: editingItem?.id || `item_${Date.now()}`,
        date: data.date,
        time: data.time || undefined,
        type: data.type as any,
        title: data.title,
        description: data.description || undefined,
        location: data.location || undefined,
        duration: data.duration || undefined,
        cost: data.cost || undefined,
        currency: data.currency,
        status: data.status as any,
      };

      const updatedItinerary = editingItem
        ? trip?.itinerary?.map(item => item.id === editingItem.id ? newItem : item) || []
        : [...(trip?.itinerary || []), newItem];

      const result = await put<Trip>(`/trips/${tripId}`, { itinerary: updatedItinerary });
      
      if (result.success && result.data) {
        setTrip(result.data);
        setShowAddForm(false);
        setEditingItem(null);
        reset();
      } else {
        setError(result.error || 'Failed to update itinerary');
      }
    } catch (err) {
      console.error('Error updating itinerary:', err);
      setError('Failed to update itinerary. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: ItineraryItem) => {
    setEditingItem(item);
    setValue('date', item.date);
    setValue('time', item.time || '');
    setValue('type', item.type);
    setValue('title', item.title);
    setValue('description', item.description || '');
    setValue('location', item.location || '');
    setValue('duration', item.duration || 0);
    setValue('cost', item.cost || 0);
    setValue('currency', item.currency || 'USD');
    setValue('status', item.status);
    setShowAddForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this itinerary item?')) {
      return;
    }

    try {
      setSaving(true);
      const updatedItinerary = trip?.itinerary?.filter(item => item.id !== itemId) || [];
      const result = await put<Trip>(`/trips/${tripId}`, { itinerary: updatedItinerary });
      
      if (result.success && result.data) {
        setTrip(result.data);
      } else {
        setError(result.error || 'Failed to delete itinerary item');
      }
    } catch (err) {
      console.error('Error deleting itinerary item:', err);
      setError('Failed to delete itinerary item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingItem(null);
    reset();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'status-planned';
      case 'booked': return 'status-booked';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-planned';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accommodation': return '🏨';
      case 'transport': return '🚗';
      case 'activity': return '🎯';
      case 'meal': return '🍽️';
      default: return '📍';
    }
  };

  const typeOptions = [
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'transport', label: 'Transport' },
    { value: 'activity', label: 'Activity' },
    { value: 'meal', label: 'Meal' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'planned', label: 'Planned' },
    { value: 'booked', label: 'Booked' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  if (loading) {
    return (
      <div className="itinerary-manager">
        <div className="loading">Loading itinerary...</div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="itinerary-manager">
        <div className="error-message">
          {error || 'Trip not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="itinerary-manager">
      <div className="itinerary-header">
        <h2>Itinerary Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary"
        >
          Add Itinerary Item
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="itinerary-form-overlay">
          <div className="itinerary-form">
            <h3>{editingItem ? 'Edit Itinerary Item' : 'Add Itinerary Item'}</h3>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    {...register('date', { required: 'Date is required' })}
                    className={errors.date ? 'error' : ''}
                  />
                  {errors.date && <span className="error-text">{errors.date.message}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="time">Time</label>
                  <input
                    type="time"
                    id="time"
                    {...register('time')}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Type *</label>
                  <select
                    id="type"
                    {...register('type', { required: 'Type is required' })}
                    className={errors.type ? 'error' : ''}
                  >
                    {typeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.type && <span className="error-text">{errors.type.message}</span>}
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

              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  className={errors.title ? 'error' : ''}
                  placeholder="e.g., Visit Eiffel Tower"
                />
                {errors.title && <span className="error-text">{errors.title.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={3}
                  placeholder="Additional details..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  {...register('location')}
                  placeholder="e.g., Paris, France"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Duration (minutes)</label>
                  <input
                    type="number"
                    id="duration"
                    {...register('duration', { min: 0 })}
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cost">Cost</label>
                  <input
                    type="number"
                    id="cost"
                    {...register('cost', { min: 0 })}
                    min="0"
                    placeholder="0"
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

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancel}
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
                  {saving ? 'Saving...' : (editingItem ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="itinerary-list">
        {trip.itinerary && trip.itinerary.length > 0 ? (
          <div className="itinerary-items">
            {trip.itinerary
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((item) => (
                <div key={item.id} className="itinerary-item">
                  <div className="item-header">
                    <div className="item-icon">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="item-info">
                      <h4>{item.title}</h4>
                      <p className="item-date">{formatDate(item.date)}</p>
                      {item.time && <p className="item-time">🕐 {item.time}</p>}
                    </div>
                    <div className="item-status">
                      <span className={`status ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="item-details">
                    {item.description && <p className="item-description">{item.description}</p>}
                    {item.location && <p className="item-location">📍 {item.location}</p>}
                    {item.duration && <p className="item-duration">⏱️ {item.duration} minutes</p>}
                    {item.cost && <p className="item-cost">💰 {item.currency || 'USD'} {item.cost}</p>}
                  </div>
                  
                  <div className="item-actions">
                    <button
                      onClick={() => handleEdit(item)}
                      className="btn btn-sm btn-secondary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="empty-itinerary">
            <p>No itinerary items yet. Start planning your activities!</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
            >
              Add Your First Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItineraryManager;
