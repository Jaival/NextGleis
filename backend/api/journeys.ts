import { cached } from '../lib/cache.js';
import { findJourneys, parsePageRef, type JourneyQuery } from '../lib/hafas/journeys.js';
import { resolveStopId } from '../lib/hafas/resolve.js';
import { parseStopId } from '../lib/hafas/stopId.js';
import { queryParam, sendError, type ApiRequest, type ApiResponse } from '../lib/http.js';

// A cross-country search can try two networks, each after matching both stops
// up in it, and a single upstream routing call alone took ~7.6s in testing.
export const config = { maxDuration: 60 };

// Reads the time or page the request asks for. `null` means the combination
// is malformed; an empty departure query means "from now".
function readQuery(req: ApiRequest): JourneyQuery | null {
  const when = queryParam(req, 'when');
  const arrival = queryParam(req, 'arrival') === '1';
  const earlier = queryParam(req, 'earlier');
  const later = queryParam(req, 'later');

  if (earlier || later) {
    // A page ref already carries the original time; a second time or a
    // second direction would contradict it.
    if ((earlier && later) || when || arrival) return null;
    const ref = parsePageRef((earlier ?? later)!);
    if (!ref) return null;
    return earlier ? { earlier: ref } : { later: ref };
  }

  if (!when) return arrival ? null : { arrival: false };
  const instant = new Date(when);
  if (Number.isNaN(instant.getTime())) return null;
  return { when: instant, arrival };
}

// GET /api/journeys?from=<stop id>&to=<stop id>
//   [&when=<ISO 8601 instant>[&arrival=1]] | [&earlier=<ref>] | [&later=<ref>]
//   [&regional=1] [&paged=1]
//
// `regional=1` leaves out trains the Deutschlandticket doesn't cover; send it
// with every page of the same search.
//
// Without `paged=1` the response is the bare Journey[] that app versions from
// before earlier/later connections expect. With it, it's a JourneyPage that
// also carries the refs for the connections around it.
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const fromId = queryParam(req, 'from');
  const toId = queryParam(req, 'to');
  const from = fromId ? parseStopId(fromId) : null;
  const to = toId ? parseStopId(toId) : null;
  if (!from || !to) {
    res.status(400).json({ error: 'Missing or malformed "from" / "to" stop ids' });
    return;
  }
  const query = readQuery(req);
  if (!query) {
    res.status(400).json({ error: 'Malformed "when" / "arrival" / "earlier" / "later"' });
    return;
  }

  const regionalOnly = queryParam(req, 'regional') === '1';
  const key = [
    'journeys',
    `${fromId}>${toId}`,
    queryParam(req, 'when') ?? '',
    queryParam(req, 'arrival') === '1' ? 'arr' : 'dep',
    queryParam(req, 'earlier') ?? '',
    queryParam(req, 'later') ?? '',
    regionalOnly ? 'regional' : 'all',
  ].join('|');

  try {
    const page = await cached(key, 60_000, async () => {
      const [origin, destination] = await Promise.all([resolveStopId(from), resolveStopId(to)]);
      return findJourneys(origin, destination, query, { regionalOnly });
    });
    res.status(200).json(queryParam(req, 'paged') === '1' ? page : page.journeys);
  } catch (err) {
    sendError(res, err);
  }
}
