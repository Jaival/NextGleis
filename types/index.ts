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

export type FavoriteRoute = {
  id: string; // `${fromEva}-${toEva}`
  fromEva: string;
  fromName: string;
  toEva: string;
  toName: string;
  order: number;
};

export type ThemeMode = 'system' | 'light' | 'dark';

export type AppSettings = {
  themeMode: ThemeMode;
};
