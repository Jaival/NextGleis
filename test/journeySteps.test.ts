/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Journey, JourneyLeg } from '../types';
import {
  currentRideIndex,
  journeySteps,
  lineBarSegments,
  nextJourney,
} from '../lib/journeySteps.ts';

function ride(
  origin: string,
  destination: string,
  departure: string,
  arrival: string,
  extra: Partial<JourneyLeg> = {},
): JourneyLeg {
  return {
    walking: false,
    cancelled: false,
    origin,
    destination,
    departure: `2026-11-12T${departure}:00`,
    arrival: `2026-11-12T${arrival}:00`,
    ...extra,
  };
}

function walk(origin: string, destination: string, departure: string, arrival: string): JourneyLeg {
  return { ...ride(origin, destination, departure, arrival), walking: true };
}

describe('journeySteps', () => {
  it('puts a change with both platforms between two rides', () => {
    const steps = journeySteps([
      ride('A', 'B', '10:00', '10:20', { arrivalPlatform: '2' }),
      ride('B', 'C', '10:28', '11:00', { departurePlatform: '5' }),
    ]);
    assert.deepEqual(
      steps.map((step) => step.type),
      ['ride', 'transfer', 'ride'],
    );
    assert.deepEqual(steps[1], {
      type: 'transfer',
      transfer: {
        station: 'B',
        minutes: 8,
        walkMinutes: 0,
        status: 'ok',
        fromPlatform: '2',
        toPlatform: '5',
      },
    });
  });

  it('folds a walk between rides into the change', () => {
    const steps = journeySteps([
      ride('A', 'B', '10:00', '10:20'),
      walk('B', 'B (Bus)', '10:20', '10:24'),
      ride('B (Bus)', 'C', '10:30', '11:00'),
    ]);
    assert.equal(steps.length, 3);
    const change = steps[1];
    assert.equal(change?.type, 'transfer');
    if (change?.type !== 'transfer') return;
    assert.equal(change.transfer.station, 'B (Bus)');
    assert.equal(change.transfer.minutes, 10);
    assert.equal(change.transfer.walkMinutes, 4);
    assert.equal(change.transfer.walkTo, 'B (Bus)');
  });

  it('measures the change with realtime delays', () => {
    const late = journeySteps([
      ride('A', 'B', '10:00', '10:20', { arrivalDelayMinutes: 6 }),
      ride('B', 'C', '10:28', '11:00'),
    ])[1];
    assert.equal(late?.type === 'transfer' && late.transfer.minutes, 2);
    assert.equal(late?.type === 'transfer' && late.transfer.status, 'tight');

    const missed = journeySteps([
      ride('A', 'B', '10:00', '10:20', { arrivalDelayMinutes: 12 }),
      ride('B', 'C', '10:28', '11:00', { departureDelayMinutes: 1 }),
    ])[1];
    assert.equal(missed?.type === 'transfer' && missed.transfer.minutes, -3);
    assert.equal(missed?.type === 'transfer' && missed.transfer.status, 'missed');
  });

  it('keeps walks at the ends and drops zero-minute ones', () => {
    const steps = journeySteps([
      walk('Home', 'A', '09:50', '10:00'),
      ride('A', 'B', '10:00', '10:20'),
      walk('B', 'B', '10:20', '10:20'),
    ]);
    assert.deepEqual(
      steps.map((step) => step.type),
      ['walk', 'ride'],
    );
    assert.equal(steps[0]?.type === 'walk' && steps[0].minutes, 10);
  });
});

