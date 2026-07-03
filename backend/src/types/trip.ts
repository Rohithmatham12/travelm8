// Trip-related types and interfaces

export type BudgetCategory = 'fuel' | 'food' | 'lodging' | 'activities' | 'misc';

export interface BudgetEntry {
  entryId: string;
  category: BudgetCategory;
  amount: number;
  description?: string;
  date: string; // ISO date
}

export interface Trip {
  tripId: string;
  userId: string;
  title: string;
  description?: string;
  destination: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  status: TripStatus;
  budget?: number;
  currency?: string;
  travelers: number;
  preferences: TripPreferences;
  notes?: string;
  itinerary?: ItineraryItem[];
  routeData?: {
    routeRequest: any;
    routePlan?: any;
    finalItinerary?: any;
  };
  spendEntries?: BudgetEntry[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  ttl?: number; // For DynamoDB TTL
}

export type TripStatus = 'draft' | 'planning' | 'confirmed' | 'completed' | 'cancelled';

export interface TripPreferences {
  accommodationType?: 'hotel' | 'hostel' | 'airbnb' | 'resort' | 'any';
  transportMode?: 'flight' | 'train' | 'bus' | 'car' | 'any';
  activityTypes?: string[]; // e.g., ['sightseeing', 'adventure', 'relaxation']
  foodPreferences?: string[]; // e.g., ['vegetarian', 'local-cuisine']
  budgetLevel?: 'budget' | 'mid-range' | 'luxury';
}

export interface ItineraryItem {
  id: string;
  date: string; // ISO date string
  time?: string; // Time of day
  type: 'accommodation' | 'transport' | 'activity' | 'meal' | 'other';
  title: string;
  description?: string;
  location?: string;
  duration?: number; // in minutes
  cost?: number;
  currency?: string;
  status: 'planned' | 'booked' | 'completed' | 'cancelled';
}

export interface CreateTripRequest {
  title: string;
  description?: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number;
  currency?: string;
  travelers: number;
  preferences: TripPreferences;
  notes?: string;
  routeData?: {
    routeRequest: any;
    routePlan?: any;
    finalItinerary?: any;
  };
}

export interface UpdateTripRequest {
  title?: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency?: string;
  travelers?: number;
  preferences?: TripPreferences;
  status?: TripStatus;
  notes?: string;
  itinerary?: ItineraryItem[];
}

export interface TripListResponse {
  trips: Trip[];
  nextToken?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}





