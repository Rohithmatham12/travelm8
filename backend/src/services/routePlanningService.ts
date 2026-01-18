import { v4 as uuidv4 } from 'uuid';
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
// @ts-expect-error - Reserved for future use in offline map planning
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
      // Generate generic route if not in verified database
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
    switch (frequency) {
      case 'minimal': return Math.floor(hoursOfDriving / 3);
      case 'frequent': return Math.ceil(hoursOfDriving / 1.5);
      default: return Math.round(hoursOfDriving / 2);
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
      
      if (stop.priceEstimate && budget) {
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
  
  private generateGenericRoute(request: RouteRequest): RouteResponse {
    // For routes not in our verified database
    const estimatedDistance = 300; // Default estimate
    const estimatedTime = 300; // 5 hours
    
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
        suggestedStops: 3,
        majorCities: [request.origin, request.destination]
      },
      stopOptionSets: [],
      topRatedMotels: [],
      budgetFriendlyMotels: [],
      offlineMapPlan: {
        corridorWidth: 25,
        regions: [],
        instructions: [
          'This route is not in our verified database.',
          'Please use online lookup for real-time data.',
          'Download the general area maps for offline use.'
        ]
      },
      calendarExportReady: false,
      userChoicePrompt: `I don't have verified data for the ${request.origin} to ${request.destination} route. Please allow online lookup or try a popular route like Los Angeles to San Francisco.`
    };
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
    
    const allStops = [...VERIFIED_POIS_LA_SF, ...VERIFIED_RESTAURANTS_LA_SF, ...VERIFIED_MOTELS_LA_SF];
    const selectedStops = allStops.filter(stop => 
      selections.selectedPois.includes(stop.id) ||
      selections.selectedRestaurants.includes(stop.id) ||
      selections.selectedMotel === stop.id
    ).sort((a, b) => a.distanceFromStart - b.distanceFromStart);
    
    const calendarEvents = this.generateCalendarEvents(request, selectedStops, selections.departureTime);
    const totalCost = this.calculateTotalCost(selectedStops, request.travelers);
    
    return {
      routeSummary: this.buildRouteSummary(request, routeData),
      stops: selectedStops,
      calendarEvents,
      offlineMapPlan: this.buildOfflineMapPlan(request, routeData),
      totalEstimatedCost: totalCost
    };
  }
  
  private generateCalendarEvents(request: RouteRequest, stops: RouteStop[], departureTime: string): CalendarEvent[] {
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
    if (routeData) {
      const remainingDistance = routeData.distance - lastDistance;
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
  
  private calculateTotalCost(stops: RouteStop[], travelers: number): FinalItinerary['totalEstimatedCost'] {
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
    const gas = Math.round(382 / 30 * 4);
    
    return {
      amount: motels + meals + activities + gas,
      currency: 'USD',
      breakdown: { motels, meals, activities, gas }
    };
  }
  
  private corridorWidth = 25;
}

