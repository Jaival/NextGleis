export type FavoriteStation = {
  evaNo: string; // stop id — see StationSearchResult.evaNo
  name: string;
  hiddenLines: string[]; // lines the user has filtered out, per-station
  order: number;
};

// Drives the small pill on each departure and journey leg: a Deutsche Bahn
// train, another operator's train, or local public transport (bus, tram,
// U-Bahn, ferry).
export type ServiceKind = 'db' | 'rail' | 'transit';

// A disruption or service change reported by the network: construction work,
// a cancelled stop, replacement buses. `warning` is a disruption notice;
// `info` is a change to this one service.
export type Notice = {
  title?: string;
  text: string;
  severity: 'warning' | 'info';
};

export type DepartureRow = {
  line: string;
  direction: string;
  scheduledTime: string; // ISO
  actualTime?: string;
  delayMinutes?: number;
  platform?: string; // realtime where known
  plannedPlatform?: string; // only set when the platform changed
  cancelled: boolean;
  kind: ServiceKind;
  operator?: string;
  notices?: Notice[];
};

export type StationSearchResult = {
  // Stop id, "<network>:<id>" (e.g. "rmv:3000010"). Named for the EVA numbers
  // it held under the DB Timetables API; favorites saved back then still hold
  // a bare EVA number, which the backend resolves.
  evaNo: string;
  name: string;
  network?: string; // the transport network the stop came from, e.g. "RMV"
};

export type NearbyStop = StationSearchResult & {
  distance: number; // metres from the user's position
};

export type JourneyLeg = {
  walking: boolean;
  origin: string;
  destination: string;
  departure: string; // scheduled, ISO
  arrival: string;
  departureDelayMinutes?: number;
  arrivalDelayMinutes?: number;
  departurePlatform?: string;
  plannedDeparturePlatform?: string; // only set when the platform changed
  arrivalPlatform?: string;
  plannedArrivalPlatform?: string;
  line?: string;
  kind?: ServiceKind;
  direction?: string;
  distance?: number; // metres, walking legs only
  cancelled: boolean;
  notices?: Notice[];
};

export type Journey = {
  id: string;
  departure: string; // scheduled, ISO
  arrival: string;
  departureDelayMinutes?: number;
  arrivalDelayMinutes?: number;
  durationMinutes: number;
  transfers: number;
  cancelled: boolean;
  legs: JourneyLeg[];
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

export type Language = 'en' | 'de';
export type LanguageSetting = 'system' | Language;

export type AppSettings = {
  themeMode: ThemeMode;
  language: LanguageSetting;
  // Set once the first-run screen has been seen (or skipped).
  onboarded: boolean;
};
