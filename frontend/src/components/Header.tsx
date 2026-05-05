import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, logout } from '../utils/auth';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();

  const handleSignOut = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/dashboard" className="logo">
          <h1>TravelM8</h1>
        </Link>
        
        <nav className="nav">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/trips" className="nav-link">My Trips</Link>
          <Link to="/route-planner" className="nav-link">Route Planner</Link>
          <Link to="/trips/new" className="nav-link">New Trip</Link>
        </nav>

        <div className="user-menu">
          <span className="user-name">
            {user?.email || user?.name || 'User'}
          </span>
          <button onClick={handleSignOut} className="sign-out-btn">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
