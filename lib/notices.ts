import type { DepartureRow, Notice } from '@/types';

// The disruption warnings across a board's rows, each once, most widespread
// first: a warning on half the board matters to more riders than one on a
// single departure.
export function boardWarnings(rows: readonly DepartureRow[]): Notice[] {
  const counts = new Map<string, { notice: Notice; count: number }>();
  for (const row of rows) {
    for (const notice of row.notices ?? []) {
      if (notice.severity !== 'warning') continue;
      const entry = counts.get(notice.text);
      if (entry) entry.count += 1;
      else counts.set(notice.text, { notice, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).map((entry) => entry.notice);
}
