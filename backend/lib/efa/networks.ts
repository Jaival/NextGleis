import type { Coordinates } from '../hafas/geo.js';

// The regional EFA (Elektronische Fahrplanauskunft) deployments that fill the
// one real gap in HAFAS coverage: Baden-Württemberg and Bavaria have no
// working HAFAS profile with local bus and tram data (see
// THINGS_TO_KNOW.md). Found via the public-transport/transport-apis registry
// — the same project hafas-client's maintainer runs — and confirmed live.
// A statewide EFA-BW endpoint exists too, but it's missing from that registry
// and its XML interface is due to retire at the end of 2027, so these four
// metro-area operators' own servers are the only verified-working source.
export type EfaNetworkId = 'vvs' | 'kvv' | 'mvv' | 'vgn';

// [south, west, north, east] in degrees — the bounding box of each network's
// published realtime-coverage area (public-transport/transport-apis), used
// the same way as the HAFAS region boxes: the smallest box a point falls in
// wins (see ownerOf in ../hafas/networks.ts for the HAFAS half of this).
type Box = readonly [number, number, number, number];

export type EfaNetwork = {
  id: EfaNetworkId;
  label: string;
  // Base URL, trailing slash — EFA requests are `${endpoint}XML_..._REQUEST`.
  endpoint: string;
  regions: readonly Box[];
};

export const EFA_NETWORKS: readonly EfaNetwork[] = [
  { id: 'vvs', label: 'VVS', endpoint: 'https://www3.vvs.de/vvs/', regions: [[48.499, 8.746, 49.078, 9.941]] },
  {
    id: 'kvv',
    label: 'KVV',
    endpoint: 'https://projekte.kvv-efa.de/sl3/',
    regions: [[48.586, 7.959, 49.298, 8.894]],
  },
  {
    id: 'mvv',
    label: 'MVV',
    endpoint: 'https://efa.mvv-muenchen.de/mobile/',
    regions: [[47.739, 10.976, 48.648, 12.278]],
  },
  { id: 'vgn', label: 'VGN', endpoint: 'https://efa.vgn.de/vgn/', regions: [[48.858, 10.039, 50.236, 12.123]] },
];

const byId = new Map(EFA_NETWORKS.map((network) => [network.id, network]));

export function isEfaNetworkId(value: string): value is EfaNetworkId {
  return byId.has(value as EfaNetworkId);
}

export function efaNetworkById(id: EfaNetworkId): EfaNetwork {
  const network = byId.get(id);
  if (!network) throw new Error(`Unknown EFA network "${id}"`);
  return network;
}

// The EFA network whose own area a point falls in, if any. Unlike HAFAS's
// ownerOf, there's no "smallest box wins" tie-break needed yet — the four
// regions don't overlap each other — but the shape matches it so the two can
// be combined the same way in lib/search.ts.
export function ownerOfEfa({ latitude, longitude }: Coordinates): EfaNetworkId | undefined {
  for (const network of EFA_NETWORKS) {
    for (const [south, west, north, east] of network.regions) {
      if (latitude >= south && latitude <= north && longitude >= west && longitude <= east) {
        return network.id;
      }
    }
  }
  return undefined;
}
