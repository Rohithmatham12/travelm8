import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import {
  RouteRequest,
  RouteResponse,
  RouteStop,
  StopOptionSet,
  RouteSummary,
  OfflineMapPlan,
  SelectedStops,
  FinalItinerary,
  CalendarEvent
} from '../types/route';

interface Coordinates {
  lat: number;
  lng: number;
}

interface OpenMapPlace {
  name: string;
  category: string;
  type: 'poi' | 'restaurant' | 'motel';
  coordinates: Coordinates;
  distanceFromZone: number;
  distanceFromStart: number;
  tags: Record<string, any>;
}

interface RouteZone {
  label: string;
  from: number;
  to: number;
  index: number;
  distanceFromStart: number;
  coordinates: Coordinates;
}

interface RouteEstimate {
  distanceMiles: number;
  durationMinutes: number;
  geometry: Coordinates[];
}

// Verified route data - LA to SF corridor
const VERIFIED_ROUTES: { [key: string]: any } = {
  'los angeles-san francisco': {
    distance: 382,
    driveTime: 360, // 6 hours
    majorCities: ['Los Angeles', 'Santa Clarita', 'Bakersfield', 'Fresno', 'Modesto', 'San Francisco'],
    coordinates: {
      origin: { lat: 34.0522, lng: -118.2437 },
      destination: { lat: 37.7749, lng: -122.4194 }
    }
  },
  'san francisco-los angeles': {
    distance: 382,
    driveTime: 360,
    majorCities: ['San Francisco', 'Modesto', 'Fresno', 'Bakersfield', 'Santa Clarita', 'Los Angeles'],
    coordinates: {
      origin: { lat: 37.7749, lng: -122.4194 },
      destination: { lat: 34.0522, lng: -118.2437 }
    }
  },
  'los angeles-las vegas': {
    distance: 270,
    driveTime: 240,
    majorCities: ['Los Angeles', 'San Bernardino', 'Barstow', 'Primm', 'Las Vegas'],
    coordinates: {
      origin: { lat: 34.0522, lng: -118.2437 },
      destination: { lat: 36.1699, lng: -115.1398 }
    }
  }
};

// Verified POIs along LA-SF route (I-5 corridor)
const VERIFIED_POIS_LA_SF: RouteStop[] = [
  {
    id: 'poi-1',
    name: 'Tejon Ranch Rest Area',
    category: 'viewpoint',
    type: 'poi',
    description: 'Scenic rest area at Tejon Pass with mountain views. Good for stretching legs.',
    coordinates: { lat: 34.8697, lng: -118.8946 },
    address: 'I-5, Lebec, CA 93243',
    detourTime: 0,
    estimatedTimeAtStop: 15,
    rating: 4.0,
    reviewCount: 1250,
    verificationStatus: 'verified',
    distanceFromStart: 65
  },
  {
    id: 'poi-2',
    name: 'Grapevine / Fort Tejon State Historic Park',
    category: 'landmark',
    type: 'poi',
    description: 'Historic 1854 Army fort. Great for history buffs. Has restrooms and picnic area.',
    coordinates: { lat: 34.8750, lng: -118.8983 },
    address: 'Fort Tejon Rd, Lebec, CA 93243',
    detourTime: 5,
    estimatedTimeAtStop: 45,
    rating: 4.5,
    reviewCount: 2100,
    priceEstimate: 6,
    currency: 'USD',
    verificationStatus: 'verified',
    openHours: '9:00 AM - 5:00 PM',
    distanceFromStart: 67
  },
  {
    id: 'poi-3',
    name: 'Buttonwillow Rest Area',
    category: 'rest-stop',
    type: 'poi',
    description: 'Clean rest area with restrooms, vending machines, and pet area.',
    coordinates: { lat: 35.3997, lng: -119.4697 },
    address: 'I-5, Buttonwillow, CA 93206',
    detourTime: 0,
    estimatedTimeAtStop: 15,
    rating: 3.8,
    reviewCount: 890,
    verificationStatus: 'verified',
    distanceFromStart: 120
  },
  {
    id: 'poi-4',
    name: 'Harris Ranch',
    category: 'landmark',
    type: 'poi',
    description: 'Famous cattle ranch with restaurant and inn. Popular road trip stop.',
    coordinates: { lat: 36.2530, lng: -120.2380 },
    address: '24505 W Dorris Ave, Coalinga, CA 93210',
    detourTime: 2,
    estimatedTimeAtStop: 60,
    rating: 4.3,
    reviewCount: 4500,
    verificationStatus: 'verified',
    distanceFromStart: 195
  },
  {
    id: 'poi-5',
    name: 'Casa de Fruta',
    category: 'roadside-attraction',
    type: 'poi',
    description: 'Quirky roadside attraction with shops, peacocks, carousel, and restaurants.',
    coordinates: { lat: 36.8619, lng: -121.4022 },
    address: '10031 Pacheco Pass Hwy, Hollister, CA 95023',
    detourTime: 25,
    estimatedTimeAtStop: 45,
    rating: 4.1,
    reviewCount: 3200,
    verificationStatus: 'verified',
    distanceFromStart: 290
  }
];

