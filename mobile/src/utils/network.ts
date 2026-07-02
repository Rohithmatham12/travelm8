import * as Network from 'expo-network';

export async function isOffline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return !state.isConnected || !state.isInternetReachable;
  } catch {
    return false;
  }
}
