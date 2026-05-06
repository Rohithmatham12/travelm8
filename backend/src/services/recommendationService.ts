import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import {
  RecommendationRequest,
  RecommendationResponse,
  Recommendation,
  ItineraryDay
} from '../types/recommendation';

interface Coordinates {
  lat: number;
  lng: number;
}

interface OpenDataPlace {
  name: string;
  displayName: string;
  type: string;
  category: string;
  coordinates: Coordinates;
  address?: string;
  tags: Record<string, any>;
}

type RecommendationKind = 'accommodation' | 'activity' | 'restaurant' | 'attraction';

export class RecommendationService {
  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const duration = this.calculateDuration(request.startDate, request.endDate);
    const destination = request.destination.trim();
    const coordinates = await this.geocodeDestination(destination);
    const needsAccommodation = duration > 1 || /hotel|motel|stay|accommodation/i.test(request.preferences.accommodationType || '');

    const [restaurants, attractions, accommodations] = await Promise.all([
      this.findRecommendations(destination, coordinates, 'restaurant', request, duration),
      this.findRecommendations(destination, coordinates, 'attraction', request, duration),
      needsAccommodation
        ? this.findRecommendations(destination, coordinates, 'accommodation', request, duration)
        : Promise.resolve([])
    ]);

    const activities = attractions.slice(0, Math.max(3, Math.min(10, duration * 2)));
    const transport = this.generateTransportGuidance(destination, duration, request);
    const recommendations = {
      accommodations,
      activities,
      restaurants,
      attractions,
      transport,
      motels: needsAccommodation ? accommodations : []
    };

    const itinerary = this.generateItinerary(request, recommendations, duration);
    const totalEstimatedCost = this.calculateTotalCost(itinerary);