// Verified restaurants along LA-SF route
const VERIFIED_RESTAURANTS_LA_SF: RouteStop[] = [
  {
    id: 'food-1',
    name: 'In-N-Out Burger (Kettleman City)',
    category: 'fast-food',
    type: 'restaurant',
    description: 'Classic California burger chain. Quick service, consistently good.',
    coordinates: { lat: 35.9936, lng: -119.9617 },
    address: '33298 Bernard Dr, Kettleman City, CA 93239',
    detourTime: 2,
    estimatedTimeAtStop: 30,
    rating: 4.4,
    reviewCount: 2800,
    priceRange: '$',
    priceEstimate: 12,
    currency: 'USD',
    verificationStatus: 'verified',
    openHours: '10:30 AM - 1:00 AM',
    distanceFromStart: 160
  },
  {
    id: 'food-2',
    name: 'Harris Ranch Restaurant',
    category: 'american',
    type: 'restaurant',
    description: 'Upscale steakhouse famous for beef. Great for a proper sit-down meal.',
    coordinates: { lat: 36.2530, lng: -120.2380 },
    address: '24505 W Dorris Ave, Coalinga, CA 93210',
    detourTime: 2,
    estimatedTimeAtStop: 75,
    rating: 4.2,
    reviewCount: 3100,
    priceRange: '$$',
    priceEstimate: 35,
    currency: 'USD',
    verificationStatus: 'verified',
    openHours: '6:00 AM - 10:00 PM',
    distanceFromStart: 195
  },
  {
    id: 'food-3',
    name: 'Bravo Farms (Traver)',
    category: 'deli',
    type: 'restaurant',
    description: 'Cheese shop and deli with sandwiches. Good quick stop with unique atmosphere.',
    coordinates: { lat: 36.4500, lng: -119.4500 },
    address: '36005 CA-99, Traver, CA 93673',
    detourTime: 8,
    estimatedTimeAtStop: 35,
    rating: 4.3,
    reviewCount: 1900,
    priceRange: '$',
    priceEstimate: 15,
    currency: 'USD',
    verificationStatus: 'verified',
    distanceFromStart: 215
  },
  {
    id: 'food-4',
    name: 'Pea Soup Andersen\'s',
    category: 'american',
    type: 'restaurant',
    description: 'Historic roadside restaurant famous for split pea soup since 1924.',
    coordinates: { lat: 34.6117, lng: -120.1886 },
    address: '376 Avenue of the Flags, Buellton, CA 93427',
    detourTime: 45,
    estimatedTimeAtStop: 45,
    rating: 4.0,
    reviewCount: 2400,
    priceRange: '$$',
    priceEstimate: 20,
    currency: 'USD',
    verificationStatus: 'verified',
    distanceFromStart: 140
  },
  {
    id: 'food-5',
    name: 'Black Bear Diner (Fresno)',
    category: 'american',
    type: 'restaurant',
    description: 'Comfort food diner with large portions. Good breakfast anytime.',
    coordinates: { lat: 36.7378, lng: -119.7871 },
    address: '1590 E Shaw Ave, Fresno, CA 93710',
    detourTime: 10,
    estimatedTimeAtStop: 50,
    rating: 4.1,
    reviewCount: 1650,
    priceRange: '$$',
    priceEstimate: 18,
    currency: 'USD',
    verificationStatus: 'verified',
    openHours: '6:00 AM - 10:00 PM',
    distanceFromStart: 220
  }
];

// Verified motels along LA-SF route
const VERIFIED_MOTELS_LA_SF: RouteStop[] = [
  // Budget-friendly options
  {
    id: 'motel-1',
    name: 'Motel 6 Buttonwillow',
    category: 'motel',
    type: 'motel',
    description: 'Basic, clean motel right off I-5. Pet-friendly, free WiFi.',
    coordinates: { lat: 35.4008, lng: -119.4697 },
    address: '20645 Tracy Ave, Buttonwillow, CA 93206',
    detourTime: 1,
    estimatedTimeAtStop: 480,
    rating: 3.6,
    reviewCount: 420,
    priceRange: '$',
    priceEstimate: 65,
    currency: 'USD',
    verificationStatus: 'verified',
    amenities: ['Free WiFi', 'Pet Friendly', 'Parking'],
    distanceFromStart: 120
  },
  {
    id: 'motel-2',
    name: 'Super 8 by Wyndham Kettleman City',
    category: 'motel',
    type: 'motel',
    description: 'Budget motel near highway. Continental breakfast included.',
    coordinates: { lat: 35.9939, lng: -119.9620 },
    address: '33415 Powers Dr, Kettleman City, CA 93239',
    detourTime: 2,
    estimatedTimeAtStop: 480,
    rating: 3.4,
    reviewCount: 280,
    priceRange: '$',
    priceEstimate: 75,
    currency: 'USD',
    verificationStatus: 'verified',
    amenities: ['Free Breakfast', 'Free WiFi', 'Parking'],
    distanceFromStart: 160
  },
  {
    id: 'motel-3',
    name: 'Travelodge by Wyndham Fresno',
    category: 'motel',
    type: 'motel',
    description: 'Affordable option in Fresno. Pool available, near restaurants.',
    coordinates: { lat: 36.7378, lng: -119.7871 },
    address: '1240 N Crystal Ave, Fresno, CA 93728',
    detourTime: 8,
    estimatedTimeAtStop: 480,
    rating: 3.5,
    reviewCount: 350,
    priceRange: '$',
    priceEstimate: 70,
    currency: 'USD',
    verificationStatus: 'verified',
    amenities: ['Pool', 'Free WiFi', 'Parking'],
    distanceFromStart: 220
  },
  // Top-rated options
  {
    id: 'motel-4',
    name: 'Harris Ranch Inn',
    category: 'hotel',
    type: 'motel',
    description: 'Well-appointed inn at famous cattle ranch. Pool, restaurant on-site.',
    coordinates: { lat: 36.2530, lng: -120.2380 },
    address: '24505 W Dorris Ave, Coalinga, CA 93210',
    detourTime: 2,
    estimatedTimeAtStop: 480,
    rating: 4.3,
    reviewCount: 1850,
    priceRange: '$$',
    priceEstimate: 140,
    currency: 'USD',
    verificationStatus: 'verified',
    amenities: ['Pool', 'Restaurant', 'Free WiFi', 'Fitness Center'],
    distanceFromStart: 195
  },
  {
    id: 'motel-5',
    name: 'Piccadilly Inn Fresno',
    category: 'hotel',
    type: 'motel',
    description: 'Full-service hotel in Fresno. Good for overnight before continuing.',
    coordinates: { lat: 36.8200, lng: -119.8000 },
    address: '2305 W Shaw Ave, Fresno, CA 93711',
    detourTime: 12,
    estimatedTimeAtStop: 480,
    rating: 4.1,
    reviewCount: 980,
    priceRange: '$$',
    priceEstimate: 120,
    currency: 'USD',
    verificationStatus: 'verified',
    amenities: ['Pool', 'Restaurant', 'Free WiFi', 'Business Center'],
    distanceFromStart: 220
  }
];

// Emergency stops (gas, hospitals) - Reserved for future offline map planning
const _EMERGENCY_STOPS_LA_SF: RouteStop[] = [
  {
    id: 'gas-1',
    name: 'Chevron (Gorman)',
    category: 'gas-station',
    type: 'gas',
    description: 'Gas station at Gorman exit. Last gas before Grapevine.',
    coordinates: { lat: 34.7970, lng: -118.8530 },
    address: 'Gorman, CA 93243',
    detourTime: 0,
    estimatedTimeAtStop: 10,
    verificationStatus: 'verified',
    distanceFromStart: 60
  },
  {
    id: 'hospital-1',
    name: 'Kern Medical',
    category: 'hospital',
    type: 'hospital',
    description: 'Major hospital in Bakersfield. Emergency services available.',
    coordinates: { lat: 35.3733, lng: -119.0187 },
    address: '1700 Mount Vernon Ave, Bakersfield, CA 93306',
    detourTime: 15,
    estimatedTimeAtStop: 0,
    verificationStatus: 'verified',
    distanceFromStart: 110
  }
];

