// One direction of one line, filtered out on a board: "Tram 6 towards X".
export type HiddenDirection = { line: string; direction: string };

export type FavoriteStation = {
  evaNo: string; // stop id — see StationSearchResult.evaNo
  name: string;
  hiddenLines: string[]; // lines the user has filtered out, per-station
  // Optional: favorites saved before direction filters existed don't have it.
  hiddenDirections?: HiddenDirection[];
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
  // "<network>:<HAFAS trip id>" for GET /api/trip. Absent where no trip view
  // exists yet (EFA boards, the old DB Timetables fallback).
  tripId?: string;
};

export type ArrivalRow = {
  line: string;
  origin: string;
  scheduledTime: string; // ISO
  actualTime?: string;
  delayMinutes?: number;
  platform?: string; // realtime where known
  plannedPlatform?: string; // only set when the platform changed
  cancelled: boolean;
  kind: ServiceKind;
  operator?: string;
  notices?: Notice[];
  // "<network>:<HAFAS trip id>" for GET /api/trip. Absent where no trip view
  // exists yet (EFA boards, the old DB Timetables fallback).
  tripId?: string;
};

// One stop on a trip's run, in order. Times are scheduled wall-clock like
// everywhere else; the first stop has no arrival and the last no departure.
export type TripStop = {
  stopId?: string; // "<network>:<id>", opens that stop's board
  name: string;
  arrival?: string;
  departure?: string;
  arrivalDelayMinutes?: number;
  departureDelayMinutes?: number;
  platform?: string; // realtime where known
  plannedPlatform?: string; // only set when the platform changed
  cancelled: boolean;
};

export type Trip = {
  line: string;
  direction: string;
  kind: ServiceKind;
  operator?: string;
  cancelled: boolean;
  stops: TripStop[];
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

// What /api/journeys returns when asked for pages (`paged=1`). The refs are
// opaque: pass one back as `earlier` or `later` to get the connections
// before the first or after the last one here. Missing when the network has
// no more in that direction.
export type JourneyPage = {
  journeys: Journey[];
  earlierRef?: string;
  laterRef?: string;
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
  // Leave out trains the Deutschlandticket doesn't cover (ICE, IC/EC, …) on
  // boards and routes.
  deutschlandticket: boolean;
};
