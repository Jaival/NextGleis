import { createClient, type HafasClient, type Profile } from 'hafas-client';
import { profile as avv } from 'hafas-client/p/avv/index.js';
import { profile as insa } from 'hafas-client/p/insa/index.js';
import { profile as invg } from 'hafas-client/p/invg/index.js';
import { profile as nahsh } from 'hafas-client/p/nahsh/index.js';
import { profile as nvv } from 'hafas-client/p/nvv/index.js';
import { profile as rmv } from 'hafas-client/p/rmv/index.js';
import { profile as rsag } from 'hafas-client/p/rsag/index.js';
import { profile as saarfahrplan } from 'hafas-client/p/saarfahrplan/index.js';
import { profile as sbahnMuenchen } from 'hafas-client/p/sbahn-muenchen/index.js';
import { profile as vbb } from 'hafas-client/p/vbb/index.js';
import { profile as vbn } from 'hafas-client/p/vbn/index.js';
import { profile as vmt } from 'hafas-client/p/vmt/index.js';
import { profile as vos } from 'hafas-client/p/vos/index.js';
import { profile as vsn } from 'hafas-client/p/vsn/index.js';
import { HAFAS_USER_AGENT } from '../env.js';
import type { Coordinates } from './geo.js';

export type NetworkId =
  | 'avv'
  | 'insa'
  | 'invg'
  | 'nahsh'
  | 'nvv'
  | 'rmv'
  | 'rsag'
  | 'saarfahrplan'
  | 'sbahn-muenchen'
  | 'vbb'
  | 'vbn'
  | 'vmt'
  | 'vos'
  | 'vsn';

// [south, west, north, east] in degrees.
type Box = readonly [number, number, number, number];

export type Network = {
  id: NetworkId;
  label: string;
  profile: Profile;
  // Where this network's own data lives: the area it has every local bus and
  // tram for, not just the Germany-wide rail stations nearly all of them also
  // index. Rough boxes rather than borders — at a boundary either neighbour
  // usually carries the cross-border lines too. Where boxes overlap, the
  // smallest one wins (see ownerOf).
  regions: readonly Box[];
  // Set on networks whose index also has usable departures well beyond their
  // own area; their results stand in where no network owns a stop (most of
  // Bavaria and Baden-Württemberg have no working HAFAS profile). Lower is
  // preferred.
  fallbackRank?: number;
};

// Germany's HAFAS networks that hafas-client supports and that still answered
// when checked in September 2026. Left out: `db` (DB's HAFAS was shut down —
// the host no longer resolves), `vrn` and `mobil-nrw` (hosts gone too), `bvg`
// (a subset of VBB), `db-busradar-nrw` (only DB's NRW buses) and `kvb` (reads
// a pinned TLS certificate from disk at import time; AVV already covers
// Cologne).
export const NETWORKS: readonly Network[] = [
  { id: 'rmv', label: 'RMV', profile: rmv, regions: [[49.38, 7.75, 50.72, 10.25]], fallbackRank: 2 },
  { id: 'nvv', label: 'NVV', profile: nvv, regions: [[50.7, 8.45, 51.66, 10.25]], fallbackRank: 4 },
  { id: 'vbb', label: 'VBB', profile: vbb, regions: [[51.35, 11.25, 53.56, 14.77]] },
  {
    id: 'insa',
    label: 'INSA',
    profile: insa,
    // Saxony-Anhalt, and Saxony, which has no profile of its own but whose
    // trams INSA carries.
    regions: [
      [50.94, 10.56, 53.04, 12.3],
      [50.17, 12.1, 51.69, 15.04],
    ],
    fallbackRank: 0,
  },
  { id: 'vmt', label: 'VMT', profile: vmt, regions: [[50.2, 9.87, 51.3, 12.3]] },
  // Includes Hamburg, whose HVV network NAH.SH carries in full.
  { id: 'nahsh', label: 'NAH.SH', profile: nahsh, regions: [[53.36, 7.86, 55.06, 11.32]], fallbackRank: 3 },
  { id: 'vbn', label: 'VBN', profile: vbn, regions: [[51.29, 6.65, 53.9, 11.6]], fallbackRank: 1 },
  { id: 'vos', label: 'VOS', profile: vos, regions: [[52.05, 7.55, 52.75, 8.45]] },
  { id: 'vsn', label: 'VSN', profile: vsn, regions: [[51.3, 9.4, 51.95, 10.45]] },
  { id: 'rsag', label: 'RSAG', profile: rsag, regions: [[53.95, 11.9, 54.25, 12.35]] },
  // AVV's own area is Aachen, but its data has local lines for all of NRW —
  // the only working source for the state since mobil.nrw went away.
  { id: 'avv', label: 'AVV', profile: avv, regions: [[50.32, 5.86, 52.53, 9.47]] },
  { id: 'saarfahrplan', label: 'Saarfahrplan', profile: saarfahrplan, regions: [[49.1, 6.35, 49.65, 7.42]] },
  { id: 'sbahn-muenchen', label: 'S-Bahn München', profile: sbahnMuenchen, regions: [[47.75, 10.85, 48.55, 12.2]] },
  { id: 'invg', label: 'INVG', profile: invg, regions: [[48.6, 11.2, 48.95, 11.65]] },
];

const byId = new Map(NETWORKS.map((network) => [network.id, network]));

export function isNetworkId(value: string): value is NetworkId {
  return byId.has(value as NetworkId);
}

export function networkById(id: NetworkId): Network {
  const network = byId.get(id);
  if (!network) throw new Error(`Unknown network "${id}"`);
  return network;
}

// The network whose own area a point falls in, if any.
export function ownerOf({ latitude, longitude }: Coordinates): NetworkId | undefined {
  let best: { id: NetworkId; area: number } | undefined;
  for (const network of NETWORKS) {
    for (const [south, west, north, east] of network.regions) {
      if (latitude < south || latitude > north || longitude < west || longitude > east) continue;
      const area = (north - south) * (east - west);
      if (!best || area < best.area) best = { id: network.id, area };
    }
  }
  return best?.id;
}

const clients = new Map<NetworkId, HafasClient>();

export function clientFor(id: NetworkId): HafasClient {
  let client = clients.get(id);
  if (!client) {
    client = createClient(networkById(id).profile, HAFAS_USER_AGENT);
    clients.set(id, client);
  }
  return client;
}

export class UpstreamTimeoutError extends Error {
  constructor(ms: number) {
    super(`Upstream network did not answer within ${ms}ms`);
    this.name = 'UpstreamTimeoutError';
  }
}

// hafas-client has no per-request deadline, and a stalled network would
// otherwise hold the whole serverless invocation open. The request keeps
// running in the background; its result is simply ignored.
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new UpstreamTimeoutError(ms)), ms);
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}
