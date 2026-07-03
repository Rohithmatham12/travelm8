import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getUser, isDemoMode, logout } from '../utils/auth';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();
  const demoMode = isDemoMode();
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0] ?? 'U').toUpperCase();

  const handleSignOut = () => { logout(); navigate('/auth'); };

  return (
    <header className="header no-print">
      <div className="header-stripe" />
      <div className="header-inner">
        <Link to="/dashboard" className="logo">
          <div className="logo-mark">TM8</div>
          <span className="logo-name">Travel<span>M8</span></span>
        </Link>

        <nav className="nav" aria-label="Main">
          <NavLink to="/dashboard"        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/route-planner"    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Route Planner</NavLink>
          <NavLink to="/ai-recommendations" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Destinations</NavLink>
          <NavLink to="/trips"            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>My Trips</NavLink>
          <NavLink to="/analytics"        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Analytics</NavLink>
        </nav>

        <div className="user-menu">
          {demoMode && <span className="demo-badge">Demo</span>}
          <div className="user-pill">
            <div className="user-avatar" aria-hidden="true">{initials}</div>
            <span className="user-name">{user?.name?.split(' ')[0] || user?.email || 'Traveler'}</span>
          </div>
          <button onClick={handleSignOut} className="sign-out-btn">Sign out</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