    return {
      destination,
      duration,
      recommendations,
      itinerary,
      totalEstimatedCost,
      budgetBreakdown: this.calculateBudgetBreakdown(itinerary),
      tips: this.generateTips(destination, duration, {
        restaurants,
        activities,
        accommodations,
        needsAccommodation
      })
    };
  }

  private calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(days, 30));
  }

  private async geocodeDestination(destination: string): Promise<Coordinates> {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('q', destination);

    const data = await this.fetchJson<Array<{ lat: string; lon: string }>>(url);
    const first = data[0];
    if (!first) throw new Error(`Could not find ${destination} in OpenStreetMap`);

    return {
      lat: Number(first.lat),
      lng: Number(first.lon)
    };
  }

  private async findRecommendations(
    destination: string,
    coordinates: Coordinates,
    kind: RecommendationKind,
    request: RecommendationRequest,
    duration: number
  ): Promise<Recommendation[]> {
    const places = await this.findOpenDataPlaces(destination, coordinates, kind);
    const limit = kind === 'accommodation' ? 4 : kind === 'restaurant' ? 6 : Math.min(10, Math.max(4, duration * 2));
    const recommendations = places
      .filter((place) => this.isUsefulPlace(place, kind))
      .slice(0, limit)
      .map((place) => this.placeToRecommendation(place, kind, request));

    if (recommendations.length > 0) return recommendations;

    return [this.honestFallbackRecommendation(destination, kind, request)];
  }

  private async findOpenDataPlaces(destination: string, coordinates: Coordinates, kind: RecommendationKind): Promise<OpenDataPlace[]> {
    const queries = this.queriesForKind(destination, kind);
    const seen = new Set<string>();
    const places: OpenDataPlace[] = [];

    for (const query of queries) {
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        const latDelta = 0.22;
        const lngDelta = 0.22;
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '8');
        url.searchParams.set('q', query);
        url.searchParams.set('bounded', '1');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('extratags', '1');
        url.searchParams.set(
          'viewbox',
          `${coordinates.lng - lngDelta},${coordinates.lat + latDelta},${coordinates.lng + lngDelta},${coordinates.lat - latDelta}`
        );

        const results = await this.fetchJson<any[]>(url);
        for (const item of results) {
          const place = this.nominatimResultToPlace(item, coordinates, kind);
          if (!place) continue;
          const key = `${place.name.toLowerCase()}-${place.coordinates.lat.toFixed(4)}-${place.coordinates.lng.toFixed(4)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          places.push(place);
        }
      } catch (error: any) {
        console.warn(`Recommendation lookup failed for ${query}: ${error.message || error}`);
      }
    }

    return places.sort((a, b) => this.distanceMiles(a.coordinates, coordinates) - this.distanceMiles(b.coordinates, coordinates));
  }

  private queriesForKind(destination: string, kind: RecommendationKind): string[] {
    if (kind === 'restaurant') {
      return [`restaurant ${destination}`, `cafe ${destination}`, `fast food ${destination}`];
    }
    if (kind === 'accommodation') {
      return [`hotel ${destination}`, `motel ${destination}`, `guest house ${destination}`];
    }
    return [
      `park ${destination}`,
      `museum ${destination}`,
      `tourist attraction ${destination}`,
      `temple ${destination}`,
      `historic ${destination}`
    ];
  }

  private nominatimResultToPlace(item: any, origin: Coordinates, kind: RecommendationKind): OpenDataPlace | null {
    const name = item.name || String(item.display_name || '').split(',')[0];
    const coordinates = { lat: Number(item.lat), lng: Number(item.lon) };
    if (!name || !/[a-z]/i.test(name) || name.trim().length < 3) return null;
    if (!Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) return null;
    if (this.distanceMiles(coordinates, origin) > 25) return null;

    const tags = item.extratags || {};
    return {
      name,
      displayName: item.display_name || name,
      type: item.type || item.class || kind,
      category: this.categoryForPlace(item, kind),
      coordinates,
      address: item.display_name,
      tags
    };
  }

  private isUsefulPlace(place: OpenDataPlace, kind: RecommendationKind): boolean {
    if (/\b(private|street lamp|utility|substation|parking lot|hostel|student|housing|dorm)\b/i.test(place.name)) {
      return false;
    }
    if (kind === 'accommodation' && /hostel|student|housing|dorm|residence/i.test(place.name)) return false;
    return true;
  }

  private placeToRecommendation(place: OpenDataPlace, kind: RecommendationKind, request: RecommendationRequest): Recommendation {
    const price = this.estimatePrice(place, kind, request);
    const currency = request.currency || 'USD';

    return {
      id: uuidv4(),
      type: kind === 'attraction' ? 'activity' : kind,
      title: place.name,
      description: this.describePlace(place, kind),
      location: request.destination,
      rating: undefined,
      price: {
        amount: price,
        currency,
        perPerson: kind !== 'accommodation'
      },
      duration: kind === 'restaurant' ? 60 : kind === 'accommodation' ? 480 : 120,
      category: place.category,
      tags: ['open-data', place.category.toLowerCase(), 'verify-before-going'],
      coordinates: place.coordinates,
      address: place.address,
      source: 'open-data',
      verificationNote: 'Found in OpenStreetMap/Nominatim. Verify live hours, availability, and current prices before departure.'
    };
  }

  private honestFallbackRecommendation(destination: string, kind: RecommendationKind, request: RecommendationRequest): Recommendation {
    const currency = request.currency || 'USD';
    const titleByKind = {
      restaurant: `Verified food search plan for ${destination}`,
      accommodation: `Lodging verification plan for ${destination}`,
      activity: `Local experience search plan for ${destination}`,
      attraction: `Local experience search plan for ${destination}`
    };
    const descriptionByKind = {
      restaurant: 'Free open-map search did not return confident restaurant matches. Use this as a checklist: search near your stay, verify hours, and save one backup meal option before leaving.',
      accommodation: 'Free open-map search did not return confident lodging matches. Verify hotel availability and late check-in directly before booking.',
      activity: 'Free open-map search did not return confident attraction matches. Check local tourism pages, parks, and recent traveler posts before deciding.',
      attraction: 'Free open-map search did not return confident attraction matches. Check local tourism pages, parks, and recent traveler posts before deciding.'
    };

    return {
      id: uuidv4(),
      type: kind === 'attraction' ? 'activity' : kind,
      title: titleByKind[kind],
      description: descriptionByKind[kind],
      location: destination,
      price: {
        amount: kind === 'accommodation' ? this.dailyBudget(request, 0.45) : kind === 'restaurant' ? this.dailyBudget(request, 0.12) : 0,
        currency,
        perPerson: kind !== 'accommodation'
      },
      duration: kind === 'restaurant' ? 60 : kind === 'accommodation' ? 480 : 90,
      category: 'Needs verification',
      tags: ['honest-fallback', 'manual-verification-needed'],
      source: 'unavailable',
      verificationNote: 'TravelM8 did not invent a place here because no confident free-data match was found.'
    };
  }

  private describePlace(place: OpenDataPlace, kind: RecommendationKind): string {
    if (kind === 'restaurant') {
      return `${place.name} appears in open map data near this destination. Price is estimated from category and budget context.`;
    }
    if (kind === 'accommodation') {
      return `${place.name} appears in open map data near this destination. Nightly price is estimated; verify availability and live rate before booking.`;
    }
    return `${place.name} appears in open map data near this destination. Verify access, hours, and entry fees before going.`;
  }

  private categoryForPlace(item: any, kind: RecommendationKind): string {
    if (kind === 'restaurant') return item.type || 'restaurant';
    if (kind === 'accommodation') return item.type || 'lodging';
    return item.type || item.class || 'local place';
  }

  private estimatePrice(place: OpenDataPlace, kind: RecommendationKind, request: RecommendationRequest): number {
    const tags = place.tags || {};
    const fee = String(tags.fee || '').toLowerCase();
    if (fee === 'no') return 0;
    if (tags.charge) {
      const parsed = Number(String(tags.charge).replace(/[^0-9.]/g, ''));
      if (Number.isFinite(parsed)) return Math.round(parsed);
    }
    if (kind === 'restaurant') return Math.max(8, Math.round(this.dailyBudget(request, 0.12)));
    if (kind === 'accommodation') return Math.max(45, Math.round(this.dailyBudget(request, 0.45)));
    return fee === 'yes' ? Math.max(5, Math.round(this.dailyBudget(request, 0.06))) : 0;
  }

  private dailyBudget(request: RecommendationRequest, share: number): number {
    const duration = this.calculateDuration(request.startDate, request.endDate);
    const travelers = Math.max(1, request.travelers || 1);
    const totalBudget = request.budget || travelers * duration * 120;
    return totalBudget / Math.max(1, duration) * share;
  }

  private generateTransportGuidance(destination: string, duration: number, request: RecommendationRequest): Recommendation[] {
    const mode = request.preferences.transportMode || 'any';
    const cost = mode === 'walking' ? 0 : mode === 'public' ? duration * 8 : mode === 'rental' ? duration * 55 : duration * 25;
    return [{
      id: uuidv4(),
      type: 'transport',
      title: `${destination} transport plan`,
      description: 'Estimate only. Check local transit, parking, taxi availability, and travel times before each day.',
      location: destination,
      price: {
        amount: cost,
        currency: request.currency || 'USD',
        perPerson: false
      },
      category: mode,
      tags: ['estimated', 'verify-locally'],
      source: 'estimated',
      verificationNote: 'Transport prices vary by city and date; this is a planning estimate.'
    }];
  }

  private generateItinerary(
    request: RecommendationRequest,
    recommendations: RecommendationResponse['recommendations'],
    duration: number
  ): ItineraryDay[] {
    const itinerary: ItineraryDay[] = [];
    const startDate = new Date(request.startDate);

    for (let i = 0; i < duration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const activity = recommendations.activities[i % recommendations.activities.length];
      const secondActivity = recommendations.activities[(i + 1) % recommendations.activities.length];
      const meals = recommendations.restaurants.length > 0
        ? [recommendations.restaurants[i % recommendations.restaurants.length]]
        : [];
      const accommodation = duration > 1 && recommendations.accommodations.length > 0
        ? recommendations.accommodations[0]
        : undefined;
      const transport = i === 0 ? recommendations.transport : [];
      const activities = [activity, secondActivity].filter(Boolean);

      itinerary.push({
        date: currentDate.toISOString().split('T')[0],
        dayNumber: i + 1,
        activities,
        meals,
        accommodation,
        transport,
        estimatedCost: {
          amount: this.sumRecommendationCosts([...activities, ...meals, ...(accommodation ? [accommodation] : []), ...transport]),
          currency: request.currency || 'USD'
        }
      });
    }

    return itinerary;
  }

  private sumRecommendationCosts(items: Recommendation[]): number {
    return Math.round(items.reduce((total, item) => total + (item.price?.amount || 0), 0));
  }

  private calculateTotalCost(itinerary: ItineraryDay[]): { amount: number; currency: string } {
    return {
      amount: Math.round(itinerary.reduce((total, day) => total + day.estimatedCost.amount, 0)),
      currency: itinerary[0]?.estimatedCost.currency || 'USD'
    };
  }

  private calculateBudgetBreakdown(itinerary: ItineraryDay[]) {
    const breakdown = { accommodation: 0, food: 0, activities: 0, transport: 0 };
    for (const day of itinerary) {
      breakdown.activities += this.sumRecommendationCosts(day.activities);
      breakdown.food += this.sumRecommendationCosts(day.meals);
      breakdown.accommodation += day.accommodation?.price?.amount || 0;
      breakdown.transport += this.sumRecommendationCosts(day.transport || []);
    }
    return breakdown;
  }

  private generateTips(
    destination: string,
    duration: number,
    context: { restaurants: Recommendation[]; activities: Recommendation[]; accommodations: Recommendation[]; needsAccommodation: boolean }
  ): string[] {
    const tips = [
      `Every recommendation shown for ${destination} is either open-data based or clearly marked as needing verification.`,
      'OpenStreetMap does not provide guaranteed live hours or live prices, so call or check the map listing before committing.',
      duration <= 1
        ? 'This is a short trip, so TravelM8 is prioritizing food, places, and transport instead of unnecessary motel suggestions.'
        : 'For overnight trips, save one backup lodging option and verify late check-in before departure.',
      context.restaurants.some((item) => item.source === 'unavailable')
        ? 'Food data was sparse, so use the fallback checklist instead of trusting invented restaurants.'
        : 'Save at least one backup restaurant near your stay in case hours change.',
      context.activities.some((item) => item.source === 'unavailable')
        ? 'Local experience data was sparse, so check recent blogs or tourism pages for current events.'
        : 'Prefer places with a visible map location and recent reviews before finalizing the day.'
    ];

    if (!context.needsAccommodation) {
      tips.push('No lodging is shown because this appears to be a same-day or short trip.');
    }

    return tips.slice(0, 6);
  }

  private distanceMiles(origin: Coordinates, destination: Coordinates): number {
    const toRadians = (value: number) => value * Math.PI / 180;
    const radiusMiles = 3958.8;
    const dLat = toRadians(destination.lat - origin.lat);
    const dLng = toRadians(destination.lng - origin.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(origin.lat)) *
        Math.cos(toRadians(destination.lat)) *
        Math.sin(dLng / 2) ** 2;
    return radiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private fetchJson<T>(url: URL | string): Promise<T> {
    return new Promise((resolve, reject) => {
      const request = https.get(url, {
        headers: {
          'User-Agent': 'TravelM8 recommendations (https://github.com/Rohithmatham12/travelm8)'
        }
      }, (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`Request failed with status ${response.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(body) as T);
          } catch (error) {
            reject(error);
          }
        });
      });
      request.on('error', reject);
      request.setTimeout(10000, () => request.destroy(new Error('Request timed out')));
    });
  }
}
