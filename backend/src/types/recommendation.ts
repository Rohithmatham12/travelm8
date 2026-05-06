// Recommendation-related types and interfaces

export interface RecommendationRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget?: number;
  currency?: string;
  preferences: {
    accommodationType?: string;
    transportMode?: string;
    activityTypes?: string[];
    foodPreferences?: string[];
    budgetLevel?: string;
  };
}

export interface Recommendation {
  id: string;
  type: 'accommodation' | 'activity' | 'restaurant' | 'transport' | 'attraction';
  title: string;
  description: string;
  location: string;
  rating?: number;
  price?: {
    amount: number;
    currency: string;
    perPerson?: boolean;
  };
  duration?: number; // in minutes
  category: string;
  tags: string[];
  imageUrl?: string;
  bookingUrl?: string;
  address?: string;
  source?: 'open-data' | 'estimated' | 'unavailable';
  verificationNote?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface RecommendationResponse {
  destination: string;
  duration: number;
  recommendations: {
    accommodations: Recommendation[];
    activities: Recommendation[];
    restaurants: Recommendation[];
    attractions: Recommendation[];
    transport: Recommendation[];
    motels?: Recommendation[];
  };
  itinerary: ItineraryDay[];
  totalEstimatedCost: {
    amount: number;
    currency: string;
  };
  budgetBreakdown?: {
    accommodation: number;
    food: number;
    activities: number;
    transport: number;
  };
  tips: string[];
}

export interface ItineraryDay {
  date: string;
  dayNumber: number;
  activities: Recommendation[];
  meals: Recommendation[];
  accommodation?: Recommendation;
  transport?: Recommendation[];
  estimatedCost: {
    amount: number;
    currency: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}




