export interface Trip {
  tripId: string;
  title: string;
  destination: string;
  startDate: string;
  travelers: number;
  status: string;
  createdAt: string;
  routeData?: {
    routeRequest?: any;
    routePlan?: any;
    finalItinerary?: any;
  };
}

export interface RouteStop {
  id: string;
  name: string;
  category: string;
  type: string;
  description: string;
  address?: string;
  detourTime: number;
  estimatedTimeAtStop: number;
  rating?: number;
  priceEstimate?: number;
  openHours?: string;
  distanceFromStart: number;
}

export interface StopOptionSet {
  setId: string;
  label: string;
  distanceRange: { from: number; to: number };
  pois: RouteStop[];
  restaurants: RouteStop[];
  motels: RouteStop[];
}

export interface AIRouteInsight {
  tripSummary: string;
  fatigueWarning: string | null;
  lateArrivalNote: string | null;
  topTip: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RouteSummary {
  origin: string;
  destination: string;
  totalDistance: number;
  estimatedDriveTime: number;
  majorCities: string[];
}

export interface RouteResponse {
  routeSummary: RouteSummary;
  stopOptionSets: StopOptionSet[];
  topRatedMotels: RouteStop[];
  budgetFriendlyMotels: RouteStop[];
  aiInsights?: AIRouteInsight;
}

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Dashboard: undefined;
  RoutePlanner: { routeRequest?: any } | undefined;
  RouteResults: { routePlan: RouteResponse; routeRequest: any };
  TripDetail: { tripId: string };
  TripList: undefined;
};
