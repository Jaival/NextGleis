import type { ArrivalRow, DepartureRow } from '../../types/index.js';
import { clientFor, withTimeout } from './networks.js';
import { toArrivalRow, toDepartureRow } from './normalize.js';
import type { StopRef } from './stopId.js';
import { formatTripId } from './trip.js';

// The window the app promises: "the next couple of hours". HAFAS caps a board
// at a handful of departures unless asked for more (Frankfurt Hbf came back
// with 12 for two hours by default), so the limit is explicit and generous.
const BOARD_MINUTES = 120;
const BOARD_MAX_RESULTS = 300;
const BOARD_TIMEOUT_MS = 6_000;

// `when` starts the window somewhere other than now — "Show later" on a board
// asks for the window that begins where the last one ended.
export async function hafasBoard(ref: StopRef, when?: Date): Promise<DepartureRow[]> {
  const client = clientFor(ref.network);
  if (!client.departures) throw new Error(`${ref.network} has no departure boards`);

  const { departures } = await withTimeout(
    client.departures(ref.id, {
      when,
      duration: BOARD_MINUTES,
      results: BOARD_MAX_RESULTS,
      remarks: true,
      // No `stopovers` key at all: hafas-client rejects the option outright on
      // boards, even set to false.
      linesOfStops: false,
    }),
    BOARD_TIMEOUT_MS,
  );

  return departures
    .flatMap((departure) => {
      const row = toDepartureRow(departure);
      if (!row) return [];
      if (departure.tripId) row.tripId = formatTripId(ref.network, departure.tripId);
      return row;
    })
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

export async function hafasArrivalBoard(ref: StopRef, when?: Date): Promise<ArrivalRow[]> {
  const client = clientFor(ref.network);
  if (!client.arrivals) throw new Error(`${ref.network} has no arrival boards`);

  const { arrivals } = await withTimeout(
    client.arrivals(ref.id, {
      when,
      duration: BOARD_MINUTES,
      results: BOARD_MAX_RESULTS,
      remarks: true,
      linesOfStops: false,
    }),
    BOARD_TIMEOUT_MS,
  );

  return arrivals
    .flatMap((arrival) => {
      const row = toArrivalRow(arrival);
      if (!row) return [];
      if (arrival.tripId) row.tripId = formatTripId(ref.network, arrival.tripId);
      return row;
    })
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}
