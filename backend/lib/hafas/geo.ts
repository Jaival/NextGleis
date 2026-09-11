import type { Location, Station, Stop } from 'hafas-client';

export type Coordinates = { latitude: number; longitude: number };

export function coordinatesOf(place: Station | Stop | Location): Coordinates | null {
  const location = place.type === 'location' ? place : place.location;
  if (location?.latitude == null || location.longitude == null) return null;
  return { latitude: location.latitude, longitude: location.longitude };
}

// Equirectangular approximation — plenty at the few-hundred-metre scale it's
// used for.
export function metresBetween(a: Coordinates, b: Coordinates): number {
  const toRadians = Math.PI / 180;
  const x =
    (b.longitude - a.longitude) * toRadians * Math.cos(((a.latitude + b.latitude) / 2) * toRadians);
  const y = (b.latitude - a.latitude) * toRadians;
  return Math.hypot(x, y) * 6_371_000;
}
