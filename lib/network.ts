import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

// Wires TanStack Query's connectivity awareness to the device's real network
// state. Queries pause (fetchStatus: 'paused') instead of erroring while
// offline, and auto-resume when connectivity returns.
function setupOnlineManager() {
  return onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    }),
  );
}

// TanStack Query's "focus" defaults to the browser's window-focus events, which
// never fire on React Native — without this the board's 30s refetchInterval
// keeps polling while the app is backgrounded, burning battery and mobile data.
// AppState is the RN equivalent, so queries idle in the background and refetch
// once on return to foreground.
function setupFocusManager() {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      setFocused(status === 'active');
    });
    return () => subscription.remove();
  });
}

export function setupNetworkStatusForQueries() {
  setupOnlineManager();
  setupFocusManager();
}
