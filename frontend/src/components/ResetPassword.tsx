import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { post } from '../utils/api';
import './Auth.css';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const r = await post<null>('/auth/reset-password', { token, newPassword: password });
      if (r.success) {
        setSuccess(true);
      } else {
        setError(r.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-heading">Invalid Link</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
            This reset link is missing a token.
          </p>
          <button className="auth-submit-btn" style={{ marginTop: '1rem' }} onClick={() => navigate('/auth')}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-logo">
          <div className="auth-logo-icon">TM8</div>
          <span>TravelM8</span>
        </div>
        <div className="auth-card">
          <h1 className="auth-heading">Password updated</h1>
          <div className="auth-success-box">Your password has been changed. You can now sign in.</div>
          <button className="auth-submit-btn" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/auth')}>
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <div className="auth-logo-icon">TM8</div>
        <span>TravelM8</span>
      </div>
      <div className="auth-card">
        <h1 className="auth-heading">Choose a new password</h1>
        {error && <div className="auth-error-box">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>New password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
          </div>
          <div className="auth-field">
            <label>Confirm password</label>
            <input type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} autoComplete="new-password" />
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Updating...' : 'Set new password'}
          </button>
        </form>
        <p className="auth-switch-text" style={{ marginTop: '1rem' }}>
          <button onClick={() => navigate('/auth')}>← Back to sign in</button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
