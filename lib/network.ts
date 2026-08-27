import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

// Wires TanStack Query's connectivity awareness to the device's real network
// state. Queries pause (fetchStatus: 'paused') instead of erroring while
// offline, and auto-resume when connectivity returns.
export function setupNetworkStatusForQueries() {
  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
  });
}
