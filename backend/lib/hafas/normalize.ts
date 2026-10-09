import type {
  Alternative,
  Journey as HafasJourney,
  Trip as HafasTrip,
  Leg,
  Line,
  Location,
  Station,
  Stop,
  StopOver,
} from 'hafas-client';
import type {
  ArrivalRow,
  DepartureRow,
  Journey,
  JourneyLeg,
  ServiceKind,
  Trip,
  TripStop,
} from '../../types/index.js';
import { classifyService, lineLabel } from '../lines.js';
import type { NetworkId } from './networks.js';
import { toNotices } from './remarks.js';
import { formatStopId } from './stopId.js';

// HAFAS timestamps are ISO with an offset. Every network here runs on
// Europe/Berlin, so dropping the offset leaves Berlin wall-clock time — the
// contract the app reads (and the Timetables path follows, see merge.ts).
function wallClock(iso: string): string {
  return iso.slice(0, 19);
}

// HAFAS reports delays in seconds, early departures as negative — shown as on
// time, like the Timetables path does.
function delayMinutes(seconds: number): number {
  return Math.max(0, Math.round(seconds / 60));
}

function describeLine(line: Line | undefined): { label: string; kind: ServiceKind; operator?: string } {
  const category = line?.productName ?? undefined;
  const operator = line?.operator?.name ?? undefined;
  const kind = classifyService({ category, product: line?.product ?? undefined, operator });
  return {
    label: lineLabel(category, line?.name ?? undefined, { rail: kind !== 'transit' }),
    kind,
    operator,
  };
}

// The planned platform, only when realtime moved the service somewhere else —
// so the field's presence alone tells the app to flag a change.
// Sector letters don't count: "13" and "13D-F" are the same platform, one
// reported with the section of it the train stops at.
function changedFrom(planned: string | undefined, actual: string | undefined): string | undefined {
  if (!planned || !actual) return undefined;
  const track = (platform: string) => platform.match(/^\d+/)?.[0] ?? platform.trim();
  return track(planned) !== track(actual) ? planned : undefined;
}

function placeName(place: Station | Stop | Location | undefined): string {
  return (place as { name?: string } | undefined)?.name ?? '';
}

export function toDepartureRow(departure: Alternative): DepartureRow | null {
  const planned = departure.plannedWhen ?? departure.when;
  if (!planned) return null;

  const line = describeLine(departure.line);
  const row: DepartureRow = {
    line: line.label,
    direction: departure.direction ?? '',
    scheduledTime: wallClock(planned),
    cancelled: Boolean(departure.cancelled),
    kind: line.kind,
  };

  // A cancelled departure has no `when`; a missing `delay` means the network
  // has no realtime data for it, not that it's on time.
  if (!row.cancelled && departure.when && typeof departure.delay === 'number') {
    row.actualTime = wallClock(departure.when);
    row.delayMinutes = delayMinutes(departure.delay);
  }

  const platform = departure.platform ?? departure.plannedPlatform;
  if (platform) row.platform = platform;
  const plannedPlatform = changedFrom(departure.plannedPlatform, platform);
  if (plannedPlatform) row.plannedPlatform = plannedPlatform;
  if (line.operator) row.operator = line.operator;
  const notices = toNotices(departure.remarks);
  if (notices) row.notices = notices;

  return row;
}

// Mirrors toDepartureRow, but an arrival's "where from" is a place
// (`origin`), not the string `direction` a departure carries.
export function toArrivalRow(arrival: Alternative): ArrivalRow | null {
  const planned = arrival.plannedWhen ?? arrival.when;
  if (!planned) return null;

  const line = describeLine(arrival.line);
  const row: ArrivalRow = {
    line: line.label,
    origin: placeName(arrival.origin) || (arrival.direction ?? ''),
    scheduledTime: wallClock(planned),
    cancelled: Boolean(arrival.cancelled),
    kind: line.kind,
  };

  if (!row.cancelled && arrival.when && typeof arrival.delay === 'number') {
    row.actualTime = wallClock(arrival.when);
    row.delayMinutes = delayMinutes(arrival.delay);
  }

  const platform = arrival.platform ?? arrival.plannedPlatform;
  if (platform) row.platform = platform;
  const plannedPlatform = changedFrom(arrival.plannedPlatform, platform);
  if (plannedPlatform) row.plannedPlatform = plannedPlatform;
  if (line.operator) row.operator = line.operator;
  const notices = toNotices(arrival.remarks);
  if (notices) row.notices = notices;

  return row;
}

