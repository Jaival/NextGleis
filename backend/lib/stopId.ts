import { parseEfaStopId, type EfaStopRef } from './efa/stopId.js';
import { parseStopId as parseHafasStopId, type ParsedStopId as HafasParsedStopId } from './hafas/stopId.js';

// Every stop id the app hands the backend, across both sources: a HAFAS
// network ref or a legacy EVA number (see hafas/stopId.ts), or now an EFA
// network ref (see efa/stopId.ts). HAFAS is tried first — its network
// prefixes and EFA's never collide, so this is unambiguous.
export type ParsedStopId = HafasParsedStopId | { kind: 'efa'; ref: EfaStopRef };

export function parseStopId(raw: string): ParsedStopId | null {
  const hafas = parseHafasStopId(raw);
  if (hafas) return hafas;
  const efa = parseEfaStopId(raw);
  if (efa) return { kind: 'efa', ref: efa };
  return null;
}