describe('currentRideIndex', () => {
  const steps = journeySteps([
    ride('A', 'B', '10:00', '10:20', { line: 'RB 82' }),
    ride('B', 'C', '10:28', '11:00', { line: 'S 3' }),
  ]);
  const at = (time: string) => `2026-11-12T${time}:00`;

  it('is the first ride before departure', () => {
    assert.equal(currentRideIndex(steps, at('09:30')), 0);
  });

  it('is the next ride between rides', () => {
    assert.equal(currentRideIndex(steps, at('10:25')), 2);
  });

  it('is -1 after the last arrival', () => {
    assert.equal(currentRideIndex(steps, at('11:00')), -1);
    assert.equal(currentRideIndex(steps, at('12:00')), -1);
  });

  it('keeps a ride current while its delayed arrival is ahead', () => {
    const delayed = journeySteps([
      ride('A', 'B', '10:00', '10:20', { arrivalDelayMinutes: 10 }),
      ride('B', 'C', '10:40', '11:00'),
    ]);
    assert.equal(currentRideIndex(delayed, at('10:25')), 0);
    assert.equal(currentRideIndex(delayed, at('10:31')), 2);
  });
});

describe('lineBarSegments', () => {
  it('has one entry per ride and skips walks', () => {
    const segments = lineBarSegments([
      walk('Home', 'A', '09:50', '10:00'),
      ride('A', 'B', '10:00', '10:20', { line: 'RB 82' }),
      ride('B', 'C', '10:28', '10:28'),
      walk('C', 'Work', '10:29', '10:40'),
    ]);
    // A zero-minute ride still gets a minute; a missing line is ''.
    assert.deepEqual(segments, [
      { line: 'RB 82', minutes: 20 },
      { line: '', minutes: 1 },
    ]);
  });
});

describe('nextJourney', () => {
  const at = (time: string) => `2026-11-12T${time}`;
  function journey(id: string, legs: JourneyLeg[], extra: Partial<Journey> = {}): Journey {
    const [first] = legs;
    const last = legs.at(-1);
    return {
      id,
      departure: first?.departure ?? '',
      arrival: last?.arrival ?? '',
      durationMinutes: 0,
      transfers: 0,
      cancelled: false,
      legs,
      ...extra,
    };
  }
  const at1000 = journey('a', [ride('A', 'B', '10:00', '10:20')]);
  const at1030 = journey('b', [ride('A', 'B', '10:30', '10:50')]);

  it('takes the first connection that has not left', () => {
    assert.equal(nextJourney([at1000, at1030], at('09:50:00'))?.id, 'a');
    assert.equal(nextJourney([at1000, at1030], at('10:01:00'))?.id, 'b');
  });

  it('matches the countdown: shown while it says "now", gone after', () => {
    assert.equal(nextJourney([at1000, at1030], at('09:59:30'))?.id, 'a');
    assert.equal(nextJourney([at1000, at1030], at('10:00:00'))?.id, 'a');
    assert.equal(nextJourney([at1000, at1030], at('10:00:30'))?.id, 'b');
  });

  it('counts the delay', () => {
    const late = journey('late', [ride('A', 'B', '10:00', '10:20', { departureDelayMinutes: 5 })], {
      departureDelayMinutes: 5,
    });
    assert.equal(nextJourney([late, at1030], at('10:03:00'))?.id, 'late');
    assert.equal(nextJourney([late, at1030], at('10:05:00'))?.id, 'late');
    assert.equal(nextJourney([late, at1030], at('10:05:30'))?.id, 'b');
  });

  it('skips a cancelled connection and one whose first ride is cancelled', () => {
    const cancelled = journey('c', [ride('A', 'B', '10:00', '10:20')], { cancelled: true });
    const firstRideCancelled = journey('d', [
      ride('A', 'B', '10:10', '10:20', { cancelled: true }),
    ]);
    assert.equal(nextJourney([cancelled, firstRideCancelled, at1030], at('09:50:00'))?.id, 'b');
  });

  it('skips a connection without a ride', () => {
    const onFoot = journey('w', [walk('A', 'B', '10:00', '10:10')]);
    assert.equal(nextJourney([onFoot, at1030], at('09:50:00'))?.id, 'b');
  });

  it('is undefined when nothing is left', () => {
    assert.equal(nextJourney([at1000], at('10:05:00')), undefined);
    assert.equal(nextJourney([], at('10:05:00')), undefined);
  });
});
