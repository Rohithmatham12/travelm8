import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip } from '../types';

const KEY_TRIPS = 'tm8_cache_trips';
const KEY_TRIP = (id: string) => `tm8_cache_trip_${id}`;

export async function cacheTrips(trips: Trip[]): Promise<void> {
  await AsyncStorage.setItem(KEY_TRIPS, JSON.stringify({ trips, cachedAt: Date.now() }));
}

export async function getCachedTrips(): Promise<Trip[] | null> {
  const raw = await AsyncStorage.getItem(KEY_TRIPS);
  if (!raw) return null;
  return JSON.parse(raw).trips ?? null;
}

export async function cacheTripDetail(trip: Trip): Promise<void> {
  await AsyncStorage.setItem(KEY_TRIP(trip.tripId), JSON.stringify({ trip, cachedAt: Date.now() }));
}

export async function getCachedTripDetail(tripId: string): Promise<Trip | null> {
  const raw = await AsyncStorage.getItem(KEY_TRIP(tripId));
  if (!raw) return null;
  return JSON.parse(raw).trip ?? null;
}
