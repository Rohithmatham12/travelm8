// Overpass API — free, no key, CORS-enabled
// https://wiki.openstreetmap.org/wiki/Overpass_API

export interface GasStation {
  id: number;
  lat: number;
  lon: number;
  name?: string;
  brand?: string;
  operator?: string;
}

export async function getGasStationsAlongRoute(
  originCoords: { lat: number; lng: number },
  destCoords: { lat: number; lng: number },
): Promise<GasStation[]> {
  try {
    const south = Math.min(originCoords.lat, destCoords.lat) - 0.5;
    const north = Math.max(originCoords.lat, destCoords.lat) + 0.5;
    const west  = Math.min(originCoords.lng, destCoords.lng) - 0.5;
    const east  = Math.max(originCoords.lng, destCoords.lng) + 0.5;

    const query = `[out:json][timeout:15];node["amenity"="fuel"](${south},${west},${north},${east});out body 25;`;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' },
    });

    if (!res.ok) return [];
    const json = await res.json();
    const stations: GasStation[] = (json.elements || []).map((el: any) => ({
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      name: el.tags?.name,
      brand: el.tags?.brand,
      operator: el.tags?.operator,
    }));

    // Sort by distance from route midpoint so most "central" stations come first
    const midLat = (originCoords.lat + destCoords.lat) / 2;
    const midLng = (originCoords.lng + destCoords.lng) / 2;
    stations.sort((a, b) => {
      const da = Math.hypot(a.lat - midLat, a.lon - midLng);
      const db = Math.hypot(b.lat - midLat, b.lon - midLng);
      return da - db;
    });

    return stations.slice(0, 15);
  } catch {
    return [];
  }
}
