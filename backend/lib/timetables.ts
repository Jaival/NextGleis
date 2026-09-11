import type { DbTimetable } from '../types/db.js';
import type { DepartureRow } from '../types/index.js';
import { fetchDbXml } from './dbClient.js';
import { buildDepartureRows } from './merge.js';
import { parseTimetable } from './xml.js';

function berlinDateHour(fromNow: Date): { date: string; hour: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fromNow);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return { date: `${get('year')}${get('month')}${get('day')}`, hour: get('hour') };
}

// A board straight from DB's Timetables API: the current and next hour's plan
// merged with recent changes. Only reached for favorites saved before the
// switch to HAFAS whose EVA number no HAFAS network can place.
export async function timetablesBoard(evaNo: string): Promise<DepartureRow[]> {
  const now = new Date();
  const current = berlinDateHour(now);
  const next = berlinDateHour(new Date(now.getTime() + 3_600_000));

  const [planCurrentXml, planNextXml, rchgXml] = await Promise.all([
    fetchDbXml(`/plan/${evaNo}/${current.date}/${current.hour}`),
    fetchDbXml(`/plan/${evaNo}/${next.date}/${next.hour}`),
    fetchDbXml(`/rchg/${evaNo}`),
  ]);

  const planCurrent = parseTimetable(planCurrentXml);
  const planNext = parseTimetable(planNextXml);
  const rchg = parseTimetable(rchgXml);

  const mergedPlan: DbTimetable = { s: [...(planCurrent.s ?? []), ...(planNext.s ?? [])] };
  return buildDepartureRows(mergedPlan, rchg);
}
