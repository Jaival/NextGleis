import type { Location, Station, Stop } from 'hafas-client';
import { type Candidate, SAME_STOP_METRES } from '../searchCandidate.js';
import { normalizeStopName, tokenize } from '../searchText.js';
import { coordinatesOf, metresBetween, type Coordinates } from './geo.js';
import { clientFor, NETWORKS, ownerOf, withTimeout, type Network, type NetworkId } from './networks.js';
import { formatStopId } from './stopId.js';

// Search asks every network at once, so one slow network must not hold up the
// answer from the rest.
const SEARCH_TIMEOUT_MS = 4_500;
const RESULTS_PER_NETWORK = 8;

type RawCandidate = {
  network: Network;
  id: string;
  name: string;
  coordinates: Coordinates;
  rank: number;
  // The network whose own area the stop is in, if any.
  owner: NetworkId | undefined;
  matchesQuery: boolean;
};

function toCandidate(
  network: Network,
  place: Station | Stop | Location,
  rank: number,
  tokens: string[],
): RawCandidate | null {
  // Addresses and POIs are switched off in the query; this catches any that
  // slip through anyway.
  if (place.type === 'location' || !place.id || !place.name) return null;
  const coordinates = coordinatesOf(place);
  if (!coordinates) return null;

  const name = normalizeStopName(place.name);
  return {
    network,
    id: place.id,
    name: place.name,
    coordinates,
    rank,
    owner: ownerOf(coordinates),
    matchesQuery: tokens.every((token) => name.includes(token)),
  };
}

// Null when the network failed to answer, as opposed to finding nothing.
async function searchNetwork(
  network: Network,
  query: string,
  tokens: string[],
): Promise<RawCandidate[] | null> {
  try {
    const places = await withTimeout(
      clientFor(network.id).locations(query, {
        results: RESULTS_PER_NETWORK,
        stops: true,
        addresses: false,
        poi: false,
        linesOfStops: false,
      }),
      SEARCH_TIMEOUT_MS,
    );
    return places.flatMap((place, rank) => toCandidate(network, place, rank, tokens) ?? []);
  } catch (err) {
    // One network being slow or down shouldn't empty the search.
    console.warn(`[search] ${network.id} failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// Candidate-gathering only, stopping short of the final cap and mapping to
// StationSearchResult: ../search.ts needs raw candidates (with coordinates
// and matchesQuery, not yet cut down to the matching-or-all pool) to combine
// fairly with EFA's before either decision is made.
export async function searchHafasCandidates(query: string): Promise<Candidate[]> {
  const tokens = tokenize(query);
  const perNetwork = await Promise.all(NETWORKS.map((network) => searchNetwork(network, query, tokens)));
  const answered = new Set(NETWORKS.filter((_, i) => perNetwork[i] !== null).map((n) => n.id));
  const all = perNetwork.flatMap((candidates) => candidates ?? []);

  // Nearly every network also indexes the rest of the country, but outside
  // its own area only the rail stations — with thin or empty boards. So a
  // stop is taken from the network that owns its spot. A fallback network's
  // copy stands in only where nobody owns the spot, or the owner didn't
  // answer this time; other networks' out-of-area copies are dropped.
  const candidates = all
    .filter(
      (c) =>
        c.owner === c.network.id ||
        (c.network.fallbackRank !== undefined && (c.owner === undefined || !answered.has(c.owner))),
    )
    .sort(
      (a, b) =>
        Number(b.owner === b.network.id) - Number(a.owner === a.network.id) ||
        (a.network.fallbackRank ?? 0) - (b.network.fallbackRank ?? 0) ||
        a.rank - b.rank,
    );

  const kept: RawCandidate[] = [];
  for (const candidate of candidates) {
    const duplicate = kept.some(
      (k) =>
        k.network.id !== candidate.network.id &&
        metresBetween(k.coordinates, candidate.coordinates) <= SAME_STOP_METRES,
    );
    if (!duplicate) kept.push(candidate);
  }

  // Ranks come from each network's own relevance ordering, so they only break
  // ties; the sort is stable, so equal ranks keep NETWORKS order.
  kept.sort((a, b) => a.rank - b.rank);

  return kept.map((c) => ({
    stopId: formatStopId({ network: c.network.id, id: c.id }),
    name: c.name,
    sourceLabel: c.network.label,
    coordinates: c.coordinates,
    rank: c.rank,
    priority: c.owner === c.network.id ? 0 : (c.network.fallbackRank ?? 0) + 1,
    matchesQuery: c.matchesQuery,
  }));
}
