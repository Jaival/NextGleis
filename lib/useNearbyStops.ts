import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { getNearbyStops } from './api';

// A fix this old is still "where you are" for picking a stop, and reusing it
// skips the seconds a fresh GPS fix can take indoors.
const LAST_KNOWN_MAX_AGE_MS = 2 * 60_000;
const LAST_KNOWN_ACCURACY_M = 150;

async function currentPosition(): Promise<{ latitude: number; longitude: number }> {
  const last = await Location.getLastKnownPositionAsync({
    maxAge: LAST_KNOWN_MAX_AGE_MS,
    requiredAccuracy: LAST_KNOWN_ACCURACY_M,
  });
  const position =
    last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

// Rounded to ~100 m, matching the backend's cache: walking across a platform
// shouldn't refetch, and the exact position never leaves the device.
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

// Permission, then position, then stops. Nothing is requested until the user
// opts in: `requestPermission` is only called from an explicit button.
export function useNearbyStops() {
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const granted = permission?.granted === true;

  const position = useQuery({
    queryKey: ['position'],
    queryFn: currentPosition,
    enabled: granted,
    // Refetched when the app comes back to the foreground once this is stale —
    // the rider has likely moved since.
    staleTime: 60_000,
    retry: false,
  });

  const latitude = position.data ? round(position.data.latitude) : null;
  const longitude = position.data ? round(position.data.longitude) : null;
  const stops = useQuery({
    queryKey: ['nearby', latitude, longitude],
    queryFn: ({ signal }) => getNearbyStops(latitude!, longitude!, signal),
    enabled: latitude !== null && longitude !== null,
    staleTime: 5 * 60_000,
  });

  return {
    permission,
    requestPermission,
    stops: stops.data,
    isLoading: granted && (position.isPending || (stops.isPending && stops.fetchStatus !== 'idle')),
    isError: position.isError || stops.isError,
    isOffline: stops.fetchStatus === 'paused',
    retry: () => (position.isError ? position.refetch() : stops.refetch()),
  };
}
