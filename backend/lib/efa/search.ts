import type { Candidate } from '../searchCandidate.js';
import { normalizeStopName } from '../searchText.js';
import { ownerOfEfa, EFA_NETWORKS, type EfaNetwork } from './networks.js';
import { efaRequest } from './request.js';
import { formatEfaStopId } from './stopId.js';
import type { EfaLocation, EfaStopFinderResponse } from './types.js';

function toCandidate(network: EfaNetwork, location: EfaLocation, rank: number, tokens: string[]): Candidate | null {
  // type_sf=any also returns streets, addresses and localities; unlike HAFAS
  // the server has no "stops only" switch that keeps stable ids (asking for
  // type_sf=stop on at least one of these deployments hands back a
  // short-lived session id instead of the persistable global one).
  if (location.type !== 'stop' || !location.isGlobalId || !location.id || !location.coord) return null;

  const coordinates = { latitude: location.coord[0], longitude: location.coord[1] };
  // Like HAFAS, each of these servers' own index reaches well past its area
  // (VVS answered a Nürnberg query with VGN's own stop) — only a result
  // actually inside this network's region is this network's to report.
  if (ownerOfEfa(coordinates) !== network.id) return null;

  const name = normalizeStopName(location.name);
  return {
    stopId: formatEfaStopId({ network: network.id, id: location.id }),
    name: location.name,
    sourceLabel: network.label,
    coordinates,
    rank,
    priority: 0,
    matchesQuery: tokens.every((token) => name.includes(token)),
  };
}

async function searchNetwork(network: EfaNetwork, query: string, tokens: string[]): Promise<Candidate[] | null> {
  try {
    const response = await efaRequest<EfaStopFinderResponse>(network, 'XML_STOPFINDER_REQUEST', {
      type_sf: 'any',
      name_sf: query,
    });
    return (response.locations ?? []).flatMap(
      (location, rank) => toCandidate(network, location, rank, tokens) ?? [],
    );
  } catch (err) {
    console.warn(`[search] ${network.id} failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// Stops short of the matching-or-all decision — see searchHafasCandidates's
// comment; ../search.ts makes that call once, across both sources combined.
export async function searchEfaCandidates(query: string, tokens: string[]): Promise<Candidate[]> {
  const perNetwork = await Promise.all(EFA_NETWORKS.map((network) => searchNetwork(network, query, tokens)));
  return perNetwork.flatMap((candidates) => candidates ?? []);
}
