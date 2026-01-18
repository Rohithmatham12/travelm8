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
  const [copied, setCopied] = useState(false);

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

  const generateShareCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleShareSettingsChange = async (newSettings: Partial<ShareSettings>) => {
    try {
      setSaving(true);
      setError(null);

      const updatedSettings = {
        ...shareSettings,
        ...newSettings,
      };

      // Generate share code and URL if making public
      if (newSettings.isPublic && !shareSettings.isPublic) {
        const shareCode = generateShareCode();
        const shareUrl = `${window.location.origin}/shared/trips/${shareCode}`;
        updatedSettings.shareCode = shareCode;
        updatedSettings.shareUrl = shareUrl;
      }

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const shareToSocialMedia = (platform: string) => {
    if (!shareSettings.shareUrl) return;

    const text = `Check out my trip to ${trip?.destination}: ${trip?.title}`;
    const url = shareSettings.shareUrl;

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(`Check out my trip: ${trip?.title}`)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
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
        <p>Share your travel plans with friends and family</p>
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
                disabled={saving}
              />
              <span className="setting-text">
                <strong>Make this trip public</strong>
                <small>Allow others to view your trip using a share link</small>
              </span>
            </label>
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

          {shareSettings.isPublic && shareSettings.shareUrl && (
            <div className="share-link-section">
              <h4>Share Link</h4>
              <div className="share-link-container">
                <input
                  type="text"
                  value={shareSettings.shareUrl}
                  readOnly
                  className="share-link-input"
                />
                <button
                  onClick={() => copyToClipboard(shareSettings.shareUrl!)}
                  className="btn btn-secondary"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="share-link-note">
                Anyone with this link can view your trip details
              </p>
            </div>
          )}
        </div>

        {shareSettings.isPublic && shareSettings.shareUrl && (
          <div className="social-sharing">
            <h3>Share on Social Media</h3>
            <div className="social-buttons">
              <button
                onClick={() => shareToSocialMedia('twitter')}
                className="social-btn twitter"
              >
                🐦 Twitter
              </button>
              <button
                onClick={() => shareToSocialMedia('facebook')}
                className="social-btn facebook"
              >
                📘 Facebook
              </button>
              <button
                onClick={() => shareToSocialMedia('linkedin')}
                className="social-btn linkedin"
              >
                💼 LinkedIn
              </button>
              <button
                onClick={() => shareToSocialMedia('whatsapp')}
                className="social-btn whatsapp"
              >
                💬 WhatsApp
              </button>
              <button
                onClick={() => shareToSocialMedia('email')}
                className="social-btn email"
              >
                📧 Email
              </button>
            </div>
          </div>
        )}

        <div className="sharing-tips">
          <h3>Sharing Tips</h3>
          <ul>
            <li>Share your trip with friends and family to get travel suggestions</li>
            <li>Use social media to inspire others with your travel plans</li>
            <li>Keep your trip private if you prefer to plan in private</li>
            <li>Enable comments to get feedback and recommendations</li>
            <li>Share your trip after completion to help other travelers</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TripSharing;
