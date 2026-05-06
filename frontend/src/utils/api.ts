// API Utility Functions
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

export const DEMO_MODE_KEY = 'travelm8DemoMode';
export const DEMO_TOKEN = 'travelm8-demo-token';

export const isDemoMode = (): boolean =>
  process.env.REACT_APP_DEMO_MODE === 'true' || localStorage.getItem(DEMO_MODE_KEY) === 'true';

export const isDemoSession = (): boolean =>
  isDemoMode() && localStorage.getItem('authToken') === DEMO_TOKEN;

export const enableDemoMode = (): void => {
  localStorage.setItem(DEMO_MODE_KEY, 'true');
};

export const disableDemoMode = (): void => {
  localStorage.removeItem(DEMO_MODE_KEY);
};

const demoTrips = [
  {
    tripId: 'demo-pch-weekend',
    userId: 'demo-user',
    title: 'Pacific Coast Weekend',
    description: 'A route-first coastal escape with verified stops, meal timing, and motel options.',
    destination: 'San Francisco',
    startDate: '2026-06-12',
    endDate: '2026-06-14',
    status: 'planning',
    budget: 650,
    currency: 'USD',
    travelers: 2,
    preferences: {
      accommodationType: 'hotel',
      transportMode: 'car',
      activityTypes: ['scenic', 'food', 'local stops'],
      budgetLevel: 'mid-range',
    },
    itinerary: [],
    createdAt: '2026-05-01T12:00:00.000Z',
    updatedAt: '2026-05-01T12:00:00.000Z',
  },
  {
    tripId: 'demo-vegas-drive',
    userId: 'demo-user',
    title: 'LA to Vegas Smart Drive',
    description: 'Budget-aware road trip with rest stops and late-night arrival planning.',
    destination: 'Las Vegas',
    startDate: '2026-07-03',
    endDate: '2026-07-05',
    status: 'draft',
    budget: 480,
    currency: 'USD',
    travelers: 3,
    preferences: {
      accommodationType: 'hotel',
      transportMode: 'car',
      activityTypes: ['roadside attractions', 'restaurants'],
      budgetLevel: 'budget',
    },
    itinerary: [],
    createdAt: '2026-05-02T09:00:00.000Z',
    updatedAt: '2026-05-02T09:00:00.000Z',
  },
];

function demoRoutePlan(): ApiResponse {
  return {
    success: true,
    data: {
      inputsRecognized: {},
      routeSummary: {
        origin: 'Los Angeles',
        destination: 'San Francisco',
        totalDistance: 382,
        estimatedDriveTime: 360,
        suggestedStops: 5,
        majorCities: ['Los Angeles', 'Bakersfield', 'Fresno', 'Modesto', 'San Francisco'],
      },
      stopOptionSets: [
        {
          setId: 'demo-midway',
          label: 'Mid-route reset',
          distanceRange: { from: 150, to: 230 },
          pois: [
            {
              id: 'poi-harris-ranch',
              name: 'Harris Ranch',
              category: 'landmark',
              type: 'poi',
              description: 'Classic road-trip stop with food, lodging, and a quick recharge point.',
              coordinates: { lat: 36.253, lng: -120.238 },
              address: '24505 W Dorris Ave, Coalinga, CA',
              detourTime: 2,
              estimatedTimeAtStop: 45,
              rating: 4.3,
              reviewCount: 4500,
              verificationStatus: 'verified',
              distanceFromStart: 195,
            },
          ],
          restaurants: [
            {
              id: 'food-kettleman',
              name: 'In-N-Out Burger Kettleman City',
              category: 'fast-food',
              type: 'restaurant',
              description: 'Fast, predictable meal stop near the highway.',
              coordinates: { lat: 35.9936, lng: -119.9617 },
              detourTime: 2,
              estimatedTimeAtStop: 30,
              rating: 4.4,
              reviewCount: 2800,
              priceRange: '$',
              priceEstimate: 12,
              currency: 'USD',
              budgetFit: 'within-budget',
              verificationStatus: 'verified',
              distanceFromStart: 160,
            },
          ],
          motels: [
            {
              id: 'motel-buttonwillow',
              name: 'Motel 6 Buttonwillow',
              category: 'motel',
              type: 'motel',
              description: 'Budget-friendly motel close to I-5 for flexible overnight planning.',
              coordinates: { lat: 35.4008, lng: -119.4697 },
              detourTime: 1,
              estimatedTimeAtStop: 480,
              rating: 3.6,
              reviewCount: 420,
              priceRange: '$',
              priceEstimate: 65,
              currency: 'USD',
              budgetFit: 'within-budget',
              verificationStatus: 'verified',
              amenities: ['Free WiFi', 'Parking'],
              distanceFromStart: 120,
            },
          ],
        },
      ],
      topRatedMotels: [],
      budgetFriendlyMotels: [],
      offlineMapPlan: {
        corridorWidth: 20,
        regions: [],
        instructions: ['Download the route corridor before departure', 'Cache stop details for low-signal areas'],
        estimatedDownloadSize: '85 MB',
      },
      calendarExportReady: true,
      userChoicePrompt: 'Choose your preferred stops and motel to generate a timed itinerary.',
    },
  };
}

