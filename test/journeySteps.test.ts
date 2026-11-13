/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { JourneyLeg } from '../types';
import { journeySteps } from '../lib/journeySteps.ts';

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
