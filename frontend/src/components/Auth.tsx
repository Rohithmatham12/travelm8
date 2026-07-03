import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, login, startDemoSession } from '../utils/auth';
import { post } from '../utils/api';

type Mode = 'signin' | 'signup' | 'forgot';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchMode = (m: Mode) => { setMode(m); setError(null); setSuccess(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        await login(email, password);
        navigate('/dashboard');
      } else if (mode === 'signup') {
        await register(email, password, name);
        navigate('/dashboard');
      } else {
        const r = await post<null>('/auth/forgot-password', { email });
        if (r.success || r.message) {
          setSuccess('If that email exists, a reset link has been sent. Check your inbox.');
        } else {
          setError(r.error || 'Request failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => { startDemoSession(); navigate('/dashboard'); };

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <div className="auth-logo-icon">TM8</div>
        <span>TravelM8</span>
      </div>

      <div className="auth-card">
        <h1 className="auth-heading">
          {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}
        </h1>

        {mode !== 'forgot' && (
          <div className="auth-tabs">
            <button className={mode === 'signin' ? 'active' : ''} onClick={() => switchMode('signin')}>Sign In</button>
            <button className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>Create Account</button>
          </div>
        )}

        {error   && <div className="auth-error-box">{error}</div>}
        {success && <div className="auth-success-box">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="auth-field">
              <label>Your name</label>
              <input type="text" placeholder="Sarah" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
            </div>
          )}
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          {mode !== 'forgot' && (
            <div className="auth-field">
              <label className="auth-label-row">
                <span>Password</span>
                {mode === 'signin' && (
                  <button type="button" className="auth-forgot-link" onClick={() => switchMode('forgot')}>
                    Forgot password?
                  </button>
                )}
              </label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            </div>
          )}
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>
        </form>

        {mode === 'forgot' ? (
          <p className="auth-switch-text">
            <button onClick={() => switchMode('signin')}>← Back to sign in</button>
          </p>
        ) : (
          <>
            <div className="auth-divider"><span>or</span></div>
            <button className="auth-demo-btn" onClick={handleDemo}>Try the app — no account needed</button>
            <p className="auth-switch-text">
              {mode === 'signin'
                ? <><span>No account?</span> <button onClick={() => switchMode('signup')}>Create one free</button></>
                : <><span>Have an account?</span> <button onClick={() => switchMode('signin')}>Sign in</button></>
              }
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
