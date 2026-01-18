// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TripListResponse {
  trips: any[];
  nextToken?: string;
}

export interface CreateTripResponse {
  tripId: string;
  trip: any;
}

export interface UpdateTripResponse {
  trip: any;
}

export interface DeleteTripResponse {
  success: boolean;
}

export interface ShareSettingsResponse {
  trip: any;
}





