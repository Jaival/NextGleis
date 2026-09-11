import type { DbEvent, DbTimetable, DbTimetableStop } from '../types/db.js';
import type { DepartureRow } from '../types/index.js';
import { classifyService, lineLabel } from './lines.js';

// DB timestamps are YYMMddHHmm, Europe/Berlin local wall-clock time (not UTC).
function toIsoBerlinLocal(raw: string): string {
  const yy = raw.slice(0, 2);
  const mm = raw.slice(2, 4);
  const dd = raw.slice(4, 6);
  const hh = raw.slice(6, 8);
  const mi = raw.slice(8, 10);
  return `20${yy}-${mm}-${dd}T${hh}:${mi}:00`;
}

function diffMinutes(laterRaw: string, earlierRaw: string): number {
  const toEpoch = (raw: string) => Date.parse(`${toIsoBerlinLocal(raw)}Z`);
  return Math.round((toEpoch(laterRaw) - toEpoch(earlierRaw)) / 60_000);
}

// ppth/cpth: for departures, the path lists stations *after* this one, in
// order — the last entry is the trip's destination.
function directionFromPath(dp: DbEvent): string {
  const path = dp.cpth ?? dp.ppth;
  if (!path) return '';
  const stations = path.split('|');
  return stations[stations.length - 1] ?? '';
}

function mergeEvent(planEvent?: DbEvent, changeEvent?: DbEvent): DbEvent | undefined {
  if (!planEvent && !changeEvent) return undefined;
  return { ...planEvent, ...changeEvent };
}

// Merges a plan (scheduled) timetable with a changes (fchg/rchg) timetable,
// matching stops by their `id`, and flattens the result into DepartureRows.
// Arrival-only stops (no <dp>) are dropped — this app shows departures only.
export function buildDepartureRows(plan: DbTimetable, changes: DbTimetable): DepartureRow[] {
  const stops = new Map<string, DbTimetableStop>();

  for (const stop of plan.s ?? []) {
    stops.set(stop.id, stop);
  }

  for (const changeStop of changes.s ?? []) {
    const existing = stops.get(changeStop.id);
    if (!existing) {
      // Added/unplanned stop — not in this slice's plan data at all.
      stops.set(changeStop.id, changeStop);
      continue;
    }
    stops.set(changeStop.id, {
      ...existing,
      tl: existing.tl ?? changeStop.tl,
      ar: mergeEvent(existing.ar, changeStop.ar),
      dp: mergeEvent(existing.dp, changeStop.dp),
    });
  }

  const rows: DepartureRow[] = [];

  for (const stop of stops.values()) {
    const dp = stop.dp;
    if (!dp) continue;

    const scheduled = dp.pt ?? dp.ct;
    if (!scheduled) continue;

    // Timetables carries no operator name, so only the category can tell.
    const kind = classifyService({ category: stop.tl?.c });
    // `dp.l` is the line indicator and `tl.c` the category.
    const row: DepartureRow = {
      line: lineLabel(stop.tl?.c, dp.l ?? stop.tl?.n, { rail: kind !== 'transit' }),
      direction: directionFromPath(dp),
      scheduledTime: toIsoBerlinLocal(scheduled),
      cancelled: dp.cs === 'c',
      kind,
    };

    if (dp.ct && dp.pt) {
      row.actualTime = toIsoBerlinLocal(dp.ct);
      row.delayMinutes = Math.max(0, diffMinutes(dp.ct, dp.pt));
    }

    const platform = dp.cp ?? dp.pp;
    if (platform) row.platform = platform;

    rows.push(row);
  }

  rows.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  return rows;
}