export class RoutePlanningService {
  
  async planRoute(request: RouteRequest): Promise<RouteResponse> {
    const routeKey = `${request.origin.toLowerCase()}-${request.destination.toLowerCase()}`;
    const routeData = VERIFIED_ROUTES[routeKey];
    
    if (!routeData) {
      return this.generateGenericRoute(request);
    }
    
    const routeSummary = this.buildRouteSummary(request, routeData);
    const stopOptionSets = this.buildStopOptionSets(request, routeData);
    const { topRated, budgetFriendly } = this.categorizeMotels(request);
    const offlineMapPlan = this.buildOfflineMapPlan(request, routeData);
    
    // Build budget object only with defined properties
    const budget = request.budget ? (() => {
      const budgetObj: { motelPerNight?: number; mealBudget?: number } = {};
      if (request.budget.motelPerNight !== undefined) {
        budgetObj.motelPerNight = request.budget.motelPerNight;
      }
      if (request.budget.mealBudget !== undefined) {
        budgetObj.mealBudget = request.budget.mealBudget;
      }
      return Object.keys(budgetObj).length > 0 ? budgetObj : undefined;
    })() : undefined;
    
    return {
      inputsRecognized: {
        origin: request.origin,
        destination: request.destination,
        date: request.departureDate,
        travelers: request.travelers,
        ...(budget && { budget })
      },
      routeSummary,
      stopOptionSets,
      topRatedMotels: topRated,
      budgetFriendlyMotels: budgetFriendly,
      offlineMapPlan,
      calendarExportReady: true,
      userChoicePrompt: this.generateUserPrompt(request)
    };
  }
  
  private buildRouteSummary(request: RouteRequest, routeData: any): RouteSummary {
    const suggestedStops = this.calculateSuggestedStops(
      routeData.driveTime,
      request.preferences?.stopFrequency || 'moderate'
    );
    
    return {
      origin: request.origin,
      destination: request.destination,
      totalDistance: routeData.distance,
      estimatedDriveTime: routeData.driveTime,
      suggestedStops,
      majorCities: routeData.majorCities
    };
  }
  
  private calculateSuggestedStops(driveTime: number, frequency: string): number {
    const hoursOfDriving = driveTime / 60;
    if (driveTime >= 60 && frequency === 'minimal') return Math.max(1, Math.floor(hoursOfDriving / 3));
    switch (frequency) {
      case 'minimal': return Math.max(0, Math.floor(hoursOfDriving / 3));
      case 'frequent': return Math.max(1, Math.ceil(hoursOfDriving / 1.5));
      default: return Math.max(1, Math.round(hoursOfDriving / 2));
    }
  }
  
  private buildStopOptionSets(request: RouteRequest, routeData: any): StopOptionSet[] {
    const routeKey = `${request.origin.toLowerCase()}-${request.destination.toLowerCase()}`;
    const isLaSf = routeKey.includes('los angeles') && routeKey.includes('san francisco');
    
    if (!isLaSf) {
      return this.generateGenericStopSets(request, routeData);
    }
    
    // Apply budget filtering
    const pois = this.applyBudgetFilter(VERIFIED_POIS_LA_SF, request.budget);
    const restaurants = this.applyBudgetFilter(VERIFIED_RESTAURANTS_LA_SF, request.budget);
    const motels = this.applyBudgetFilter(VERIFIED_MOTELS_LA_SF, request.budget);
    
    return [
      {
        setId: uuidv4(),
        label: 'Stop Option Set 1 (first 2 hours)',
        distanceRange: { from: 0, to: 100 },
        pois: pois.filter(p => p.distanceFromStart <= 100),
        restaurants: restaurants.filter(r => r.distanceFromStart <= 100),
        motels: motels.filter(m => m.distanceFromStart <= 100)
      },
      {
        setId: uuidv4(),
        label: 'Stop Option Set 2 (mid-route)',
        distanceRange: { from: 100, to: 250 },
        pois: pois.filter(p => p.distanceFromStart > 100 && p.distanceFromStart <= 250),
        restaurants: restaurants.filter(r => r.distanceFromStart > 100 && r.distanceFromStart <= 250),
        motels: motels.filter(m => m.distanceFromStart > 100 && m.distanceFromStart <= 250)
      },
      {
        setId: uuidv4(),
        label: 'Overnight Option Set (near midpoint)',
        distanceRange: { from: 150, to: 230 },
        pois: pois.filter(p => p.distanceFromStart > 150 && p.distanceFromStart <= 230),
        restaurants: restaurants.filter(r => r.distanceFromStart > 150 && r.distanceFromStart <= 230),
        motels: motels.filter(m => m.distanceFromStart > 150 && m.distanceFromStart <= 230)
      },
      {
        setId: uuidv4(),
        label: 'Stop Option Set 3 (final stretch)',
        distanceRange: { from: 250, to: 382 },
        pois: pois.filter(p => p.distanceFromStart > 250),
        restaurants: restaurants.filter(r => r.distanceFromStart > 250),
        motels: motels.filter(m => m.distanceFromStart > 250)
      }
    ];
  }
  
  private applyBudgetFilter(stops: RouteStop[], budget?: { motelPerNight?: number; mealBudget?: number }): RouteStop[] {
    return stops.map(stop => {
      let budgetFit: RouteStop['budgetFit'] = 'unknown';
      
      if (typeof stop.priceEstimate === 'number' && budget) {
        if (stop.type === 'motel' && budget.motelPerNight) {
          if (stop.priceEstimate <= budget.motelPerNight) {
            budgetFit = 'within-budget';
          } else if (stop.priceEstimate <= budget.motelPerNight * 1.2) {
            budgetFit = 'slightly-above';
          } else {
            budgetFit = 'above-budget';
          }
        } else if (stop.type === 'restaurant' && budget.mealBudget) {
          if (stop.priceEstimate <= budget.mealBudget) {
            budgetFit = 'within-budget';
          } else if (stop.priceEstimate <= budget.mealBudget * 1.3) {
            budgetFit = 'slightly-above';
          } else {
            budgetFit = 'above-budget';
          }
        }
      }
      
      return { ...stop, budgetFit };
    });
  }
  
