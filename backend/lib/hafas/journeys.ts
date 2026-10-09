import type { JourneyPage } from '../../types/index.js';
import { clientFor, isNetworkId, withoutLongDistance, withTimeout, type NetworkId } from './networks.js';
import { toJourney } from './normalize.js';
import { findInNetwork } from './resolve.js';
import type { StopRef } from './stopId.js';

const JOURNEY_RESULTS = 5;
// Long cross-country searches are slow upstream: RMV took ~7.6s for
// Frankfurt → Kiel.
const JOURNEYS_TIMEOUT_MS = 12_000;

// A page ref only means something to the network that issued it (it's that
// server's own continuation context), so the network travels with it:
// "rmv:<hafas ref>".
export type PageRef = { network: NetworkId; ref: string };

export function parsePageRef(raw: string): PageRef | null {
  const separator = raw.indexOf(':');
  const network = raw.slice(0, separator);
  const ref = raw.slice(separator + 1);
  if (separator === -1 || !isNetworkId(network) || !ref) return null;
  return { network, ref };
}

function formatPageRef(network: NetworkId, ref: string | undefined): string | undefined {
  return ref ? `${network}:${ref}` : undefined;
}

// Either a point in time (leave after it, or arrive before it with
// `arrival`), or a step from a page already shown. Without either, HAFAS
// searches from now.
export type JourneyQuery =
  | { when?: Date; arrival: boolean }
  | { earlier: PageRef }
  | { later: PageRef };

function timeOptions(query: JourneyQuery) {
  if ('earlier' in query) return { earlierThan: query.earlier.ref };
  if ('later' in query) return { laterThan: query.later.ref };
  if (!query.when) return {};
  return query.arrival ? { arrival: query.when } : { departure: query.when };
}

// HAFAS only routes between stops of one network, so both ends are first
// expressed in the same one. The origin's network goes first and the
// destination's second: between them they cover trips that leave a network's
// area and trips that enter it (the Germany-wide rail stations are in all of
// them, so the far end is nearly always findable). A step to earlier or later
// connections has to go back to whichever network answered the first page.
// `regionalOnly` leaves out what the Deutschlandticket doesn't cover. A page
// step has to repeat it: HAFAS applies the product filter per request, not
// from the continuation ref.
export async function findJourneys(
  from: StopRef,
  to: StopRef,
  query: JourneyQuery,
  { regionalOnly = false }: { regionalOnly?: boolean } = {},
): Promise<JourneyPage> {
  const page = 'earlier' in query ? query.earlier : 'later' in query ? query.later : null;
  const networks = page ? [page.network] : [...new Set([from.network, to.network])];
  let lastError: unknown;

  for (const network of networks) {
    const client = clientFor(network);
    if (!client.journeys) continue;
    try {
      const [origin, destination] = await Promise.all([
        findInNetwork(from, network),
        findInNetwork(to, network),
      ]);
      const result = await withTimeout(
        client.journeys(origin.id, destination.id, {
          ...timeOptions(query),
          ...(regionalOnly ? { products: withoutLongDistance(network) } : {}),
          results: JOURNEY_RESULTS,
          stopovers: false,
          remarks: true,
          tickets: false,
          polylines: false,
        }),
        JOURNEYS_TIMEOUT_MS,
      );
      const journeys = (result.journeys ?? []).flatMap((journey, index) => toJourney(journey, index) ?? []);
      if (journeys.length > 0 || page) {
        return {
          journeys,
          earlierRef: formatPageRef(network, result.earlierRef),
          laterRef: formatPageRef(network, result.laterRef),
        };
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError) throw lastError;
  return { journeys: [] };
}
