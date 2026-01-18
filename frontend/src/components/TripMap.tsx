import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ItineraryItem } from '../types/trip';
import './TripMap.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface TripMapProps {
  destination: string;
  itinerary?: ItineraryItem[];
  center?: [number, number];
  zoom?: number;
}

const TripMap: React.FC<TripMapProps> = ({ 
  destination, 
  itinerary = [], 
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 10 
}) => {
  const mapRef = useRef<L.Map | null>(null);

  // Geocode destination to get coordinates (simplified - in production use a geocoding service)
  useEffect(() => {
    // This is a simplified version - in production, use a geocoding API
    // For now, we'll use mock coordinates based on common destinations
    const destinationCoords: { [key: string]: [number, number] } = {
      'paris': [48.8566, 2.3522],
      'london': [51.5074, -0.1278],
      'tokyo': [35.6762, 139.6503],
      'new york': [40.7128, -74.0060],
      'los angeles': [34.0522, -118.2437],
      'sydney': [-33.8688, 151.2093],
      'rome': [41.9028, 12.4964],
      'madrid': [40.4168, -3.7038],
      'berlin': [52.5200, 13.4050],
      'amsterdam': [52.3676, 4.9041],
    };

    const normalizedDest = destination.toLowerCase();
    const coords = destinationCoords[normalizedDest] || center;
    
    if (mapRef.current) {
      mapRef.current.setView(coords, zoom);
    }
  }, [destination, center, zoom]);

  // Extract coordinates from itinerary items (if they have location data)
  const markers = itinerary
    .filter(item => item.location)
    .map((item, index) => {
      // In a real implementation, you'd geocode the location
      // For now, we'll use mock coordinates
      const coords: [number, number] = [
        center[0] + (Math.random() - 0.5) * 0.1,
        center[1] + (Math.random() - 0.5) * 0.1
      ];
      
      return {
        id: item.id || `marker-${index}`,
        position: coords,
        title: item.title,
        description: item.description,
        type: item.type,
      };
    });

  return (
    <div className="trip-map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <div className="map-popup">
                <h4>{marker.title}</h4>
                {marker.description && <p>{marker.description}</p>}
                <span className="marker-type">{marker.type}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default TripMap;

