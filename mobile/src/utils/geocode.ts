export interface Coords { lat: number; lon: number; }

export async function geocodeCity(city: string): Promise<Coords | null> {
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
