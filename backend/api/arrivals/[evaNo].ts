import { fromBerlinWallClock } from '../../lib/berlinTime.js';
import { cached } from '../../lib/cache.js';
import { hafasArrivalBoard } from '../../lib/hafas/board.js';
import { preferOwner } from '../../lib/hafas/resolve.js';
import { queryParam, sendError, type ApiRequest, type ApiResponse } from '../../lib/http.js';
import { parseStopId } from '../../lib/stopId.js';

// GET /api/arrivals/<stop id>[?when=<Berlin wall-clock>] — see the board route.
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const stopId = queryParam(req, 'evaNo');
  const stop = stopId ? parseStopId(stopId) : null;
  if (!stopId || !stop) {
    res.status(400).json({ error: 'Missing or malformed stop id' });
    return;
  }
  // Arrival boards are only built for HAFAS: EFA stops don't have one yet
  // (see docs/ROADMAP.md), and a favorite saved under the old DB Timetables
  // API has no arrivals fallback either (merge.ts drops arrival-only stops).
  if (stop.kind !== 'hafas') {
    res.status(404).json({ error: 'Arrival boards are not available for this station' });
    return;
  }
  const whenParam = queryParam(req, 'when');
  const when = whenParam ? fromBerlinWallClock(whenParam) : undefined;
  if (when === null) {
    res.status(400).json({ error: 'Malformed "when"' });
    return;
  }

  try {
    const rows = await cached(`arrivals:${stopId}@${whenParam ?? 'now'}`, 25_000, async () =>
      hafasArrivalBoard(await preferOwner(stop.ref), when),
    );
    res.status(200).json(rows);
  } catch (err) {
    sendError(res, err);
  }
}
