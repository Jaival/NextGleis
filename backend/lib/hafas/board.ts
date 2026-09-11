import type { DepartureRow } from '../../types/index.js';
import { clientFor, withTimeout } from './networks.js';
import { toDepartureRow } from './normalize.js';
import type { StopRef } from './stopId.js';

// The window the app promises: "the next couple of hours". HAFAS caps a board
// at a handful of departures unless asked for more (Frankfurt Hbf came back
// with 12 for two hours by default), so the limit is explicit and generous.
const BOARD_MINUTES = 120;
const BOARD_MAX_RESULTS = 300;
const BOARD_TIMEOUT_MS = 6_000;

export async function hafasBoard(ref: StopRef): Promise<DepartureRow[]> {
  const client = clientFor(ref.network);
  if (!client.departures) throw new Error(`${ref.network} has no departure boards`);

  const { departures } = await withTimeout(
    client.departures(ref.id, {
      duration: BOARD_MINUTES,
      results: BOARD_MAX_RESULTS,
      remarks: false,
      // No `stopovers` key at all: hafas-client rejects the option outright on
      // boards, even set to false.
      linesOfStops: false,
    }),
    BOARD_TIMEOUT_MS,
  );

  return departures
    .flatMap((departure) => toDepartureRow(departure) ?? [])
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}
