import { isNetworkId, type NetworkId } from './networks.js';

// A HAFAS stop id only means something inside the network that issued it
// (Frankfurt Hbf is 3000010 in RMV, 8000105 in VBN), so ids handed to the app
// carry their network as a prefix: "rmv:3000010".
export type StopRef = { network: NetworkId; id: string };

// A bare number is an EVA number from a favorite saved against the DB
// Timetables API, before the switch to HAFAS — see resolveEva().
export type ParsedStopId = { kind: 'hafas'; ref: StopRef } | { kind: 'eva'; eva: string };

export function parseStopId(raw: string): ParsedStopId | null {
  const separator = raw.indexOf(':');
  if (separator === -1) return /^\d{6,8}$/.test(raw) ? { kind: 'eva', eva: raw } : null;

  const network = raw.slice(0, separator);
  const id = raw.slice(separator + 1);
  if (!isNetworkId(network) || !id) return null;
  return { kind: 'hafas', ref: { network, id } };
}

export function formatStopId(ref: StopRef): string {
  return `${ref.network}:${ref.id}`;
}
