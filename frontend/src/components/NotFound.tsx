import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const authed = isAuthenticated();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center', background: 'var(--bg)',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🗺️</div>
      <h1 style={{
        fontFamily: "'Sora', sans-serif", fontSize: '2rem', fontWeight: 800,
        color: 'var(--navy)', margin: '0 0 8px',
      }}>
        Road ends here
      </h1>
      <p style={{ color: 'var(--text-2)', fontSize: '1rem', margin: '0 0 32px', maxWidth: 360 }}>
        That page doesn't exist. Maybe the route changed, or you took a wrong turn.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>← Go back</button>
        {authed
          ? <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
          : <Link to="/" className="btn btn-secondary">Home</Link>
        }
      </div>
    </div>
  );
};

export default NotFound;
