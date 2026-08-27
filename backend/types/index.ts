// Must stay in sync with the client's types/index.ts (spec §6) — this is
// the normalized shape the app expects from /api/board/:evaNo.
export type DepartureRow = {
  line: string;
  direction: string;
  scheduledTime: string; // ISO, Europe/Berlin local wall-clock time
  actualTime?: string;
  delayMinutes?: number;
  platform?: string;
  cancelled: boolean;
};

export type StationSearchResult = {
  evaNo: string;
  name: string;
};
