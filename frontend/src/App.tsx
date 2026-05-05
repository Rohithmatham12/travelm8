import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TripList from './components/TripList';
import TripDetail from './components/TripDetail';
import CreateTrip from './components/CreateTrip';
import EditTrip from './components/EditTrip';
import ItineraryManager from './components/ItineraryManager';
import TripSharing from './components/TripSharing';
import TripRecommendations from './components/TripRecommendations';
import AIRecommendations from './components/AIRecommendations';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import RoutePlanner from './components/RoutePlanner';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/route-planner" element={<RoutePlanner />} />
                      <Route path="/ai-recommendations" element={<AIRecommendations />} />
                      <Route path="/trips" element={<TripList />} />
                      <Route path="/trips/new" element={<CreateTrip />} />
                      <Route path="/trips/:tripId" element={<TripDetail />} />
                      <Route path="/trips/:tripId/recommendations" element={<TripRecommendations />} />
                      <Route path="/trips/:tripId/edit" element={<EditTrip />} />
                      <Route path="/trips/:tripId/itinerary" element={<ItineraryManager />} />
                      <Route path="/trips/:tripId/share" element={<TripSharing />} />
                    </Routes>
                  </main>
                </>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