function toLeg(leg: Leg): JourneyLeg | null {
  const departure = leg.plannedDeparture ?? leg.departure;
  const arrival = leg.plannedArrival ?? leg.arrival;
  if (!departure || !arrival) return null;

  const base = {
    origin: placeName(leg.origin),
    destination: placeName(leg.destination),
    departure: wallClock(departure),
    arrival: wallClock(arrival),
  };
  if (leg.walking) {
    return { ...base, walking: true, cancelled: false, distance: leg.distance ?? undefined };
  }

  const line = describeLine(leg.line);
  const out: JourneyLeg = {
    ...base,
    walking: false,
    line: line.label,
    kind: line.kind,
    direction: leg.direction ?? undefined,
    cancelled: Boolean(leg.cancelled),
  };
  if (typeof leg.departureDelay === 'number') out.departureDelayMinutes = delayMinutes(leg.departureDelay);
  if (typeof leg.arrivalDelay === 'number') out.arrivalDelayMinutes = delayMinutes(leg.arrivalDelay);
  const departurePlatform = leg.departurePlatform ?? leg.plannedDeparturePlatform;
  if (departurePlatform) out.departurePlatform = departurePlatform;
  const plannedDeparturePlatform = changedFrom(leg.plannedDeparturePlatform, departurePlatform);
  if (plannedDeparturePlatform) out.plannedDeparturePlatform = plannedDeparturePlatform;
  const arrivalPlatform = leg.arrivalPlatform ?? leg.plannedArrivalPlatform;
  if (arrivalPlatform) out.arrivalPlatform = arrivalPlatform;
  const plannedArrivalPlatform = changedFrom(leg.plannedArrivalPlatform, arrivalPlatform);
  if (plannedArrivalPlatform) out.plannedArrivalPlatform = plannedArrivalPlatform;
  const notices = toNotices(leg.remarks);
  if (notices) out.notices = notices;
  return out;
}

function toTripStop(stopover: StopOver, network: NetworkId): TripStop | null {
  const place = stopover.stop as { id?: string; name?: string } | undefined;
  if (!place?.name) return null;

  const stop: TripStop = { name: place.name, cancelled: Boolean(stopover.cancelled) };
  if (place.id) stop.stopId = formatStopId({ network, id: place.id });
  const arrival = stopover.plannedArrival ?? stopover.arrival;
  if (arrival) stop.arrival = wallClock(arrival);
  const departure = stopover.plannedDeparture ?? stopover.departure;
  if (departure) stop.departure = wallClock(departure);
  if (typeof stopover.arrivalDelay === 'number') stop.arrivalDelayMinutes = delayMinutes(stopover.arrivalDelay);
  if (typeof stopover.departureDelay === 'number') {
    stop.departureDelayMinutes = delayMinutes(stopover.departureDelay);
  }

  // One platform per stop: where the train leaves from, or for the last stop
  // where it arrives.
  const actual = stopover.departurePlatform ?? stopover.arrivalPlatform;
  const planned = stopover.plannedDeparturePlatform ?? stopover.plannedArrivalPlatform;
  const platform = actual ?? planned;
  if (platform) stop.platform = platform;
  const plannedPlatform = changedFrom(planned, platform);
  if (plannedPlatform) stop.plannedPlatform = plannedPlatform;
  return stop;
}

export function toTrip(trip: HafasTrip, network: NetworkId): Trip {
  const line = describeLine(trip.line);
  const out: Trip = {
    line: line.label,
    direction: trip.direction ?? placeName(trip.destination),
    kind: line.kind,
    cancelled: Boolean(trip.cancelled),
    // Stops the train runs through without stopping aren't the rider's
    // business.
    stops: (trip.stopovers ?? []).flatMap((s) => (s.passBy ? [] : (toTripStop(s, network) ?? []))),
  };
  if (line.operator) out.operator = line.operator;
  const notices = toNotices(trip.remarks);
  if (notices) out.notices = notices;
  return out;
}

export function toJourney(journey: HafasJourney, index: number): Journey | null {
  const first = journey.legs[0];
  const last = journey.legs[journey.legs.length - 1];
  const plannedDeparture = first?.plannedDeparture ?? first?.departure;
  const plannedArrival = last?.plannedArrival ?? last?.arrival;
  if (!first || !last || !plannedDeparture || !plannedArrival) return null;

  const legs = journey.legs.flatMap((leg) => toLeg(leg) ?? []);
  const riding = legs.filter((leg) => !leg.walking);
  // Realtime where the network has it, so the duration matches what the
  // rider will actually sit through.
  const actualDeparture = first.departure ?? plannedDeparture;
  const actualArrival = last.arrival ?? plannedArrival;

  return {
    id: journey.refreshToken ?? `${plannedDeparture}-${index}`,
    departure: wallClock(plannedDeparture),
    arrival: wallClock(plannedArrival),
    departureDelayMinutes:
      typeof first.departureDelay === 'number' ? delayMinutes(first.departureDelay) : undefined,
    arrivalDelayMinutes: typeof last.arrivalDelay === 'number' ? delayMinutes(last.arrivalDelay) : undefined,
    durationMinutes: Math.round((Date.parse(actualArrival) - Date.parse(actualDeparture)) / 60_000),
    transfers: Math.max(0, riding.length - 1),
    cancelled: riding.some((leg) => leg.cancelled),
    legs,
  };
}
