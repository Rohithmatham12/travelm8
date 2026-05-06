import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Trip } from '../types/trip';
import { get, put } from '../utils/api';

interface ShareSettings {
  isPublic: boolean;
  allowComments: boolean;
  shareCode?: string;
  shareUrl?: string;
}

const PUBLIC_SHARING_READY = false;

const TripSharing: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    isPublic: false,
    allowComments: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrip = useCallback(async () => {
    try {
      setLoading(true);
      const response = await get<Trip>(`/trips/${tripId}`);
      
      if (response.success && response.data) {
        const tripData = response.data;
        setTrip(tripData);
        
        // Load existing share settings (this would come from the trip data in a real implementation)
        setShareSettings({
          isPublic: (tripData as any).isPublic || false,
          allowComments: (tripData as any).allowComments || false,
          shareCode: (tripData as any).shareCode,
          shareUrl: (tripData as any).shareUrl,
        });
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

  const handleShareSettingsChange = async (newSettings: Partial<ShareSettings>) => {
    try {
      setSaving(true);
      setError(null);

      if (newSettings.isPublic && !PUBLIC_SHARING_READY) {
        setError('Public share links are not enabled yet. Keep this trip private and export or message the plan directly for now.');
        return;
      }

      const updatedSettings = {
        ...shareSettings,
        ...newSettings,
      };

      // If making private, remove share code and URL
      if (newSettings.isPublic === false) {
        updatedSettings.shareCode = undefined;
        updatedSettings.shareUrl = undefined;
      }

      const result = await put<Trip>(`/trips/${tripId}`, {
        isPublic: updatedSettings.isPublic,
        allowComments: updatedSettings.allowComments,
        shareCode: updatedSettings.shareCode,
        shareUrl: updatedSettings.shareUrl,
      });
      
      if (result.success && result.data) {
        setTrip(result.data);
        setShareSettings(updatedSettings);
      } else {
        setError(result.error || 'Failed to update share settings');
      }
    } catch (err) {
      console.error('Error updating share settings:', err);
      setError('Failed to update share settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="trip-sharing">
        <div className="loading">Loading sharing options...</div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="trip-sharing">
        <div className="error-message">
          {error || 'Trip not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="trip-sharing">
      <div className="sharing-header">
        <h2>Share Your Trip</h2>
        <p>Prepare a private plan you can review before sending outside TravelM8.</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="sharing-content">
        <div className="trip-preview">
          <h3>Trip Preview</h3>
          <div className="preview-card">
            <h4>{trip.title}</h4>
            <p className="destination">📍 {trip.destination}</p>
            <p className="dates">
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </p>
            <p className="travelers">👥 {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}</p>
            {trip.description && <p className="description">{trip.description}</p>}
          </div>
        </div>

        <div className="sharing-settings">
          <h3>Sharing Settings</h3>
          
          <div className="setting-group">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={shareSettings.isPublic}
                onChange={(e) => handleShareSettingsChange({ isPublic: e.target.checked })}
                disabled={saving || !PUBLIC_SHARING_READY}
              />
              <span className="setting-text">
                <strong>Public share link</strong>
                <small>Coming after secure public trip pages are added. This trip stays private for now.</small>
              </span>
            </label>
          </div>

          <div className="share-link-section">
            <h4>Private Sharing Status</h4>
            <p className="share-link-note">
              TravelM8 will not generate a public URL until the app has a matching secure public viewer.
              For now, use the itinerary and route packet screens as the trusted copy of the plan.
            </p>
          </div>

          {shareSettings.isPublic && (
            <div className="setting-group">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={shareSettings.allowComments}
                  onChange={(e) => handleShareSettingsChange({ allowComments: e.target.checked })}
                  disabled={saving}
                />
                <span className="setting-text">
                  <strong>Allow comments</strong>
                  <small>Let others leave comments and suggestions on your trip</small>
                </span>
              </label>
            </div>
          )}

        </div>

        <div className="sharing-tips">
          <h3>Trip Handoff Checklist</h3>
          <ul>
            <li>Send the final itinerary only after route stops, lodging, and meal backups are verified</li>
            <li>Share the offline packet details with anyone who needs your route context</li>
            <li>Keep your trip private if you prefer to plan in private</li>
            <li>Confirm motel late check-in and one backup food stop before departure</li>
            <li>Add public sharing later only with a working viewer and privacy controls</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TripSharing;