  private categorizeMotels(request: RouteRequest): { topRated: RouteStop[]; budgetFriendly: RouteStop[] } {
    const routeKey = `${request.origin.toLowerCase()}-${request.destination.toLowerCase()}`;
    const isLaSf = routeKey.includes('los angeles') && routeKey.includes('san francisco');
    
    let motels = isLaSf ? VERIFIED_MOTELS_LA_SF : [];
    motels = this.applyBudgetFilter(motels, request.budget);
    
    const topRated = [...motels]
      .filter(m => m.rating && m.rating >= 4.0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
    
    const budgetFriendly = [...motels]
      .filter(m => m.budgetFit === 'within-budget' || m.budgetFit === 'slightly-above')
      .sort((a, b) => (a.priceEstimate || 999) - (b.priceEstimate || 999))
      .slice(0, 3);
    
    return { topRated, budgetFriendly };
  }
  
  private buildOfflineMapPlan(request: RouteRequest, routeData: any): OfflineMapPlan {
    return {
      corridorWidth: 25,
      regions: [
        {
          name: `${request.origin} metro area`,
          coordinates: routeData.coordinates.origin,
          radius: 30
        },
        {
          name: 'I-5 Corridor (Grapevine)',
          coordinates: { lat: 34.87, lng: -118.89 },
          radius: 20
        },
        {
          name: 'Central Valley (Fresno area)',
          coordinates: { lat: 36.74, lng: -119.79 },
          radius: 40
        },
        {
          name: `${request.destination} metro area`,
          coordinates: routeData.coordinates.destination,
          radius: 30
        }
      ],
      instructions: [
        `Download route corridor: ${routeData.distance} miles, ${this.corridorWidth || 25} mile radius`,
        'Pin your selected stops for offline access',
        'Save itinerary snapshot locally before departure',
        'Download emergency stops (gas stations, hospitals) along route',
        'Enable offline navigation in your maps app'
      ],
      estimatedDownloadSize: '~450 MB'
    };
  }
  
  private generateUserPrompt(_request: RouteRequest): string {
    return `Please select your preferences:
1. Choose 3-5 POIs from the Stop Option Sets above
2. Select 1-2 restaurants for your meals
3. Pick 1 motel if you need an overnight stay
4. Confirm departure time

After you make your selections, I'll generate:
- A finalized itinerary with exact timing
- Calendar-ready events you can export
- Offline map download instructions`;
  }
  
  private async generateGenericRoute(request: RouteRequest): Promise<RouteResponse> {
    const originCoords = await this.geocodeLocation(request.origin);
    const destinationCoords = await this.geocodeLocation(request.destination);
    const routeEstimate = await this.fetchRouteEstimate(originCoords, destinationCoords);
    const estimatedDistance = routeEstimate.distanceMiles;
    const estimatedTime = routeEstimate.durationMinutes;
    const suggestedStops = this.calculateSuggestedStops(
      estimatedTime,
      request.preferences?.stopFrequency || 'moderate'
    );
    const routeData = {
      distance: estimatedDistance,
      driveTime: estimatedTime,
      majorCities: [request.origin, request.destination],
      coordinates: {
        origin: originCoords,
        destination: destinationCoords
      },
      geometry: routeEstimate.geometry
    };
    const stopOptionSets = await this.generateRouteAwareStopSets(request, routeData);
    const motels = stopOptionSets.flatMap((set) => set.motels);
    const budgetFriendlyMotels = [...motels]
      .filter((motel) => motel.budgetFit === 'within-budget' || motel.budgetFit === 'slightly-above')
      .slice(0, 3);
    
    const budget = request.budget ? {
      ...(request.budget.motelPerNight !== undefined && { motelPerNight: request.budget.motelPerNight }),
      ...(request.budget.mealBudget !== undefined && { mealBudget: request.budget.mealBudget })
    } : undefined;
    
    return {
      inputsRecognized: {
        origin: request.origin,
        destination: request.destination,
        date: request.departureDate,
        travelers: request.travelers,
        ...(budget && Object.keys(budget).length > 0 && { budget })
      },
      routeSummary: {
        origin: request.origin,
        destination: request.destination,
        totalDistance: estimatedDistance,
        estimatedDriveTime: estimatedTime,
        suggestedStops,
        majorCities: [request.origin, request.destination]
      },
      stopOptionSets,
      topRatedMotels: motels.slice(0, 3),
      budgetFriendlyMotels,
      offlineMapPlan: {
        corridorWidth: 25,
        regions: [
          { name: `${request.origin} start area`, coordinates: originCoords, radius: 25 },
          { name: `${request.destination} arrival area`, coordinates: destinationCoords, radius: 25 }
        ],
        instructions: [
          `Download a ${Math.round(estimatedDistance)} mile route corridor before departure.`,
          'Save each suggested stop zone, address, and phone number before low-signal stretches.',
          'Keep one backup food stop and one backup overnight stop near the midpoint.',
          'Re-check live opening hours and prices before booking.'
        ],
        estimatedDownloadSize: `~${Math.max(120, Math.round(estimatedDistance * 1.1))} MB`
      },
      calendarExportReady: false,
      userChoicePrompt: `I estimated this route with free open-data services. Select stop zones to build a timed itinerary, then verify exact businesses before departure.`
    };
  }

  private async geocodeLocation(location: string): Promise<Coordinates> {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('q', location);

    const data = await this.fetchJson<Array<{ lat: string; lon: string }>>(url, {
      headers: {
        'User-Agent': 'TravelM8 route planner demo (https://github.com/Rohithmatham12/travelm8)'
      }
    });
    const first = data[0];
    if (!first) {
      throw new Error(`No coordinates found for ${location}`);
    }

    return {
      lat: Number(first.lat),
      lng: Number(first.lon)
    };
  }

  private async fetchRouteEstimate(origin: Coordinates, destination: Coordinates): Promise<RouteEstimate> {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    try {
      const data = await this.fetchJson<{ routes?: Array<{ distance: number; duration: number; geometry?: { coordinates?: [number, number][] } }> }>(url);
      const route = data.routes?.[0];
      if (route) {
        return {
          distanceMiles: Math.round(route.distance / 1609.344),
          durationMinutes: Math.round(route.duration / 60),
          geometry: this.normalizeRouteGeometry(route.geometry?.coordinates, origin, destination)
        };
      }
    } catch (error) {
      console.warn('OSRM route estimate failed; using distance fallback');
    }

    const fallbackDistance = this.haversineMiles(origin, destination) * 1.25;
    return {
      distanceMiles: Math.round(fallbackDistance),
      durationMinutes: Math.round(fallbackDistance * 1.2),
      geometry: [origin, destination]
    };
  }

  private async generateRouteAwareStopSets(request: RouteRequest, routeData: any): Promise<StopOptionSet[]> {
    const distance = Math.max(routeData.distance, 1);
    const driveHours = routeData.driveTime / 60;
    const longDrive = driveHours >= 4;
    const lateDeparture = Number((request.departureTime || '08:00').split(':')[0]) >= 18;
    const zoneDefinitions = distance < 120
      ? [{ label: 'Mid-route checkpoint', from: 0.42, to: 0.58 }]
      : distance < 220
        ? [
            { label: 'Early reset zone', from: 0.25, to: 0.4 },
            { label: 'Meal and fatigue checkpoint', from: 0.58, to: 0.72 }
          ]
        : [
            { label: 'Early reset zone', from: 0.2, to: 0.35 },
            { label: 'Meal and fatigue checkpoint', from: 0.45, to: 0.6 },
            { label: 'Final stretch backup zone', from: 0.7, to: 0.85 }
          ];
    const zones: RouteZone[] = zoneDefinitions.map((zone, index) => {
      const midpointRatio = (zone.from + zone.to) / 2;
      return {
        ...zone,
        index,
        distanceFromStart: Math.round(distance * midpointRatio),
        coordinates: this.coordinateAtRouteRatio(
          routeData.geometry,
          routeData.coordinates.origin,
          routeData.coordinates.destination,
          midpointRatio
        )
      };
    });
    const openMapPlaces = await this.fetchOpenMapPlacesByZone(zones);

    return zones.map((zone, index) => {
      const mealBudget = request.budget?.mealBudget || 18;
      const motelBudget = request.budget?.motelPerNight || 90;
      const places = openMapPlaces.get(index);

      const fallbackPoi = this.withStopScoring(this.buildRouteStopFromPlace(undefined, {
        id: `route-poi-${index + 1}`,
        name: `${zone.label} rest stop zone`,
        category: longDrive ? 'fatigue-break' : 'route-break',
        type: 'poi',
        description: longDrive
          ? 'Suggested stretch/rest zone based on drive duration. Choose a real rest area, park, cafe, or viewpoint nearby before departure.'
          : 'Suggested short break zone to keep the route comfortable without adding a large detour.',
        coordinates: zone.coordinates,
        detourTime: 10,
        estimatedTimeAtStop: longDrive ? 25 : 15,
        verificationStatus: 'partially-verified',
        distanceFromStart: zone.distanceFromStart,
        source: 'free-route-estimate',
        riskFlags: longDrive ? ['fatigue-risk'] : []
      }), request);
      const pois = places?.poi?.length
        ? places.poi.slice(0, 3).map((place, placeIndex) =>
            this.withStopScoring(this.buildRouteStopFromPlace(place, {
              ...fallbackPoi,
              id: `route-poi-${index + 1}-${placeIndex + 1}`,
              distanceFromStart: place.distanceFromStart
            }), request)
          )
        : [fallbackPoi];

      const fallbackRestaurant = this.withStopScoring(this.buildRouteStopFromPlace(undefined, {
        id: `route-food-${index + 1}`,
        name: this.mealNameForTime(request.departureTime, index),
        category: 'meal-search-zone',
        type: 'restaurant',
        description: `Find food around this route segment. Target meals under $${mealBudget}/person and verify opening hours before leaving.`,
        coordinates: zone.coordinates,
        detourTime: 12,
        estimatedTimeAtStop: 40,
        priceRange: mealBudget <= 15 ? '$' : '$$',
        priceEstimate: mealBudget,
        currency: 'USD',
        verificationStatus: 'partially-verified',
        openHours: 'Verify live hours',
        distanceFromStart: zone.distanceFromStart,
        source: 'free-route-estimate'
      }, mealBudget), request);
      const restaurants = places?.restaurant?.length
        ? places.restaurant.slice(0, 3).map((place, placeIndex) =>
            this.withStopScoring(this.buildRouteStopFromPlace(place, {
              ...fallbackRestaurant,
              id: `route-food-${index + 1}-${placeIndex + 1}`,
              distanceFromStart: place.distanceFromStart
            }, mealBudget), request)
          )
        : [fallbackRestaurant];

      const shouldShowMotelBackup = longDrive || lateDeparture || distance > 180;
      const fallbackMotel = shouldShowMotelBackup ? this.withStopScoring(this.buildRouteStopFromPlace(undefined, {
        id: `route-motel-${index + 1}`,
        name: lateDeparture || longDrive ? `${zone.label} overnight backup` : `${zone.label} motel backup`,
        category: 'overnight-search-zone',
        type: 'motel',
        description: lateDeparture
          ? 'Late-departure backup zone. Prefer booking before the drive if arrival may be after 10 PM.'
          : 'Backup overnight zone if fatigue, weather, or traffic makes the full drive uncomfortable.',
        coordinates: zone.coordinates,
        detourTime: 15,
        estimatedTimeAtStop: 480,
        priceRange: motelBudget <= 90 ? '$' : '$$',
        priceEstimate: motelBudget,
        currency: 'USD',
        verificationStatus: 'partially-verified',
        amenities: ['Verify parking', 'Verify late check-in', 'Save phone number'],
        distanceFromStart: zone.distanceFromStart,
        source: 'free-route-estimate',
        riskFlags: lateDeparture ? ['late-night-arrival-risk'] : []
      }, motelBudget), request) : null;
      const motels = !shouldShowMotelBackup
        ? []
        : places?.motel?.length
          ? places.motel.slice(0, 3).map((place, placeIndex) =>
            this.withStopScoring(this.buildRouteStopFromPlace(place, {
              ...fallbackMotel!,
              id: `route-motel-${index + 1}-${placeIndex + 1}`,
              distanceFromStart: place.distanceFromStart
            }, motelBudget), request)
          )
          : (fallbackMotel ? [fallbackMotel] : []);

      return {
        setId: uuidv4(),
        label: zone.label,
        distanceRange: {
          from: Math.round(distance * zone.from),
          to: Math.round(distance * zone.to)
        },
        pois,
        restaurants,
        motels
      };
    });
  }

  private withStopScoring(stop: RouteStop, request: RouteRequest): RouteStop {
    const budgetedStop = this.applyBudgetFilter([stop], request.budget)[0] || stop;
    const priceScore = budgetedStop.budgetFit === 'above-budget' ? 10 : 25;
    const detourScore = Math.max(0, 25 - stop.detourTime);
    const verificationScore = stop.verificationStatus === 'verified' ? 30 : 15;
    const timingScore = stop.riskFlags?.length ? 10 : 20;

    return {
      ...budgetedStop,
      confidenceScore: Math.min(100, priceScore + detourScore + verificationScore + timingScore),
      whyRecommended: [
        `${stop.distanceFromStart} miles from start`,
        `${stop.detourTime} minute estimated detour`,
        typeof stop.priceEstimate === 'number' ? `Estimated price around $${stop.priceEstimate}` : 'Useful timing for a safe break',
        stop.verificationStatus === 'verified' ? 'Verified stop record' : 'Open-data route estimate; verify exact place before departure'
      ]
    };
  }

  private buildRouteStopFromPlace(place: OpenMapPlace | undefined, fallback: RouteStop, targetPrice?: number): RouteStop {
    if (!place) return fallback;

    const detourTime = Math.max(3, Math.min(25, Math.round(place.distanceFromZone * 4)));
    const priceEstimate = this.estimateOpenMapPrice(place, fallback, targetPrice);
    const addressParts = [
      place.tags['addr:housenumber'],
      place.tags['addr:street'],
      place.tags['addr:city']
    ].filter(Boolean);

    return {
      ...fallback,
      name: place.name,
      category: place.category,
      description: this.describeOpenMapPlace(place, fallback),
      coordinates: place.coordinates,
      address: addressParts.length > 0 ? addressParts.join(' ') : fallback.address,
      detourTime,
      priceEstimate,
      priceRange: this.priceRangeForEstimate(priceEstimate, place.type),
      verificationStatus: 'partially-verified',
      source: 'open-data',
      openHours: place.tags.opening_hours || fallback.openHours,
      amenities: fallback.amenities,
      whyRecommended: [
        `${fallback.distanceFromStart} miles from start`,
        `${detourTime} minute estimated detour`,
        'Found in OpenStreetMap near this route segment',
        'Verify hours, prices, and availability before departure'
      ]
    };
  }

  private describeOpenMapPlace(place: OpenMapPlace, fallback: RouteStop): string {
    if (place.type === 'restaurant') {
      return `${place.name} appears in OpenStreetMap near this route segment. Food price is an estimate from category and budget context; verify current menu and hours before leaving.`;
    }
    if (place.type === 'motel') {
      return `${place.name} appears in OpenStreetMap near this route segment. Nightly price is an estimate from lodging type and budget context; verify live price and late check-in before booking.`;
    }
    return `${place.name} appears in OpenStreetMap near this route segment. Most route-break stops are free, but verify access, parking, and hours before departure.`;
  }

  private estimateOpenMapPrice(place: OpenMapPlace, fallback: RouteStop, targetPrice?: number): number | undefined {
    const feeTag = String(place.tags.fee || '').toLowerCase();
    if (feeTag === 'no') return 0;
    if (place.tags.charge) {
      const charge = Number(String(place.tags.charge).replace(/[^0-9.]/g, ''));
      if (Number.isFinite(charge) && charge >= 0) return Math.round(charge);
    }

    if (place.type === 'restaurant') {
      if (place.tags.amenity === 'fast_food') return 12;
      if (place.tags.amenity === 'cafe') return 14;
      return Math.min(Math.max(Math.round((targetPrice || fallback.priceEstimate || 18) * 0.95), 15), 28);
    }

    if (place.type === 'motel') {
      const baseline = place.tags.tourism === 'motel' ? 85 : place.tags.tourism === 'guest_house' ? 95 : 125;
      return Math.min(Math.max(Math.round((targetPrice || fallback.priceEstimate || baseline) * 0.9), baseline), 180);
    }

    return feeTag === 'yes' ? 10 : 0;
  }

  private priceRangeForEstimate(priceEstimate: number | undefined, type: OpenMapPlace['type']): string | undefined {
    if (typeof priceEstimate !== 'number') return undefined;
    if (type === 'motel') {
      if (priceEstimate <= 90) return '$';
      if (priceEstimate <= 150) return '$$';
      return '$$$';
    }
    if (priceEstimate <= 15) return '$';
    if (priceEstimate <= 30) return '$$';
    return '$$$';
  }

  private async fetchOpenMapPlacesByZone(zones: RouteZone[]): Promise<Map<number, { poi: OpenMapPlace[]; restaurant: OpenMapPlace[]; motel: OpenMapPlace[] }>> {
    const result = new Map<number, { poi: OpenMapPlace[]; restaurant: OpenMapPlace[]; motel: OpenMapPlace[] }>();
    zones.forEach((zone) => result.set(zone.index, { poi: [], restaurant: [], motel: [] }));

    for (const zone of zones) {
      try {
        const data = await this.fetchOpenMapPlacesForZone(zone);
        const bucket = result.get(zone.index) || { poi: [], restaurant: [], motel: [] };

        for (const element of data.elements || []) {
          const place = this.elementToOpenMapPlace(element, [zone]);
        if (!place) continue;

          if (place.distanceFromZone > 12) continue;

          const alreadyIncluded = bucket[place.type].some((existing) =>
            existing.name.toLowerCase() === place.name.toLowerCase()
          );
          if (!alreadyIncluded) bucket[place.type].push(place);
        }

        bucket.poi.sort((a, b) => a.distanceFromZone - b.distanceFromZone);
        bucket.restaurant.sort((a, b) => a.distanceFromZone - b.distanceFromZone);
        bucket.motel.sort((a, b) => a.distanceFromZone - b.distanceFromZone);
        result.set(zone.index, bucket);
      } catch (error: any) {
        console.warn(`OpenStreetMap place lookup failed for ${zone.label}; using fallback: ${error.message || error}`);
      }

      const bucket = result.get(zone.index) || { poi: [], restaurant: [], motel: [] };
      if (bucket.poi.length === 0 || bucket.restaurant.length === 0 || bucket.motel.length === 0) {
        const nominatimPlaces = await this.fetchNominatimPlacesForZone(zone, bucket);
        for (const place of nominatimPlaces) {
          const alreadyIncluded = bucket[place.type].some((existing) =>
            existing.name.toLowerCase() === place.name.toLowerCase()
          );
          if (!alreadyIncluded) bucket[place.type].push(place);
        }
        bucket.poi.sort((a, b) => a.distanceFromZone - b.distanceFromZone);
        bucket.restaurant.sort((a, b) => a.distanceFromZone - b.distanceFromZone);
        bucket.motel.sort((a, b) => a.distanceFromZone - b.distanceFromZone);
        result.set(zone.index, bucket);
      }
    }

    return result;
  }

  private async fetchOpenMapPlacesForZone(zone: RouteZone): Promise<{ elements?: any[] }> {
    const radius = 12000;
    const { lat, lng } = zone.coordinates;
    const query = `[out:json][timeout:8];(
      node(around:${radius},${lat},${lng})["amenity"~"^(restaurant|cafe|fast_food|food_court)$"]["name"];
      way(around:${radius},${lat},${lng})["amenity"~"^(restaurant|cafe|fast_food|food_court)$"]["name"];
      node(around:${radius},${lat},${lng})["tourism"~"^(hotel|motel|guest_house)$"]["name"];
      way(around:${radius},${lat},${lng})["tourism"~"^(hotel|motel|guest_house)$"]["name"];
      node(around:${radius},${lat},${lng})["tourism"~"^(attraction|viewpoint)$"]["name"];
      way(around:${radius},${lat},${lng})["tourism"~"^(attraction|viewpoint)$"]["name"];
      node(around:${radius},${lat},${lng})["leisure"="park"]["name"];
      way(around:${radius},${lat},${lng})["leisure"="park"]["name"];
      node(around:${radius},${lat},${lng})["highway"="rest_area"];
      way(around:${radius},${lat},${lng})["highway"="rest_area"];
    );out center 80;`;
    const url = new URL('https://overpass-api.de/api/interpreter');
    url.searchParams.set('data', query);
    return this.fetchJson<{ elements?: any[] }>(url, {
      headers: {
        'User-Agent': 'TravelM8 route planner demo (https://github.com/Rohithmatham12/travelm8)'
      }
    });
  }

  private async fetchNominatimPlacesForZone(
    zone: RouteZone,
    existing: { poi: OpenMapPlace[]; restaurant: OpenMapPlace[]; motel: OpenMapPlace[] }
  ): Promise<OpenMapPlace[]> {
    const searches: Array<{ type: OpenMapPlace['type']; query: string }> = [];
    if (existing.restaurant.length === 0) searches.push({ type: 'restaurant', query: 'restaurant' });
    if (existing.motel.length === 0) searches.push({ type: 'motel', query: 'hotel' });
    if (existing.poi.length === 0) searches.push({ type: 'poi', query: 'park' });

    const places: OpenMapPlace[] = [];
    for (const search of searches) {
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        const latDelta = 0.18;
        const lngDelta = 0.18;
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '4');
        url.searchParams.set('q', search.query);
        url.searchParams.set('bounded', '1');
        url.searchParams.set(
          'viewbox',
          `${zone.coordinates.lng - lngDelta},${zone.coordinates.lat + latDelta},${zone.coordinates.lng + lngDelta},${zone.coordinates.lat - latDelta}`
        );
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('extratags', '1');
        const data = await this.fetchJson<any[]>(url, {
          headers: {
            'User-Agent': 'TravelM8 route planner demo (https://github.com/Rohithmatham12/travelm8)'
          }
        });

        for (const item of data) {
          const coordinates = { lat: Number(item.lat), lng: Number(item.lon) };
          if (!Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) continue;

          const name = item.name || String(item.display_name || '').split(',')[0];
          if (!this.isUsefulOpenMapName(name)) continue;
          if (search.type === 'poi' && this.isWeakPoiCandidate(name, item)) continue;
          if (search.type === 'motel' && this.isWeakLodgingCandidate(name)) continue;

          places.push({
            name,
            category: item.type || item.class || search.type,
            type: search.type,
            coordinates,
            distanceFromZone: this.haversineMiles(coordinates, zone.coordinates),
            distanceFromStart: zone.distanceFromStart,
            tags: {
              ...(item.extratags || {}),
              ...(search.type === 'restaurant' && { amenity: item.type || 'restaurant' }),
              ...(search.type === 'motel' && { tourism: item.type || 'hotel' })
            }
          });
        }
      } catch (error: any) {
        console.warn(`Nominatim ${search.type} lookup failed for ${zone.label}: ${error.message || error}`);
      }
    }

