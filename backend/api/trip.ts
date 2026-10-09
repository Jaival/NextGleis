import { cached } from '../lib/cache.js';
import { queryParam, sendError, type ApiRequest, type ApiResponse } from '../lib/http.js';
import { hafasTrip, parseTripId } from '../lib/hafas/trip.js';

// GET /api/trip?id=<network>:<HAFAS trip id> — every stop of one run, with
// live times. The id comes from a board row's `tripId`.
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const tripId = queryParam(req, 'id');
  const ref = tripId ? parseTripId(tripId) : null;
  if (!tripId || !ref) {
    res.status(400).json({ error: 'Missing or malformed trip id' });
    return;
  }

  try {
    // Same freshness as a board: the delays are the point.
    const trip = await cached(`trip:${tripId}`, 25_000, () => hafasTrip(ref));
    res.status(200).json(trip);
  } catch (err) {
    sendError(res, err);
  }
}
