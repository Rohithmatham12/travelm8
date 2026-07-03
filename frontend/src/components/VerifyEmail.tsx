import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { post } from '../utils/api';
import './Auth.css';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid verification link.'); return; }
    post<null>('/auth/verify-email', { token })
      .then(r => {
        if (r.success) { setStatus('success'); setMessage(r.message || 'Email verified!'); }
        else { setStatus('error'); setMessage(r.error || 'Verification failed.'); }
      })
      .catch(() => { setStatus('error'); setMessage('Something went wrong. Try again.'); });
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <div className="auth-logo-icon">TM8</div>
        <span>TravelM8</span>
      </div>
      <div className="auth-card">
        {status === 'loading' && (
          <>
            <h1 className="auth-heading">Verifying...</h1>
            <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>Checking your verification link.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="auth-heading">Email verified</h1>
            <div className="auth-success-box">{message}</div>
            <button className="auth-submit-btn" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/auth')}>Continue to sign in</button>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="auth-heading">Verification failed</h1>
            <div className="auth-error-box">{message}</div>
            <button className="auth-submit-btn" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/auth')}>Back to sign in</button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
