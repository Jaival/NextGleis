import { fromBerlinWallClock } from '../../lib/berlinTime.js';
import { cached } from '../../lib/cache.js';
import { efaBoard } from '../../lib/efa/board.js';
import { hasDbCredentials } from '../../lib/env.js';
import { hafasBoard } from '../../lib/hafas/board.js';
import { preferOwner, resolveEva } from '../../lib/hafas/resolve.js';
import { queryParam, sendError, type ApiRequest, type ApiResponse } from '../../lib/http.js';
import { parseStopId, type ParsedStopId } from '../../lib/stopId.js';
import { timetablesBoard } from '../../lib/timetables.js';
import type { DepartureRow } from '../../types/index.js';

async function loadBoard(stop: ParsedStopId, when: Date | undefined): Promise<DepartureRow[]> {
  if (stop.kind === 'hafas') return hafasBoard(await preferOwner(stop.ref), when);
  if (stop.kind === 'efa') return efaBoard(stop.ref, when);

  // A favorite saved under the old DB Timetables API. HAFAS is tried first so
  // it gains local transit and the DB pill like everything else; the old
  // source is the fallback for a station no network can place.
  let resolved;
  try {
    resolved = await resolveEva(stop.eva);
  } catch (err) {
    // The Timetables API only answers for the current hour or so, so it has
    // no later window to give.
    if (hasDbCredentials()) return when ? [] : timetablesBoard(stop.eva);
    throw err;
  }
  return hafasBoard(resolved, when);
}

// GET /api/board/<stop id>[?when=<Berlin wall-clock, YYYY-MM-DDTHH:mm>]
// `when` starts the two-hour window there instead of now.
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const stopId = queryParam(req, 'evaNo');
  const stop = stopId ? parseStopId(stopId) : null;
  if (!stopId || !stop) {
    res.status(400).json({ error: 'Missing or malformed stop id' });
    return;
  }
  const whenParam = queryParam(req, 'when');
  const when = whenParam ? fromBerlinWallClock(whenParam) : undefined;
  if (when === null) {
    res.status(400).json({ error: 'Malformed "when"' });
    return;
  }

  try {
    const rows = await cached(`board:${stopId}@${whenParam ?? 'now'}`, 25_000, () =>
      loadBoard(stop, when),
    );
    res.status(200).json(rows);
  } catch (err) {
    sendError(res, err);
  }
}
