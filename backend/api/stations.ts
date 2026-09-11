import { cached } from '../lib/cache.js';
import { searchStops } from '../lib/hafas/search.js';
import { queryParam, sendError, type ApiRequest, type ApiResponse } from '../lib/http.js';

// Stop names barely change, and every search fans out to all networks — a few
// minutes' cache spares them the same query from every user typing it.
const SEARCH_TTL_MS = 5 * 60_000;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const query = queryParam(req, 'query');
  if (!query) {
    res.status(400).json({ error: 'Missing required "query" parameter' });
    return;
  }

  try {
    const results = await cached(`stations:${query.toLowerCase()}`, SEARCH_TTL_MS, () =>
      searchStops(query),
    );
    res.status(200).json(results);
  } catch (err) {
    sendError(res, err);
  }
}
