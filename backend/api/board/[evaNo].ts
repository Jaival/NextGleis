import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cached } from '../../lib/cache';
import { DbApiError, fetchDbXml } from '../../lib/dbClient';
import { buildDepartureRows } from '../../lib/merge';
import { parseTimetable } from '../../lib/xml';
import type { DbTimetable } from '../../types/db';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const rawEvaNo = req.query.evaNo;
  const evaNo = Array.isArray(rawEvaNo) ? rawEvaNo[0] : rawEvaNo;
  if (!evaNo) {
    res.status(400).json({ error: 'Missing evaNo' });
    return;
  }

  try {
    const rows = await cached(`board:${evaNo}`, 25_000, async () => {
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
    });

    res.status(200).json(rows);
  } catch (err) {
    if (err instanceof DbApiError) {
      res.status(err.status >= 500 ? 502 : err.status).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
}
