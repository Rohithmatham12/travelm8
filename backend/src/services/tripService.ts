import { v4 as uuidv4 } from 'uuid';
import { Trip, CreateTripRequest, UpdateTripRequest, TripListResponse } from '../types/trip';
import { putItem, getItem, updateItem, deleteItem, queryItems } from '../utils/storage';

const TRIPS_TABLE_NAME = 'trips';

export class TripService {
  /**
   * Create a new trip
   */
  async createTrip(userId: string, request: CreateTripRequest): Promise<Trip> {
    const tripId = uuidv4();
    const now = new Date().toISOString();
    
    const trip: Trip = {
      tripId,
      userId,
      title: request.title,
      description: request.description,
      destination: request.destination,
      startDate: request.startDate,
      endDate: request.endDate,
      status: 'draft',
      budget: request.budget,
      currency: request.currency || 'USD',
      travelers: request.travelers,
      preferences: request.preferences,
      itinerary: [],
      createdAt: now,
      updatedAt: now,
      // Set TTL to 1 year from now (for automatic cleanup)
      ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
    };

    putItem(TRIPS_TABLE_NAME, trip);
    return trip;
  }

  /**
   * Get a trip by ID
   */
  async getTrip(userId: string, tripId: string): Promise<Trip | null> {
    const result = await getItem(TRIPS_TABLE_NAME, {
      userId,
      tripId,
    });

    return result as Trip | null;
  }

  /**
   * Update a trip
   */
  async updateTrip(userId: string, tripId: string, updates: UpdateTripRequest): Promise<Trip | null> {
    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const result = await updateItem(
      TRIPS_TABLE_NAME,
      { userId, tripId },
      updateData
    );

    return result as Trip | null;
  }

  /**
   * Delete a trip
   */
  async deleteTrip(userId: string, tripId: string): Promise<void> {
    await deleteItem(TRIPS_TABLE_NAME, { userId, tripId });
  }

  /**
   * List trips for a user
   */
  async listUserTrips(
    userId: string, 
    limit: number = 20, 
    nextToken?: string
  ): Promise<TripListResponse> {
    const allTrips = queryItems(
      TRIPS_TABLE_NAME,
      (item: Trip) => item.userId === userId
    ) as Trip[];

    // Sort by createdAt descending (most recent first)
    allTrips.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Simple pagination
    const startIndex = nextToken ? parseInt(nextToken) : 0;
    const endIndex = startIndex + limit;
    const trips = allTrips.slice(startIndex, endIndex);
    const newNextToken = endIndex < allTrips.length ? endIndex.toString() : undefined;

    return {
      trips,
      nextToken: newNextToken,
    };
  }

  /**
   * List trips by status (using GSI)
   */
  async listTripsByStatus(
    status: string,
    limit: number = 20,
    nextToken?: string
  ): Promise<TripListResponse> {
    // For now, we'll use a simple scan with filter since GSI query is more complex
    // In a production app, you'd want to implement proper GSI querying
    const allTrips = await this.listUserTrips('', limit, nextToken);
    const filteredTrips = allTrips.trips.filter(trip => trip.status === status);
    
    return {
      trips: filteredTrips,
      nextToken: allTrips.nextToken,
    };
  }

  /**
   * Add an itinerary item to a trip
   */
  async addItineraryItem(
    userId: string,
    tripId: string,
    item: any
  ): Promise<Trip | null> {
    const trip = await this.getTrip(userId, tripId);
    if (!trip) {
      return null;
    }

    const newItem = {
      id: uuidv4(),
      ...item,
    };

    const updatedItinerary = [...(trip.itinerary || []), newItem];

    return await this.updateTrip(userId, tripId, {
      itinerary: updatedItinerary,
    });
  }

  /**
   * Update an itinerary item
   */
  async updateItineraryItem(
    userId: string,
    tripId: string,
    itemId: string,
    updates: any
  ): Promise<Trip | null> {
    const trip = await this.getTrip(userId, tripId);
    if (!trip || !trip.itinerary) {
      return null;
    }

    const updatedItinerary = trip.itinerary.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );

    return await this.updateTrip(userId, tripId, {
      itinerary: updatedItinerary,
    });
  }

  /**
   * Remove an itinerary item
   */
  async removeItineraryItem(
    userId: string,
    tripId: string,
    itemId: string
  ): Promise<Trip | null> {
    const trip = await this.getTrip(userId, tripId);
    if (!trip || !trip.itinerary) {
      return null;
    }

    const updatedItinerary = trip.itinerary.filter(item => item.id !== itemId);

    return await this.updateTrip(userId, tripId, {
      itinerary: updatedItinerary,
    });
  }
}
