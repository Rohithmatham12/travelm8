import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, login, startDemoSession } from '../utils/auth';
import './Auth.css';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
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
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    startDemoSession();
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <section className="auth-intro">
        <span className="auth-kicker">Route-aware travel copilot</span>
        <h1>Plan road trips that hold up in the real world.</h1>
        <p>
          TravelM8 builds route plans around budget, fatigue, food timing, overnight backups,
          offline packets, and explainable stop scores using free open-map resources.
        </p>
        <div className="auth-proof-grid">
          <div>
            <strong>Free stack</strong>
            <span>OSM, OSRM, Nominatim, Render</span>
          </div>
          <div>
            <strong>Road-first</strong>
            <span>Stops, meals, motels, safety</span>
          </div>
          <div>
            <strong>Explainable</strong>
            <span>Budget, detour, risk, confidence</span>
          </div>
        </div>
      </section>

      <div className="auth-card">
        <div className="auth-card-heading">
          <span className="brand-mark">TM8</span>
          <div>
            <h2>TravelM8</h2>
            <p className="auth-subtitle">Create an account or preview the product.</p>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={isLogin ? 'active' : ''}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            type="button"
            className={!isLogin ? 'active' : ''}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="demo-panel">
          <div>
            <strong>Need to show it fast?</strong>
            <span>Open a guided sample with trips, route scoring, and calendar export.</span>
          </div>
          <button type="button" className="btn btn-demo" onClick={handleDemo}>
            Try Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
