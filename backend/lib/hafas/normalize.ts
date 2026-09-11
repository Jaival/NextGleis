import type { Alternative, Journey as HafasJourney, Leg, Line, Location, Station, Stop } from 'hafas-client';
import type { DepartureRow, Journey, JourneyLeg, ServiceKind } from '../../types/index.js';
import { classifyService, lineLabel } from '../lines.js';

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
  if (line.operator) row.operator = line.operator;

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
  const arrivalPlatform = leg.arrivalPlatform ?? leg.plannedArrivalPlatform;
  if (arrivalPlatform) out.arrivalPlatform = arrivalPlatform;
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
