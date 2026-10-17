import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { getNearbyStops } from './api';
import { queryClient } from './queryClient';
import type { NearbyStop } from '@/types';

// A fix this old is still "where you are" for picking a stop, and reusing it
// skips the seconds a fresh GPS fix can take indoors.
const LAST_KNOWN_MAX_AGE_MS = 2 * 60_000;
const LAST_KNOWN_ACCURACY_M = 150;

export const PERMISSION_KEY = ['locationPermission'] as const;
export const POSITION_KEY = ['position'] as const;

export type Position = { latitude: number; longitude: number };

export async function currentPosition(): Promise<Position> {
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
export function roundCoord(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function nearbyKey(latitude: number | null, longitude: number | null) {
  return ['nearby', latitude, longitude] as const;
}

// The permission lives in the query cache rather than in per-screen
// `useForegroundPermissions` state, so granting it on one screen (Settings,
// Routes) updates every other mounted screen (Home) at once.
export function useLocationPermission() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: PERMISSION_KEY,
    queryFn: () => Location.getForegroundPermissionsAsync(),
    // Re-checked when the app returns to the foreground: the user may have
    // changed it in the system settings meanwhile.
    staleTime: 0,
    retry: false,
  });

  const request = async () => {
    const response = await Location.requestForegroundPermissionsAsync();
    client.setQueryData(PERMISSION_KEY, response);
    return response;
  };

  return { permission: query.data, request };
}

export class LocationUnavailableError extends Error {
  constructor(readonly reason: 'denied' | 'blocked' | 'noStops') {
    super(reason);
    this.name = 'LocationUnavailableError';
  }
}

// The closest stop to where the user is, asking for permission first if it
// hasn't been decided yet. Shares the position and nearby caches with Home, so
// it's instant when Home has just shown the nearby list.
export async function findNearestStop(): Promise<NearbyStop> {
  let permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await Location.requestForegroundPermissionsAsync();
  }
  queryClient.setQueryData(PERMISSION_KEY, permission);
  if (!permission.granted) {
    throw new LocationUnavailableError(permission.canAskAgain ? 'denied' : 'blocked');
  }

  const position = await queryClient.fetchQuery({
    queryKey: POSITION_KEY,
    queryFn: currentPosition,
    staleTime: 60_000,
  });
  const latitude = roundCoord(position.latitude);
  const longitude = roundCoord(position.longitude);
  const stops = await queryClient.fetchQuery({
    queryKey: nearbyKey(latitude, longitude),
    queryFn: ({ signal }) => getNearbyStops(latitude, longitude, signal),
    staleTime: 5 * 60_000,
  });
  const nearest = stops[0];
  if (!nearest) throw new LocationUnavailableError('noStops');
  return nearest;
}
