import { cached } from '../lib/cache.js';
import { cacheOnCdn, queryParam, sendError, type ApiRequest, type ApiResponse } from '../lib/http.js';
import { searchStops } from '../lib/search.js';

// Stop names barely change, and every search fans out to all networks — a few
// minutes' cache spares them the same query from every user typing it.
const SEARCH_TTL_MS = 5 * 60_000;

// No stop name is this long; the cap bounds cache keys and the fan-out to 18 networks.
const MAX_QUERY_LENGTH = 100;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const query = queryParam(req, 'query');
  if (!query) {
    res.status(400).json({ error: 'Missing required "query" parameter' });
    return;
  }
  if (query.length > MAX_QUERY_LENGTH) {
    res.status(400).json({ error: '"query" is too long' });
    return;
  }

  try {
    const results = await cached(`stations:${query.toLowerCase()}`, SEARCH_TTL_MS, () =>
      searchStops(query),
    );
    cacheOnCdn(res, SEARCH_TTL_MS / 1000);
    res.status(200).json(results);
  } catch (err) {
    sendError(res, err);
  }
}
