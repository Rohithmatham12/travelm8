// Route-based travel planning types

export interface RouteRequest {
  origin: string;
  destination: string;
  departureDate: string;
  departureTime?: string;
  travelers: number;
  budget?: {
    motelPerNight?: number;
    mealBudget?: number;
    totalBudget?: number;
  };
  preferences?: {
    poiCategories?: string[];
    cuisineTypes?: string[];
    motelType?: 'budget' | 'mid-range' | 'luxury';
    stopFrequency?: 'minimal' | 'moderate' | 'frequent';
  };
  needsOfflineMaps?: boolean;
}

export type VerificationStatus = 'verified' | 'partially-verified' | 'not-verified';

export interface RouteStop {
  id: string;
  name: string;
  category: string;
  type: 'poi' | 'restaurant' | 'motel' | 'gas' | 'restroom' | 'hospital';
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address?: string;
  detourTime: number; // minutes from main route
  estimatedTimeAtStop: number; // minutes
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  priceEstimate?: number;
  currency?: string;
  budgetFit?: 'within-budget' | 'slightly-above' | 'above-budget' | 'unknown';
  verificationStatus: VerificationStatus;
  openHours?: string;
  amenities?: string[];
  imageUrl?: string;
  distanceFromStart: number; // miles from origin
}

export interface StopOptionSet {
  setId: string;
  label: string; // e.g., "Stop Option Set 1 (first 2 hours)"
  distanceRange: {
    from: number;
    to: number;
  };
  pois: RouteStop[];
  restaurants: RouteStop[];
  motels: RouteStop[];
}

export interface RouteSummary {
  origin: string;
  destination: string;
  totalDistance: number; // miles
  estimatedDriveTime: number; // minutes
  suggestedStops: number;
  routePolyline?: string;
  majorCities: string[];
}

export interface OfflineMapPlan {
  corridorWidth: number; // miles radius
  regions: {
    name: string;
    coordinates: { lat: number; lng: number };
    radius: number;
  }[];
  instructions: string[];
  estimatedDownloadSize?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  type: 'drive' | 'stop' | 'meal' | 'overnight';
}

export interface RouteResponse {
  inputsRecognized: {
    origin: string;
    destination: string;
    date: string;
    travelers: number;
    budget?: {
      motelPerNight?: number;
      mealBudget?: number;
    };
  };
  routeSummary: RouteSummary;
  stopOptionSets: StopOptionSet[];
  topRatedMotels: RouteStop[];
  budgetFriendlyMotels: RouteStop[];
  offlineMapPlan: OfflineMapPlan;
  calendarExportReady: boolean;
  userChoicePrompt: string;
}

export interface SelectedStops {
  routeId: string;
  selectedPois: string[];
  selectedRestaurants: string[];
  selectedMotel: string;
  departureTime: string;
}

export interface FinalItinerary {
  routeSummary: RouteSummary;
  stops: RouteStop[];
  calendarEvents: CalendarEvent[];
  offlineMapPlan: OfflineMapPlan;
  totalEstimatedCost: {
    amount: number;
    currency: string;
    breakdown: {
      motels: number;
      meals: number;
      activities: number;
      gas: number;
    };
  };
}
