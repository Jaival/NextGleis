import { isEfaNetworkId, type EfaNetworkId } from './networks.js';

// An EFA global stop id already contains colons of its own (e.g.
// "de:08111:6118"), so it's carried as the tail of the app's stop id after
// the network prefix: "vvs:de:08111:6118". See ../stopId.ts, which only
// splits on the first colon, so the rest passes through untouched.
export type EfaStopRef = { network: EfaNetworkId; id: string };

export function parseEfaStopId(raw: string): EfaStopRef | null {
  const separator = raw.indexOf(':');
  if (separator === -1) return null;
  const network = raw.slice(0, separator);
  const id = raw.slice(separator + 1);
  if (!isEfaNetworkId(network) || !id) return null;
  return { network, id };
}

export function formatEfaStopId(ref: EfaStopRef): string {
  return `${ref.network}:${ref.id}`;
}
