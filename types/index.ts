export type FavoriteStation = {
  evaNo: string;
  name: string;
  hiddenLines: string[]; // lines the user has filtered out, per-station
  order: number;
};

export type DepartureRow = {
  line: string;
  direction: string;
  scheduledTime: string; // ISO
  actualTime?: string;
  delayMinutes?: number;
  platform?: string;
  cancelled: boolean;
};

export type StationSearchResult = {
  evaNo: string;
  name: string;
};
