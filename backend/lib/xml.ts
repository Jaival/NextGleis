import { XMLParser } from 'fast-xml-parser';
import type { DbStationData, DbTimetable, DbTimetableStop } from '../types/db';

// attributeNamePrefix: '' means attributes land as plain keys (e.g. dp.pt),
// matching the DbEvent/DbTimetableStop shapes directly — safe here because
// <ar>/<dp>/<tl>/<station> are always self-closed (attributes only, no
// mixed text/child content) in this API's schema.
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  // These are declared as arrays in the OpenAPI schema (timetable.s,
  // multipleStationData.station) — force array even when XML has 0 or 1 items,
  // since fast-xml-parser otherwise collapses a single child to an object.
  isArray: (name) => name === 's' || name === 'station',
});

function parseRaw(xml: string): Record<string, any> {
  return parser.parse(xml) as Record<string, any>;
}

// The OpenAPI doc doesn't state the XML root tag for wrapper types, so this
// unwraps defensively: prefer the documented root name, fall back to treating
// the parsed document itself as the root.
export function parseTimetable(xml: string): DbTimetable {
  const parsed = parseRaw(xml);
  const root = parsed.timetable ?? parsed;
  const stops: DbTimetableStop[] = Array.isArray(root?.s) ? root.s : root?.s ? [root.s] : [];
  return { eva: root?.eva, station: root?.station, s: stops };
}

export function parseStationSearch(xml: string): DbStationData[] {
  const parsed = parseRaw(xml);
  const root = parsed.stations ?? parsed;
  const list = root?.station;
  if (!list) return [];
  return Array.isArray(list) ? list : [list];
}
