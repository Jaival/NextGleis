import { cached } from '../lib/cache.js';
import { findJourneys } from '../lib/hafas/journeys.js';
import { resolveStopId } from '../lib/hafas/resolve.js';
import { parseStopId } from '../lib/hafas/stopId.js';
import { queryParam, sendError, type ApiRequest, type ApiResponse } from '../lib/http.js';

// A cross-country search can try two networks, each after matching both stops
// up in it, and a single upstream routing call alone took ~7.6s in testing.
export const config = { maxDuration: 60 };

// GET /api/journeys?from=<stop id>&to=<stop id>
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

  try {
    const journeys = await cached(`journeys:${fromId}>${toId}`, 60_000, async () => {
      const [origin, destination] = await Promise.all([resolveStopId(from), resolveStopId(to)]);
      return findJourneys(origin, destination);
    });
    res.status(200).json(journeys);
  } catch (err) {
    sendError(res, err);
  }
}
