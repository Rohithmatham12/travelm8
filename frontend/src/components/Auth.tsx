import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, login, startDemoSession } from '../utils/auth';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signin') await login(email, password);
      else await register(email, password, name);
      navigate('/dashboard');
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
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>

        <div className="auth-tabs">
          <button className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError(null); }}>Sign In</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(null); }}>Create Account</button>
        </div>

        {error && <div className="auth-error-box">{error}</div>}

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
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button className="auth-demo-btn" onClick={handleDemo}>
          Try the app — no account needed
        </button>

        <p className="auth-switch-text">
          {mode === 'signin'
            ? <><span>No account?</span> <button onClick={() => { setMode('signup'); setError(null); }}>Create one free</button></>
            : <><span>Have an account?</span> <button onClick={() => { setMode('signin'); setError(null); }}>Sign in</button></>
          }
        </p>
      </div>
    </div>
  );
};

export default Auth;
