import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost } from './api';

const KEY = (tripId: string) => `tm8_notif_${tripId}`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTripNotifications(
  tripId: string,
  destination: string,
  departureDate: string,
  departureTime: string,
  driveMinutes: number
): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const ids: string[] = [];

  const [year, month, day] = departureDate.split('-').map(Number);
  const [hour, minute] = (departureTime || '08:00').split(':').map(Number);

  // Day-before reminder at 8pm
  const dayBefore = new Date(year, month - 1, day - 1, 20, 0, 0);
  if (dayBefore > new Date()) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 Road trip tomorrow!',
        body: `${destination} tomorrow. Depart at ${departureTime}. Rest up and check fuel tonight.`,
        data: { tripId },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayBefore },
    });
    ids.push(id);
  }

  // Day-of reminder 1 hour before departure
  const dayOf = new Date(year, month - 1, day, hour - 1, minute, 0);
  if (dayOf > new Date()) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🗺️ Time to hit the road!`,
        body: `Your trip to ${destination} starts in 1 hour. Safe travels!`,
        data: { tripId },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayOf },
    });
    ids.push(id);
  }

  // Fatigue warning 2.5hrs after departure if drive > 4hrs
  if (driveMinutes > 240) {
    const fatigue = new Date(year, month - 1, day, hour, minute + 150, 0);
    if (fatigue > new Date()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Fatigue check',
          body: `You've been driving ~2.5 hours. Pull over, stretch, and grab water.`,
          data: { tripId },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fatigue },
      });
      ids.push(id);
    }
  }

  await AsyncStorage.setItem(KEY(tripId), JSON.stringify(ids));
}

export async function cancelTripNotifications(tripId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY(tripId));
  if (!raw) return;
  const ids: string[] = JSON.parse(raw);
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
  await AsyncStorage.removeItem(KEY(tripId));
}

export async function hasTripNotifications(tripId: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEY(tripId));
  return !!raw;
}

// Get Expo push token and register it with the backend (non-blocking, best-effort)
export async function registerPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const token = projectId
      ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
      : (await Notifications.getDevicePushTokenAsync()).data as string;
    await apiPost('/auth/push-token', { pushToken: token });
  } catch {
    // Non-blocking — push token registration failure should never crash the app
  }
}
