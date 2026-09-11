import type { Journey } from '../../types/index.js';
import { clientFor, withTimeout } from './networks.js';
import { toJourney } from './normalize.js';
import { findInNetwork } from './resolve.js';
import type { StopRef } from './stopId.js';

const JOURNEY_RESULTS = 5;
// Long cross-country searches are slow upstream: RMV took ~7.6s for
// Frankfurt → Kiel.
const JOURNEYS_TIMEOUT_MS = 12_000;

// HAFAS only routes between stops of one network, so both ends are first
// expressed in the same one. The origin's network goes first and the
// destination's second: between them they cover trips that leave a network's
// area and trips that enter it (the Germany-wide rail stations are in all of
// them, so the far end is nearly always findable).
export async function findJourneys(from: StopRef, to: StopRef): Promise<Journey[]> {
  let lastError: unknown;

  for (const network of new Set([from.network, to.network])) {
    const client = clientFor(network);
    if (!client.journeys) continue;
    try {
      const [origin, destination] = await Promise.all([
        findInNetwork(from, network),
        findInNetwork(to, network),
      ]);
      const result = await withTimeout(
        client.journeys(origin.id, destination.id, {
          results: JOURNEY_RESULTS,
          stopovers: false,
          remarks: false,
          tickets: false,
          polylines: false,
        }),
        JOURNEYS_TIMEOUT_MS,
      );
      const journeys = (result.journeys ?? []).flatMap((journey, index) => toJourney(journey, index) ?? []);
      if (journeys.length > 0) return journeys;
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError) throw lastError;
  return [];
}
