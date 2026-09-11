import { cached } from '../../lib/cache.js';
import { hasDbCredentials } from '../../lib/env.js';
import { hafasBoard } from '../../lib/hafas/board.js';
import { preferOwner, resolveEva } from '../../lib/hafas/resolve.js';
import { parseStopId, type ParsedStopId } from '../../lib/hafas/stopId.js';
import { queryParam, sendError, type ApiRequest, type ApiResponse } from '../../lib/http.js';
import { timetablesBoard } from '../../lib/timetables.js';
import type { DepartureRow } from '../../types/index.js';

async function loadBoard(stop: ParsedStopId): Promise<DepartureRow[]> {
  if (stop.kind === 'hafas') return hafasBoard(await preferOwner(stop.ref));

  // A favorite saved under the old DB Timetables API. HAFAS is tried first so
  // it gains local transit and the DB pill like everything else; the old
  // source is the fallback for a station no network can place.
  let resolved;
  try {
    resolved = await resolveEva(stop.eva);
  } catch (err) {
    if (hasDbCredentials()) return timetablesBoard(stop.eva);
    throw err;
  }
  return hafasBoard(resolved);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const stopId = queryParam(req, 'evaNo');
  const stop = stopId ? parseStopId(stopId) : null;
  if (!stopId || !stop) {
    res.status(400).json({ error: 'Missing or malformed stop id' });
    return;
  }

  try {
    const rows = await cached(`board:${stopId}`, 25_000, () => loadBoard(stop));
    res.status(200).json(rows);
  } catch (err) {
    sendError(res, err);
  }
}
