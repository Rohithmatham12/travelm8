import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getUser, isDemoMode, logout } from '../utils/auth';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();
  const demoMode = isDemoMode();

  const handleSignOut = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/dashboard" className="logo">
          <span className="logo-mark">TM8</span>
          <span>
            <strong>TravelM8</strong>
            <small>Route Copilot</small>
          </span>
        </Link>
        
        <nav className="nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/route-planner" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Route Planner</NavLink>
          <NavLink to="/trips" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Trips</NavLink>
          <NavLink to="/trips/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>New Trip</NavLink>
        </nav>

        <div className="user-menu">
          {demoMode && <span className="mode-badge">Demo Mode</span>}
          <span className="role-badge">{user?.role || 'traveler'}</span>
          <span className="user-name">{user?.name || user?.email || 'User'}</span>
          <button onClick={handleSignOut} className="sign-out-btn">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