function demoFinalize(options: RequestInit): ApiResponse {
  let selections: any = {};
  try {
    selections = options.body ? JSON.parse(String(options.body)).selections || {} : {};
  } catch {
    selections = {};
  }
  const plannedStops = (demoRoutePlan().data as any).stopOptionSets.flatMap((set: any) => [
    ...set.pois,
    ...set.restaurants,
    ...set.motels,
  ]);
  const stops = selections.selectedStopSnapshots?.length
    ? selections.selectedStopSnapshots
    : plannedStops.filter((stop: any) =>
        selections.selectedPois?.includes(stop.id) ||
        selections.selectedRestaurants?.includes(stop.id) ||
        selections.selectedMotel === stop.id
      );
  const mealCost = stops
    .filter((stop: any) => stop.type === 'restaurant')
    .reduce((sum: number, stop: any) => sum + (stop.priceEstimate || 0) * 2, 0);
  const motelCost = stops
    .filter((stop: any) => stop.type === 'motel')
    .reduce((sum: number, stop: any) => sum + (stop.priceEstimate || 0), 0);
  const activityCost = stops
    .filter((stop: any) => stop.type === 'poi')
    .reduce((sum: number, stop: any) => sum + (stop.priceEstimate || 0) * 2, 0);
  const gasCost = 51;

  return {
    success: true,
    data: {
      itineraryId: 'demo-itinerary',
      routeId: 'route-1',
      routeSummary: (demoRoutePlan().data as any).routeSummary,
      stops,
      offlineMapPlan: (demoRoutePlan().data as any).offlineMapPlan,
      totalEstimatedCost: {
        amount: mealCost + motelCost + activityCost + gasCost,
        currency: 'USD',
        breakdown: {
          motels: motelCost,
          meals: mealCost,
          activities: activityCost,
          gas: gasCost,
        },
      },
      calendarEvents: [
        {
          id: 'event-1',
          title: 'Depart Los Angeles',
          description: 'Start the TravelM8 route plan.',
          startTime: '2026-06-12T08:00:00.000Z',
          endTime: '2026-06-12T08:15:00.000Z',
          location: 'Los Angeles',
          type: 'drive',
        },
        ...stops.map((stop: any, index: number) => ({
          id: `event-demo-${index + 2}`,
          title: stop.name,
          description: stop.description,
          startTime: `2026-06-12T${String(10 + index).padStart(2, '0')}:00:00.000Z`,
          endTime: `2026-06-12T${String(10 + index).padStart(2, '0')}:45:00.000Z`,
          location: stop.address || stop.name,
          type: stop.type === 'restaurant' ? 'meal' : stop.type === 'motel' ? 'overnight' : 'stop',
        })),
      ],
    },
  };
}

