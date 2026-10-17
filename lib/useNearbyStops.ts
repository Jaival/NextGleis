import { useQuery } from '@tanstack/react-query';
import { getNearbyStops } from './api';
import {
  currentPosition,
  nearbyKey,
  POSITION_KEY,
  roundCoord,
  useLocationPermission,
} from './location';
import { useSettingsStore } from './settingsStore';

// Permission, then position, then stops. Nothing is requested until the user
// opts in: `requestPermission` is only called from an explicit button. With
// location turned off in Settings, nothing runs at all.
export function useNearbyStops() {
  const locationEnabled = useSettingsStore((s) => s.locationEnabled);
  const { permission, request } = useLocationPermission();
  const granted = locationEnabled && permission?.granted === true;

  const position = useQuery({
    queryKey: POSITION_KEY,
    queryFn: currentPosition,
    enabled: granted,
    // Refetched when the app comes back to the foreground once this is stale —
    // the rider has likely moved since.
    staleTime: 60_000,
    retry: false,
  });

  const latitude = position.data ? roundCoord(position.data.latitude) : null;
  const longitude = position.data ? roundCoord(position.data.longitude) : null;
  const stops = useQuery({
    queryKey: nearbyKey(latitude, longitude),
    queryFn: ({ signal }) => getNearbyStops(latitude!, longitude!, signal),
    enabled: granted && latitude !== null && longitude !== null,
    staleTime: 5 * 60_000,
  });

  return {
    locationEnabled,
    permission,
    requestPermission: request,
    stops: granted ? stops.data : undefined,
    isLoading: granted && (position.isPending || (stops.isPending && stops.fetchStatus !== 'idle')),
    isError: position.isError || stops.isError,
    isOffline: stops.fetchStatus === 'paused',
    retry: () => (position.isError ? position.refetch() : stops.refetch()),
  };
}
