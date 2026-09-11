import type { Location, Station, Stop } from 'hafas-client';
import type { StationSearchResult } from '../../types/index.js';
import { coordinatesOf, metresBetween, type Coordinates } from './geo.js';
import { clientFor, NETWORKS, ownerOf, withTimeout, type Network, type NetworkId } from './networks.js';
import { formatStopId } from './stopId.js';

// Search asks every network at once, so one slow network must not hold up the
// answer from the rest.
const SEARCH_TIMEOUT_MS = 4_500;
const RESULTS_PER_NETWORK = 8;
const MAX_RESULTS = 15;
// Two networks' copies of one stop sit within metres of each other, since all
// of them draw on the same national stop register. Stops that close together
// are only ever merged across networks, never within one.
const SAME_STOP_METRES = 150;

type Candidate = {
  network: Network;
  id: string;
  name: string;
  coordinates: Coordinates;
  rank: number;
  // The network whose own area the stop is in, if any.
  owner: NetworkId | undefined;
  matchesQuery: boolean;
};

function normalizeName(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mark}/gu, '')
    .replace(/ß/g, 'ss')
    .replace(/hauptbahnhof/g, 'hbf');
}

function toCandidate(
  network: Network,
  place: Station | Stop | Location,
  rank: number,
  tokens: string[],
): Candidate | null {
  // Addresses and POIs are switched off in the query; this catches any that
  // slip through anyway.
  if (place.type === 'location' || !place.id || !place.name) return null;
  const coordinates = coordinatesOf(place);
  if (!coordinates) return null;

  const name = normalizeName(place.name);
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
): Promise<Candidate[] | null> {
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

export async function searchStops(query: string): Promise<StationSearchResult[]> {
  const tokens = normalizeName(query)
    .split(/[^\p{Letter}\p{Number}]+/u)
    .filter(Boolean);
  const perNetwork = await Promise.all(NETWORKS.map((network) => searchNetwork(network, query, tokens)));
  const answered = new Set(NETWORKS.filter((_, i) => perNetwork[i] !== null).map((n) => n.id));
  const all = perNetwork.flatMap((candidates) => candidates ?? []);

  // Each network's fuzzy matching pads its answer with loosely related stops
  // ("Frankfurter Straße" for "Frankfurt"). Across fourteen networks that
  // buries the real hit, so only names containing everything typed are kept —
  // unless none do, in which case it was a typo the fuzzy matching caught.
  const matching = all.filter((c) => c.matchesQuery);
  const pool = matching.length > 0 ? matching : all;

  // Nearly every network also indexes the rest of the country, but outside
  // its own area only the rail stations — with thin or empty boards. So a
  // stop is taken from the network that owns its spot. A fallback network's
  // copy stands in only where nobody owns the spot, or the owner didn't
  // answer this time; other networks' out-of-area copies are dropped.
  const candidates = pool
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

  const kept: Candidate[] = [];
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

  return kept.slice(0, MAX_RESULTS).map((c) => ({
    evaNo: formatStopId({ network: c.network.id, id: c.id }),
    name: c.name,
    network: c.network.label,
  }));
}