function demoApiResponse<T>(endpoint: string, options: RequestInit): ApiResponse<T> | null {
  if (!isDemoSession()) return null;

  if (endpoint.startsWith('/trips')) {
    if (options.method === 'GET') {
      const match = endpoint.match(/^\/trips\/([^?]+)/);
      if (match) {
        const trip = demoTrips.find((item) => item.tripId === match[1]) || demoTrips[0];
        return { success: true, data: trip as T };
      }
      return { success: true, data: { trips: demoTrips } as T };
    }
    return { success: true, data: demoTrips[0] as T };
  }

  if (endpoint === '/route/plan') return demoRoutePlan() as ApiResponse<T>;
  if (endpoint === '/route/finalize') return demoFinalize(options) as ApiResponse<T>;
  if (endpoint === '/recommendations') {
    return {
      success: true,
      data: {
        destination: 'Tokyo',
        duration: 7,
        recommendations: {
          accommodations: [
            { title: 'Hotel Metropolitan Tokyo Marunouchi', description: 'Demo lodging example near rail connections.', price: { amount: 210, currency: 'USD', perPerson: false }, rating: 4.5, source: 'demo' },
          ],
          activities: [
            { title: 'Yanaka walking route', description: 'Demo walking route with food and temples.', price: { amount: 20, currency: 'USD', perPerson: true }, rating: 4.7, source: 'demo' },
          ],
          restaurants: [
            { title: 'Tsukiji outer market breakfast', description: 'Demo morning food stop.', price: { amount: 28, currency: 'USD', perPerson: true }, rating: 4.6, source: 'demo' },
          ],
        },
        itinerary: [
          {
            dayNumber: 1,
            date: '2026-06-12',
            activities: [{ title: 'Yanaka walking route', description: 'Demo walking route with food and temples.', price: { amount: 20, currency: 'USD', perPerson: true } }],
            meals: [{ title: 'Tsukiji outer market breakfast', description: 'Demo morning food stop.', price: { amount: 28, currency: 'USD', perPerson: true } }],
            accommodation: { title: 'Hotel Metropolitan Tokyo Marunouchi', description: 'Demo lodging example near rail connections.', price: { amount: 210, currency: 'USD', perPerson: false } },
            estimatedCost: { amount: 258, currency: 'USD' },
          },
        ],
        totalEstimatedCost: { amount: 2450, currency: 'USD' },
        budgetBreakdown: { accommodation: 1470, food: 392, activities: 280, transport: 308 },
        tips: ['Reserve high-demand restaurants early', 'Group nearby stops by train line'],
      } as T,
    };
  }
  if (endpoint === '/route/export-calendar') {
    return {
      success: true,
      data: {
        filename: 'travelm8-demo.ics',
        icsContent: 'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:TravelM8 Demo Route\nEND:VEVENT\nEND:VCALENDAR',
      } as T,
    };
  }

  return null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Get authentication token from localStorage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

/**
 * Set authentication token in localStorage
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
}

/**
 * Get user info from localStorage
 */
export function getUser(): any | null {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Set user info in localStorage
 */
export function setUser(user: any): void {
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Remove user info from localStorage
 */
export function removeUser(): void {
  localStorage.removeItem('user');
}

/**
 * Make an API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const demoResponse = demoApiResponse<T>(endpoint, options);
  if (demoResponse) {
    return Promise.resolve(demoResponse);
  }

  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return data as ApiResponse<T>;
  } catch (error) {
    console.error('API request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * GET request
 */
export async function get<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export async function put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * Parse API response (for backward compatibility)
 */
export const parseApiResponse = async (response: Response): Promise<ApiResponse> => {
  try {
    const data = await response.json();
    return data as ApiResponse;
  } catch (error) {
    console.error('Error parsing API response:', error);
    return { success: false, error: 'Failed to parse response' };
  }
};

export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  return { success: false, error: 'An unexpected error occurred' };
};
