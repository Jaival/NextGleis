// Minimal shapes for the EFA rapidJSON interface (outputFormat=rapidJSON) —
// only the fields this app reads, confirmed against live VVS/KVV/MVV/VGN
// responses. See THINGS_TO_KNOW.md for how this fits alongside HAFAS.

export type EfaSystemMessage = { type: string; text?: string };

export type EfaCoord = readonly [number, number]; // [latitude, longitude]

export type EfaLocationProperties = {
  stopId?: string;
  platform?: string;
  platformName?: string;
  plannedPlatformName?: string;
};

export type EfaLocation = {
  id: string;
  isGlobalId?: boolean;
  name: string;
  disassembledName?: string;
  type: string; // 'stop' | 'platform' | 'locality' | 'street' | 'poi' | ...
  coord?: EfaCoord;
  matchQuality?: number;
  properties?: EfaLocationProperties;
};

export type EfaStopFinderResponse = {
  systemMessages?: readonly EfaSystemMessage[];
  locations?: readonly EfaLocation[];
};

export type EfaTransportation = {
  disassembledName?: string;
  number?: string;
  name?: string;
  product?: { name?: string; class?: number };
  operator?: { name?: string };
  destination?: { name?: string };
};

export type EfaStopEvent = {
  isCancelled?: boolean;
  departureTimePlanned?: string;
  departureTimeEstimated?: string;
  transportation?: EfaTransportation;
  location?: EfaLocation;
};

export type EfaDepartureMonitorResponse = {
  systemMessages?: readonly EfaSystemMessage[];
  stopEvents?: readonly EfaStopEvent[];
};
