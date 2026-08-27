import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cached } from '../lib/cache';
import { DbApiError, fetchDbXml } from '../lib/dbClient';
import { parseStationSearch } from '../lib/xml';
import type { StationSearchResult } from '../types';

// The DB endpoint already treats the pattern as a name prefix (or eva number,
// or ds100 code, or explicit '*' wildcard) — no need to add wildcards here.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const rawQuery = req.query.query;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim();
  if (!query) {
    res.status(400).json({ error: 'Missing required "query" parameter' });
    return;
  }

  try {
    const results = await cached<StationSearchResult[]>(`stations:${query.toLowerCase()}`, 20_000, async () => {
      const xml = await fetchDbXml(`/station/${encodeURIComponent(query)}`);
      const stations = parseStationSearch(xml);
      return stations.map((s) => ({ evaNo: String(s.eva), name: s.name }));
    });

    res.status(200).json(results);
  } catch (err) {
    if (err instanceof DbApiError) {
      res.status(err.status >= 500 ? 502 : err.status).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
}
