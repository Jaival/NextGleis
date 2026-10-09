import type { Trip } from '../../types/index.js';
import { clientFor, isNetworkId, withTimeout, type NetworkId } from './networks.js';
import { toTrip } from './normalize.js';

const TRIP_TIMEOUT_MS = 6_000;

// Like a stop id, a HAFAS trip id only means something to the network that
// issued it, so it carries the network as a prefix: "rmv:1|12345|0|80|9102026".
export type TripRef = { network: NetworkId; id: string };

export function formatTripId(network: NetworkId, id: string): string {
  return `${network}:${id}`;
}

export function parseTripId(raw: string): TripRef | null {
  const separator = raw.indexOf(':');
  const network = raw.slice(0, separator);
  const id = raw.slice(separator + 1);
  if (separator === -1 || !isNetworkId(network) || !id) return null;
  return { network, id };
}

export async function hafasTrip(ref: TripRef): Promise<Trip> {
  const client = clientFor(ref.network);
  if (!client.trip) throw new Error(`${ref.network} has no trip details`);

  const { trip } = await withTimeout(
    client.trip(ref.id, {
      stopovers: true,
      remarks: true,
      polyline: false,
      subStops: false,
      entrances: false,
    }),
    TRIP_TIMEOUT_MS,
  );
  return toTrip(trip, ref.network);
}
