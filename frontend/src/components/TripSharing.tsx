import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trip } from '../types/trip';
import { get, post } from '../utils/api';
import { toast } from '../utils/toast';
import './TripSharing.css';

const TripSharing: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail]     = useState('');
  const [note, setNote]       = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState<string[]>([]);

  const loadTrip = useCallback(async () => {
    const res = await get<Trip>(`/trips/${tripId}`);
    if (res.success && res.data) setTrip(res.data);
    setLoading(false);
  }, [tripId]);

  useEffect(() => { loadTrip(); }, [loadTrip]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      const res = await post(`/trips/${tripId}/invite`, { recipientEmail: email.trim(), note: note.trim() || undefined });
      if (res.success) {
        setSent(prev => [...prev, email.trim()]);
        setEmail('');
        setNote('');
        toast.success(`Invite sent to ${email.trim()}`);
      } else {
        toast.error(res.error || 'Failed to send invite');
      }
    } catch {
      toast.error('Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) return <div className="ts-page"><div className="ts-loading">Loading…</div></div>;
  if (!trip)   return <div className="ts-page"><div className="ts-error">Trip not found</div></div>;

  return (
    <div className="ts-page">
      <div className="ts-header">
        <Link to={`/trips/${tripId}`} className="ts-back">← Back</Link>
        <h1 className="ts-title">Invite someone</h1>
        <p className="ts-sub">Send a trip summary by email. They'll get the details and a link to TravelM8.</p>
      </div>

      <div className="ts-body">

        {/* Trip card */}
        <div className="ts-trip-card">
          <h2 className="ts-trip-title">{trip.title}</h2>
          <div className="ts-trip-meta">
            <span>📍 {trip.destination}</span>
            <span>📅 {fmt(trip.startDate)} – {fmt(trip.endDate)}</span>
            <span>👥 {trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''}</span>
          </div>
          {trip.description && <p className="ts-trip-desc">{trip.description}</p>}
        </div>

        {/* Invite form */}
        <form className="ts-form" onSubmit={handleSend}>
          <div className="field">
            <label className="field-label required">Recipient email</label>
            <input
              className="field-input"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={sending}
            />
          </div>
          <div className="field">
            <label className="field-label">
              Personal note <span className="ts-optional">(optional)</span>
            </label>
            <textarea
              className="field-textarea"
              rows={3}
              placeholder="Hey, we're planning this trip — hope you can make it!"
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={sending}
            />
          </div>
          <button className="btn btn-primary ts-send-btn" type="submit" disabled={sending || !email.trim()}>
            {sending ? 'Sending…' : 'Send invite'}
          </button>
        </form>

        {/* Sent log */}
        {sent.length > 0 && (
          <div className="ts-sent-list">
            <p className="ts-sent-label">Sent this session</p>
            {sent.map(e => (
              <div className="ts-sent-item" key={e}>
                <span className="ts-sent-check">✓</span> {e}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default TripSharing;
