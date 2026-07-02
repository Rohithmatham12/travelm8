export interface DayWeather {
  date: string;
  tempMax: number;
  tempMin: number;
  description: string;
  emoji: string;
}

const WMO_CODES: Record<number, { description: string; emoji: string }> = {
  0: { description: 'Clear sky', emoji: '☀️' },
  1: { description: 'Mainly clear', emoji: '🌤' },
  2: { description: 'Partly cloudy', emoji: '⛅' },
  3: { description: 'Overcast', emoji: '☁️' },
  45: { description: 'Foggy', emoji: '🌫' },
  48: { description: 'Icy fog', emoji: '🌫' },
  51: { description: 'Light drizzle', emoji: '🌦' },
  61: { description: 'Light rain', emoji: '🌧' },
  63: { description: 'Moderate rain', emoji: '🌧' },
  65: { description: 'Heavy rain', emoji: '🌧' },
  71: { description: 'Light snow', emoji: '🌨' },
  73: { description: 'Moderate snow', emoji: '❄️' },
  80: { description: 'Rain showers', emoji: '🌦' },
  95: { description: 'Thunderstorm', emoji: '⛈' },
};

async function geocode(city: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const q = encodeURIComponent(city);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'TravelM8/1.0 (chintumatham@gmail.com)' } }
    );
    const data = await res.json();
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch { return null; }
}

export async function getWeatherForTrip(
  city: string,
  departureDate: string
): Promise<DayWeather | null> {
  try {
    const coords = await geocode(city);
    if (!coords) return null;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&temperature_unit=fahrenheit&timezone=auto&start_date=${departureDate}&end_date=${departureDate}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.daily?.time?.[0]) return null;
    const code = data.daily.weathercode[0];
    const wmo = WMO_CODES[code] ?? { description: 'Mixed', emoji: '🌡' };
    return {
      date: data.daily.time[0],
      tempMax: Math.round(data.daily.temperature_2m_max[0]),
      tempMin: Math.round(data.daily.temperature_2m_min[0]),
      description: wmo.description,
      emoji: wmo.emoji,
    };
  } catch { return null; }
}
