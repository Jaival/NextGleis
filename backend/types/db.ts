// Shapes mirror components/schemas in the Timetables OpenAPI spec (v1.0.274),
// as parsed from XML by lib/xml.ts (attributes become plain object keys).

export type DbEventStatus = 'p' | 'a' | 'c'; // planned / added / cancelled

export type DbEvent = {
  pt?: string; // planned time, YYMMddHHmm
  pp?: string; // planned platform
  ps?: DbEventStatus;
  ppth?: string; // planned path, stations separated by '|'
  ct?: string; // changed time, YYMMddHHmm
  cp?: string; // changed platform
  cs?: DbEventStatus;
  cpth?: string; // changed path
  l?: string; // line
};

export type DbTripLabel = {
  c?: string; // category, e.g. "ICE"
  n?: string; // trip/train number
  o?: string; // owner
  f?: string; // filter flags
  t?: string; // trip type
};

export type DbTimetableStop = {
  id: string;
  eva?: number;
  tl?: DbTripLabel;
  ar?: DbEvent;
  dp?: DbEvent;
};

export type DbTimetable = {
  eva?: number;
  station?: string;
  s?: DbTimetableStop[];
};

export type DbStationData = {
  name: string;
  eva: number;
  ds100?: string;
  p?: string; // platforms, '|'-separated
  meta?: string;
};
