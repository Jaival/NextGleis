import { cached } from '../lib/cache.js';
import { nearbyStops } from '../lib/hafas/nearby.js';
import { queryParam, sendError, type ApiRequest, type ApiResponse } from '../lib/http.js';

// Stops don't move, and rounding the position to ~100 m lets everyone standing
// around the same stop share one lookup.
const NEARBY_TTL_MS = 60 * 60_000;

function coordinate(raw: string | undefined, limit: number): number | null {
  if (raw === undefined) return null;
  const value = Number(raw);
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
}

// GET /api/nearby?lat=<latitude>&lon=<longitude>
// The position is only used for this lookup. The app already rounds it to
// ~100 m before sending (lib/useNearbyStops.ts); rounding again here keeps the
// cache key coarse for any other client too.
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const latitude = coordinate(queryParam(req, 'lat'), 90);
  const longitude = coordinate(queryParam(req, 'lon'), 180);
  if (latitude === null || longitude === null) {
    res.status(400).json({ error: 'Missing or malformed "lat" / "lon" parameters' });
    return;
  }

  const rounded = { latitude: Math.round(latitude * 1000) / 1000, longitude: Math.round(longitude * 1000) / 1000 };
  try {
    const stops = await cached(`nearby:${rounded.latitude},${rounded.longitude}`, NEARBY_TTL_MS, () =>
      nearbyStops(rounded),
    );
    res.status(200).json(stops);
  } catch (err) {
    sendError(res, err);
  }
}
