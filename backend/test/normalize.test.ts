import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Alternative, Journey as HafasJourney, Trip as HafasTrip } from 'hafas-client';
import { toDepartureRow as efaDepartureRow } from '../lib/efa/normalize.js';
import type { EfaStopEvent } from '../lib/efa/types.js';
import { toArrivalRow, toDepartureRow, toJourney, toTrip } from '../lib/hafas/normalize.js';

// Fixtures carry only the fields the normalizers read.
const departure = (fields: Record<string, unknown>) => fields as unknown as Alternative;

const ICE = { productName: 'ICE', name: 'ICE 1652', product: 'nationalExpress', operator: { name: 'DB Fernverkehr AG' } };
const TRAM = { productName: 'Str', name: 'Str 11', product: 'tram' };

describe('HAFAS toDepartureRow', () => {
  it('keeps Berlin wall-clock time and turns a delay into minutes', () => {
    const row = toDepartureRow(
      departure({
        line: ICE,
        direction: 'Wiesbaden Hbf',
        plannedWhen: '2026-10-09T12:43:00+02:00',
        when: '2026-10-09T12:58:00+02:00',
        delay: 900,
        platform: '5',
        plannedPlatform: '5',
      }),
    );
    assert.deepEqual(row, {
      line: 'ICE 1652',
      direction: 'Wiesbaden Hbf',
      scheduledTime: '2026-10-09T12:43:00',
      actualTime: '2026-10-09T12:58:00',
      delayMinutes: 15,
      cancelled: false,
      kind: 'db',
      platform: '5',
      operator: 'DB Fernverkehr AG',
    });
  });

  it('shows an early departure as on time', () => {
    const row = toDepartureRow(
      departure({ line: TRAM, plannedWhen: '2026-10-09T13:00:00+02:00', when: '2026-10-09T12:59:00+02:00', delay: -60 }),
    );
    assert.equal(row?.delayMinutes, 0);
    assert.equal(row?.line, 'Tram 11');
    assert.equal(row?.kind, 'transit');
  });

  it('has no realtime fields without a delay, or when cancelled', () => {
    const noRealtime = toDepartureRow(departure({ line: TRAM, plannedWhen: '2026-10-09T13:00:00+02:00', when: '2026-10-09T13:00:00+02:00' }));
    assert.equal(noRealtime?.actualTime, undefined);
    assert.equal(noRealtime?.delayMinutes, undefined);

    const cancelled = toDepartureRow(
      departure({ line: TRAM, plannedWhen: '2026-10-09T13:00:00+02:00', cancelled: true, delay: 120, when: null }),
    );
    assert.equal(cancelled?.cancelled, true);
    assert.equal(cancelled?.actualTime, undefined);
  });

  it('flags a platform change, but not a sector letter', () => {
    const moved = toDepartureRow(departure({ line: ICE, plannedWhen: '2026-10-09T13:00:00+02:00', platform: '7', plannedPlatform: '5' }));
    assert.equal(moved?.platform, '7');
    assert.equal(moved?.plannedPlatform, '5');

    const sector = toDepartureRow(departure({ line: ICE, plannedWhen: '2026-10-09T13:00:00+02:00', platform: '13D-F', plannedPlatform: '13' }));
    assert.equal(sector?.platform, '13D-F');
    assert.equal(sector?.plannedPlatform, undefined);
  });

  it('keeps warnings and status remarks, drops hints', () => {
    const row = toDepartureRow(
      departure({
        line: TRAM,
        plannedWhen: '2026-10-09T13:00:00+02:00',
        remarks: [
          { type: 'hint', code: 'FB', text: 'Bicycles allowed' },
          { type: 'warning', summary: 'Construction', text: 'Diversion via <b>Hauptwache</b>' },
          { type: 'status', text: 'Stop cancelled' },
        ],
      }),
    );
    assert.deepEqual(
      row?.notices?.map((n) => n.severity),
      ['warning', 'info'],
    );
    assert.ok(row?.notices?.every((n) => !n.text.includes('<')));
  });

  it('skips a departure with no time at all', () => {
    assert.equal(toDepartureRow(departure({ line: TRAM })), null);
  });
});

describe('HAFAS toArrivalRow', () => {
  it('names where the service comes from', () => {
    const row = toArrivalRow(
      departure({ line: ICE, origin: { type: 'stop', name: 'Dresden Hbf' }, plannedWhen: '2026-10-09T12:40:00+02:00' }),
    );
    assert.equal(row?.origin, 'Dresden Hbf');
  });
});

