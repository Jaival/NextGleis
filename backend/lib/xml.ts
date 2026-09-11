import { XMLParser } from 'fast-xml-parser';
import type { DbTimetable, DbTimetableStop } from '../types/db.js';

// attributeNamePrefix: '' means attributes land as plain keys (e.g. dp.pt),
// matching the DbEvent/DbTimetableStop shapes directly — safe here because
// <ar>/<dp>/<tl> are always self-closed (attributes only, no mixed text/child
// content) in this API's schema.
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  // Declared as an array in the OpenAPI schema (timetable.s) — force array
  // even when XML has 0 or 1 items, since fast-xml-parser otherwise collapses
  // a single child to an object.
  isArray: (name) => name === 's',
});

// The OpenAPI doc doesn't state the XML root tag for wrapper types, so this
// unwraps defensively: prefer the documented root name, fall back to treating
// the parsed document itself as the root.
export function parseTimetable(xml: string): DbTimetable {
  const parsed = parser.parse(xml) as Record<string, any>;
  const root = parsed.timetable ?? parsed;
  const stops: DbTimetableStop[] = Array.isArray(root?.s) ? root.s : root?.s ? [root.s] : [];
  return { eva: root?.eva, station: root?.station, s: stops };
}
