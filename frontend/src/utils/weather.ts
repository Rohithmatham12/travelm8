// Open-Meteo: free, no API key, CORS-enabled
// https://open-meteo.com/en/docs

export interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
  emoji: string;
  label: string;
}

// WMO weather code → emoji + label
function decodeWeatherCode(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: 'Clear' };
  if (code <= 2)  return { emoji: '⛅', label: 'Partly cloudy' };
  if (code === 3) return { emoji: '☁️', label: 'Overcast' };
  if (code <= 49) return { emoji: '🌫️', label: 'Fog' };
  if (code <= 59) return { emoji: '🌦️', label: 'Drizzle' };
  if (code <= 69) return { emoji: '🌧️', label: 'Rain' };
  if (code <= 79) return { emoji: '🌨️', label: 'Snow' };
  if (code <= 84) return { emoji: '🌦️', label: 'Rain showers' };
  if (code <= 86) return { emoji: '🌨️', label: 'Snow showers' };
  if (code <= 99) return { emoji: '⛈️', label: 'Thunderstorm' };
  return { emoji: '🌡️', label: 'Unknown' };
}

export async function getWeatherForCoords(
  lat: number,
  lng: number,
  date: string
): Promise<WeatherDay | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum');
    url.searchParams.set('temperature_unit', 'fahrenheit');
    url.searchParams.set('precipitation_unit', 'inch');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('start_date', date);
    url.searchParams.set('end_date', date);

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();
    const d = json.daily;
    if (d?.weathercode?.[0] !== undefined) {
      const code = d.weathercode[0] as number;
      const { emoji, label } = decodeWeatherCode(code);
      return {
        date,
        tempMax: Math.round(d.temperature_2m_max[0]),
        tempMin: Math.round(d.temperature_2m_min[0]),
        precipitation: Math.round(d.precipitation_sum[0] * 10) / 10,
        weatherCode: code,
        emoji,
        label,
      };
    }
    return null;
  } catch {
    return null;
  }
}
