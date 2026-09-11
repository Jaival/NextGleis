// Must stay in sync with the client's types/index.ts (spec §6) — this is
// the normalized shape the app expects from the API.

// Drives the small pill on each departure and journey leg: a Deutsche Bahn
// train, another operator's train, or local public transport (bus, tram,
// U-Bahn, ferry).
export type ServiceKind = 'db' | 'rail' | 'transit';

export type DepartureRow = {
  line: string;
  direction: string;
  scheduledTime: string; // ISO, Europe/Berlin local wall-clock time
  actualTime?: string;
  delayMinutes?: number;
  platform?: string;
  cancelled: boolean;
  kind: ServiceKind;
  operator?: string;
};

export type StationSearchResult = {
  // Stop id — "<network>:<id>", see lib/hafas/stopId.ts. Still named for the
  // EVA numbers it held under the DB Timetables API, since the app persists it.
  evaNo: string;
  name: string;
  network?: string; // label of the network the stop came from, e.g. "RMV"
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
  arrivalPlatform?: string;
  line?: string;
  kind?: ServiceKind;
  direction?: string;
  distance?: number; // metres, walking legs only
  cancelled: boolean;
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
