import type { Coordinates } from './hafas/geo.js';

// Shared between hafas/search.ts and efa/search.ts, so search.ts can merge
// both sources' results with one set of rules.
export type Candidate = {
  stopId: string;
  name: string;
  sourceLabel: string;
  coordinates: Coordinates;
  rank: number;
  // 0 for a network that owns the stop's spot, otherwise its fallbackRank+1 —
  // lower sorts first.
  priority: number;
  matchesQuery: boolean;
};

// Two sources' copies of one stop sit within metres of each other, since both
// draw on the same national stop register. Stops that close together are
// only ever merged across sources, never within one.
export const SAME_STOP_METRES = 150;
