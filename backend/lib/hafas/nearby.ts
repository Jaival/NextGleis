import type { NearbyStop } from '../../types/index.js';
import { coordinatesOf, metresBetween, type Coordinates } from './geo.js';
import { clientFor, NETWORKS, networkById, ownerOf, withTimeout, type NetworkId } from './networks.js';
import { formatStopId } from './stopId.js';

const NEARBY_TIMEOUT_MS = 4_000;
// About a ten-minute walk: anything further isn't "nearby" for a rider deciding
// where to go now.
const NEARBY_RADIUS_METRES = 800;
const NEARBY_RESULTS = 8;

// Where no network owns the spot (most of Bavaria and Baden-Württemberg), the
// best-ranked fallback network still knows the rail stations there.
const FALLBACKS: readonly NetworkId[] = NETWORKS.filter((n) => n.fallbackRank !== undefined)
  .sort((a, b) => (a.fallbackRank ?? 0) - (b.fallbackRank ?? 0))
  .map((n) => n.id);

async function nearbyIn(network: NetworkId, here: Coordinates): Promise<NearbyStop[]> {
  const places = await withTimeout(
    clientFor(network).nearby(
      { type: 'location', latitude: here.latitude, longitude: here.longitude },
      { distance: NEARBY_RADIUS_METRES, results: NEARBY_RESULTS, poi: false, linesOfStops: false },
    ),
    NEARBY_TIMEOUT_MS,
  );

  const stops: NearbyStop[] = [];
  for (const place of places) {
    if (place.type === 'location' || !place.id || !place.name) continue;
    const coordinates = coordinatesOf(place);
    // HAFAS reports the walking distance as `distance` on nearby results; the
    // straight line stands in where a network leaves it out.
    const reported = (place as { distance?: number }).distance;
    const distance =
      typeof reported === 'number' ? reported : coordinates ? metresBetween(here, coordinates) : undefined;
    if (distance === undefined) continue;
    stops.push({
      evaNo: formatStopId({ network, id: place.id }),
      name: place.name,
      network: networkById(network).label,
      distance: Math.round(distance),
    });
  }
  return stops.sort((a, b) => a.distance - b.distance);
}

// Asks the network that owns the spot — the only one with all its buses and
// trams — and falls back down the list if it fails or knows nothing there.
export async function nearbyStops(here: Coordinates): Promise<NearbyStop[]> {
  const owner = ownerOf(here);
  const order = owner ? [owner, ...FALLBACKS.filter((id) => id !== owner)] : FALLBACKS;

  let lastError: unknown;
  for (const network of order.slice(0, 2)) {
    try {
      const stops = await nearbyIn(network, here);
      if (stops.length > 0) return stops;
    } catch (err) {
      lastError = err;
      console.warn(`[nearby] ${network} failed:`, err instanceof Error ? err.message : err);
    }
  }
  if (lastError) throw lastError;
  return [];
}