    return places;
  }

  private isUsefulOpenMapName(name: string): boolean {
    return /[a-z]/i.test(name) && name.trim().length >= 3;
  }

  private isWeakLodgingCandidate(name: string): boolean {
    return /hostel|student|housing|dorm|residence hall/i.test(name);
  }

  private isWeakPoiCandidate(name: string, item: any): boolean {
    const access = String(item.extratags?.access || item.tags?.access || '').toLowerCase();
    return access === 'private' || /\b(private|street lamp|lamp|utility|substation|parking lot)\b/i.test(name);
  }

  private elementToOpenMapPlace(element: any, zones: RouteZone[]): OpenMapPlace | null {
    const tags = element.tags || {};
    const name = tags.name || tags.brand || tags.operator;
    const coordinates = {
      lat: Number(element.lat ?? element.center?.lat),
      lng: Number(element.lon ?? element.center?.lon)
    };

    if (!name || !this.isUsefulOpenMapName(name) || !Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) {
      return null;
    }

    const type = this.openMapStopType(tags);
    if (!type) return null;
    if (type === 'motel' && this.isWeakLodgingCandidate(name)) return null;
    if (type === 'poi' && this.isWeakPoiCandidate(name, { tags })) return null;

    const nearest = this.nearestZone(coordinates, zones);
    if (!nearest) return null;

    return {
      name,
      category: this.openMapCategory(tags, type),
      type,
      coordinates,
      distanceFromZone: this.haversineMiles(coordinates, nearest.coordinates),
      distanceFromStart: nearest.distanceFromStart,
      tags
    };
  }

  private openMapStopType(tags: Record<string, any>): OpenMapPlace['type'] | null {
    if (['restaurant', 'cafe', 'fast_food', 'food_court'].includes(tags.amenity)) return 'restaurant';
    if (['hotel', 'motel', 'guest_house'].includes(tags.tourism)) return 'motel';
    if (tags.highway === 'rest_area' || tags.amenity === 'parking' || tags.tourism || tags.leisure === 'park' || tags.historic) return 'poi';
    return null;
  }

  private openMapCategory(tags: Record<string, any>, type: OpenMapPlace['type']): string {
    if (type === 'restaurant') return tags.cuisine || tags.amenity || 'food';
    if (type === 'motel') return tags.tourism || 'lodging';
    if (tags.highway === 'rest_area') return 'rest area';
    if (tags.amenity === 'parking') return 'parking/rest stop';
    return tags.tourism || tags.leisure || tags.historic || 'route stop';
  }

  private nearestZone(coordinates: Coordinates, zones: RouteZone[]): RouteZone | null {
    let nearest: RouteZone | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const zone of zones) {
      const distance = this.haversineMiles(coordinates, zone.coordinates);
      if (distance < nearestDistance) {
        nearest = zone;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  private mealNameForTime(departureTime = '08:00', index: number): string {
    const hour = Number(departureTime.split(':')[0]);
    if (hour < 10 && index === 0) return 'Breakfast search zone';
    if (hour < 15 && index <= 1) return index === 0 ? 'Lunch search zone' : 'Coffee/snack search zone';
    return index === 0 ? 'Dinner search zone' : 'Late meal backup zone';
  }

  private normalizeRouteGeometry(coordinates: [number, number][] | undefined, origin: Coordinates, destination: Coordinates): Coordinates[] {
    if (!coordinates || coordinates.length < 2) return [origin, destination];
    return coordinates
      .map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }))
      .filter((coordinate) => Number.isFinite(coordinate.lat) && Number.isFinite(coordinate.lng));
  }

  private coordinateAtRouteRatio(geometry: Coordinates[] | undefined, origin: Coordinates, destination: Coordinates, ratio: number): Coordinates {
    if (!geometry || geometry.length < 2) {
      return this.interpolateCoordinates(origin, destination, ratio);
    }

    const index = Math.max(0, Math.min(geometry.length - 1, Math.round((geometry.length - 1) * ratio)));
    return geometry[index];
  }

  private interpolateCoordinates(origin: Coordinates, destination: Coordinates, ratio: number): Coordinates {
    return {
      lat: Number((origin.lat + (destination.lat - origin.lat) * ratio).toFixed(5)),
      lng: Number((origin.lng + (destination.lng - origin.lng) * ratio).toFixed(5))
    };
  }

  private haversineMiles(origin: Coordinates, destination: Coordinates): number {
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

  private fetchJson<T>(url: URL | string, options: { headers?: Record<string, string> } = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const request = https.get(url, { headers: options.headers }, (response) => {
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
      request.setTimeout(10000, () => {
        request.destroy(new Error('Request timed out'));
      });
    });
  }
  
  private generateGenericStopSets(_request: RouteRequest, routeData: any): StopOptionSet[] {
    return [{
      setId: uuidv4(),
      label: 'Generic Stop Options',
      distanceRange: { from: 0, to: routeData.distance },
      pois: [],
      restaurants: [],
      motels: []
    }];
  }
  
  async generateFinalItinerary(request: RouteRequest, selections: SelectedStops): Promise<FinalItinerary> {
    const routeKey = `${request.origin.toLowerCase()}-${request.destination.toLowerCase()}`;
    const routeData = VERIFIED_ROUTES[routeKey];

    const routePlan = routeData ? null : await this.planRoute(request);
    const allStops = routeData
      ? [...VERIFIED_POIS_LA_SF, ...VERIFIED_RESTAURANTS_LA_SF, ...VERIFIED_MOTELS_LA_SF]
      : routePlan!.stopOptionSets.flatMap((set) => [...set.pois, ...set.restaurants, ...set.motels]);
    const selectedStops = (selections.selectedStopSnapshots && selections.selectedStopSnapshots.length > 0
      ? selections.selectedStopSnapshots
      : allStops.filter(stop =>
      selections.selectedPois.includes(stop.id) ||
      selections.selectedRestaurants.includes(stop.id) ||
      selections.selectedMotel === stop.id
    )).sort((a, b) => a.distanceFromStart - b.distanceFromStart);
    
    const routeSummary = routeData ? this.buildRouteSummary(request, routeData) : routePlan!.routeSummary;
    const calendarEvents = this.generateCalendarEvents(request, selectedStops, selections.departureTime, routeSummary.totalDistance);
    const offlineMapPlan = routeData ? this.buildOfflineMapPlan(request, routeData) : routePlan!.offlineMapPlan;
    const totalCost = this.calculateTotalCost(selectedStops, request.travelers, routeSummary.totalDistance);
    
    return {
      routeSummary,
      stops: selectedStops,
      calendarEvents,
      offlineMapPlan,
      totalEstimatedCost: totalCost
    };
  }
  
  private generateCalendarEvents(request: RouteRequest, stops: RouteStop[], departureTime: string, totalDistance?: number): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    let currentTime = new Date(`${request.departureDate}T${departureTime}`);
    
    // Departure event
    events.push({
      id: uuidv4(),
      title: `Depart from ${request.origin}`,
      description: `Start your road trip to ${request.destination}`,
      startTime: currentTime.toISOString(),
      endTime: currentTime.toISOString(),
      location: request.origin,
      type: 'drive'
    });
    
    // Add stops with drive times between them
    let lastDistance = 0;
    for (const stop of stops) {
      // Calculate drive time to this stop (assume 60 mph average)
      const driveDistance = stop.distanceFromStart - lastDistance;
      const driveMinutes = Math.round(driveDistance * 1); // 1 min per mile approx
      
      currentTime = new Date(currentTime.getTime() + driveMinutes * 60000);
      const stopEndTime = new Date(currentTime.getTime() + stop.estimatedTimeAtStop * 60000);
      
      events.push({
        id: uuidv4(),
        title: stop.name,
        description: stop.description,
        startTime: currentTime.toISOString(),
        endTime: stopEndTime.toISOString(),
        ...(stop.address && { location: stop.address }),
        coordinates: stop.coordinates,
        type: stop.type === 'restaurant' ? 'meal' : stop.type === 'motel' ? 'overnight' : 'stop'
      });
      
      currentTime = stopEndTime;
      lastDistance = stop.distanceFromStart;
    }
    
    // Arrival event
    const routeData = VERIFIED_ROUTES[`${request.origin.toLowerCase()}-${request.destination.toLowerCase()}`];
    const fullDistance = totalDistance || routeData?.distance;
    if (fullDistance) {
      const remainingDistance = fullDistance - lastDistance;
      const remainingMinutes = Math.round(remainingDistance * 1);
      currentTime = new Date(currentTime.getTime() + remainingMinutes * 60000);
    }
    
    events.push({
      id: uuidv4(),
      title: `Arrive at ${request.destination}`,
      description: 'End of road trip',
      startTime: currentTime.toISOString(),
      endTime: currentTime.toISOString(),
      location: request.destination,
      type: 'drive'
    });
    
    return events;
  }
  
  private calculateTotalCost(stops: RouteStop[], travelers: number, routeDistance = 382): FinalItinerary['totalEstimatedCost'] {
    let motels = 0;
    let meals = 0;
    let activities = 0;
    
    for (const stop of stops) {
      if (stop.type === 'motel' && stop.priceEstimate) {
        motels += stop.priceEstimate;
      } else if (stop.type === 'restaurant' && stop.priceEstimate) {
        meals += stop.priceEstimate * travelers;
      } else if (stop.type === 'poi' && stop.priceEstimate) {
        activities += stop.priceEstimate * travelers;
      }
    }
    
    // Estimate gas cost (assume 30 mpg, $4/gallon)
    const gas = Math.round(routeDistance / 30 * 4);
    
    return {
      amount: motels + meals + activities + gas,
      currency: 'USD',
      breakdown: { motels, meals, activities, gas }
    };
  }
  
  private corridorWidth = 25;
}
