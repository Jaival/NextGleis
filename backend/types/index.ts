// Must stay in sync with the client's types/index.ts (spec §6) — this is
// the normalized shape the app expects from the API.

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
  scheduledTime: string; // ISO, Europe/Berlin local wall-clock time
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
  // Stop id — "<network>:<id>", see lib/hafas/stopId.ts. Still named for the
  // EVA numbers it held under the DB Timetables API, since the app persists it.
  evaNo: string;
  name: string;
  network?: string; // label of the network the stop came from, e.g. "RMV"
};

export type NearbyStop = StationSearchResult & {
  distance: number; // metres from the requested position
};

export type JourneyLeg = {
  walking: boolean;
  origin: string;
  destination: string;
  departure: string; // scheduled, Europe/Berlin wall-clock
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
  departure: string; // scheduled, Europe/Berlin wall-clock
  arrival: string;
  departureDelayMinutes?: number;
  arrivalDelayMinutes?: number;
  durationMinutes: number;
  transfers: number;
  cancelled: boolean;
  legs: JourneyLeg[];
};
