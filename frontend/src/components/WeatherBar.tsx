import React, { useState, useEffect } from 'react';
import { getWeatherForCoords, WeatherDay } from '../utils/weather';
import './WeatherBar.css';

interface WeatherBarProps {
  origin: string;
  destination: string;
  originCoords: { lat: number; lng: number } | null;
  destinationCoords: { lat: number; lng: number } | null;
  date: string;
}

export const WeatherBar: React.FC<WeatherBarProps> = ({
  origin, destination, originCoords, destinationCoords, date,
}) => {
  const [originW, setOriginW] = useState<WeatherDay | null>(null);
  const [destW, setDestW] = useState<WeatherDay | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!originCoords || !destinationCoords || !date) return;
    Promise.all([
      getWeatherForCoords(originCoords.lat, originCoords.lng, date),
      getWeatherForCoords(destinationCoords.lat, destinationCoords.lng, date),
    ]).then(([o, d]) => {
      setOriginW(o);
      setDestW(d);
      setLoaded(true);
    });
  }, [originCoords, destinationCoords, date]);

  if (!loaded || (!originW && !destW)) return null;

  return (
    <div className="weather-bar" aria-label="Weather forecast for your travel date">
      <span className="weather-bar-label">Weather on {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      {originW && (
        <div className="weather-chip">
          <span className="weather-emoji" aria-hidden="true">{originW.emoji}</span>
          <div className="weather-info">
            <span className="weather-city">{origin.split(',')[0]}</span>
            <span className="weather-temps">{originW.tempMax}° / {originW.tempMin}°</span>
          </div>
          {originW.precipitation > 0 && (
            <span className="weather-precip">💧 {originW.precipitation}"</span>
          )}
        </div>
      )}
      <span className="weather-arrow" aria-hidden="true">→</span>
      {destW && (
        <div className="weather-chip">
          <span className="weather-emoji" aria-hidden="true">{destW.emoji}</span>
          <div className="weather-info">
            <span className="weather-city">{destination.split(',')[0]}</span>
            <span className="weather-temps">{destW.tempMax}° / {destW.tempMin}°</span>
          </div>
          {destW.precipitation > 0 && (
            <span className="weather-precip">💧 {destW.precipitation}"</span>
          )}
        </div>
      )}
    </div>
  );
};