describe('HAFAS toJourney', () => {
  it('counts transfers between riding legs only', () => {
    const journey = toJourney(
      {
        legs: [
          { origin: { name: 'A' }, destination: { name: 'B' }, plannedDeparture: '2026-10-09T10:00:00+02:00', plannedArrival: '2026-10-09T10:20:00+02:00', line: TRAM },
          { origin: { name: 'B' }, destination: { name: 'C' }, plannedDeparture: '2026-10-09T10:20:00+02:00', plannedArrival: '2026-10-09T10:25:00+02:00', walking: true, distance: 300 },
          { origin: { name: 'C' }, destination: { name: 'D' }, plannedDeparture: '2026-10-09T10:30:00+02:00', plannedArrival: '2026-10-09T11:10:00+02:00', departureDelay: 120, line: ICE },
        ],
      } as unknown as HafasJourney,
      0,
    );
    assert.equal(journey?.transfers, 1);
    assert.equal(journey?.durationMinutes, 70);
    assert.equal(journey?.departure, '2026-10-09T10:00:00');
    assert.equal(journey?.legs.length, 3);
    assert.equal(journey?.legs[2]?.departureDelayMinutes, 2);
  });
});

describe('HAFAS toTrip', () => {
  it('lists the stops served, with ids in the issuing network', () => {
    const trip = toTrip(
      {
        id: 'x',
        line: ICE,
        direction: 'Wiesbaden Hbf',
        stopovers: [
          { stop: { type: 'stop', id: '8010085', name: 'Dresden Hbf' }, plannedDeparture: '2026-10-09T08:11:00+02:00', departurePlatform: '12', plannedDeparturePlatform: '3' },
          { stop: { type: 'stop', id: '1', name: 'Passed through' }, passBy: true },
          { stop: { type: 'stop', id: '8000105', name: 'Frankfurt Hbf' }, plannedArrival: '2026-10-09T12:40:00+02:00', plannedDeparture: '2026-10-09T12:43:00+02:00', departureDelay: 900 },
          { stop: { type: 'stop', id: '8000250', name: 'Wiesbaden Hbf' }, plannedArrival: '2026-10-09T13:32:00+02:00', arrivalPlatform: '5', cancelled: true },
        ],
      } as unknown as HafasTrip,
      'rmv',
    );
    assert.equal(trip.line, 'ICE 1652');
    assert.equal(trip.kind, 'db');
    assert.deepEqual(
      trip.stops.map((s) => s.name),
      ['Dresden Hbf', 'Frankfurt Hbf', 'Wiesbaden Hbf'],
    );
    const [first, middle, last] = trip.stops;
    assert.equal(first?.stopId, 'rmv:8010085');
    assert.equal(first?.platform, '12');
    assert.equal(first?.plannedPlatform, '3');
    assert.equal(first?.arrival, undefined);
    assert.equal(middle?.departureDelayMinutes, 15);
    assert.equal(last?.departure, undefined);
    assert.equal(last?.cancelled, true);
  });
});

describe('EFA toDepartureRow', () => {
  const event = (fields: Partial<EfaStopEvent>): EfaStopEvent => ({
    transportation: {
      disassembledName: 'U12',
      product: { name: 'Stadtbahn' },
      destination: { name: 'Remseck' },
    },
    ...fields,
  });

  it('converts UTC to Berlin time on both sides of the DST change', () => {
    assert.equal(efaDepartureRow(event({ departureTimePlanned: '2026-10-24T10:00:00Z' }))?.scheduledTime, '2026-10-24T12:00:00');
    assert.equal(efaDepartureRow(event({ departureTimePlanned: '2026-10-26T10:00:00Z' }))?.scheduledTime, '2026-10-26T11:00:00');
  });

  it("reads Stuttgart's Stadtbahn as the U-Bahn it's signed as", () => {
    const row = efaDepartureRow(event({ departureTimePlanned: '2026-10-09T10:00:00Z' }));
    assert.equal(row?.line, 'U 12');
    assert.equal(row?.kind, 'transit');
    assert.equal(row?.direction, 'Remseck');
  });

  it('takes the delay from the estimated time', () => {
    const row = efaDepartureRow(
      event({ departureTimePlanned: '2026-10-09T10:00:00Z', departureTimeEstimated: '2026-10-09T10:04:00Z' }),
    );
    assert.equal(row?.delayMinutes, 4);
    assert.equal(row?.actualTime, '2026-10-09T12:04:00');
  });

  it('compares bare platform numbers itself', () => {
    const location = (platformName: string, plannedPlatformName: string) => ({
      id: 'x',
      name: 'x',
      type: 'platform',
      properties: { platformName, plannedPlatformName },
    });
    const same = efaDepartureRow(event({ departureTimePlanned: '2026-10-09T10:00:00Z', location: location('Gleis 3', 'Gleis 3') }));
    assert.equal(same?.platform, '3');
    assert.equal(same?.plannedPlatform, undefined);

    const moved = efaDepartureRow(event({ departureTimePlanned: '2026-10-09T10:00:00Z', location: location('Gleis 4', 'Gleis 3') }));
    assert.equal(moved?.platform, '4');
    assert.equal(moved?.plannedPlatform, '3');
  });

  it('has no realtime for a cancelled departure', () => {
    const row = efaDepartureRow(
      event({ isCancelled: true, departureTimePlanned: '2026-10-09T10:00:00Z', departureTimeEstimated: '2026-10-09T10:05:00Z' }),
    );
    assert.equal(row?.cancelled, true);
    assert.equal(row?.delayMinutes, undefined);
  });
});
