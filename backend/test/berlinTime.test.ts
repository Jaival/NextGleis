import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { berlinWallClock, fromBerlinWallClock } from '../lib/berlinTime.js';

describe('berlinWallClock', () => {
  it('applies summer time (UTC+2)', () => {
    assert.equal(berlinWallClock(new Date('2026-07-01T10:00:00Z')), '2026-07-01T12:00:00');
  });

  it('applies winter time (UTC+1)', () => {
    assert.equal(berlinWallClock(new Date('2026-12-01T10:00:00Z')), '2026-12-01T11:00:00');
  });

  it('crosses midnight', () => {
    assert.equal(berlinWallClock(new Date('2026-12-31T23:30:00Z')), '2027-01-01T00:30:00');
  });
});

describe('fromBerlinWallClock', () => {
  it('reads a summer and a winter time', () => {
    assert.equal(fromBerlinWallClock('2026-07-01T12:00')?.toISOString(), '2026-07-01T10:00:00.000Z');
    assert.equal(fromBerlinWallClock('2026-12-01T11:00:00')?.toISOString(), '2026-12-01T10:00:00.000Z');
  });

  it('round-trips with berlinWallClock on both sides of the autumn change', () => {
    for (const wall of ['2026-10-25T01:30:00', '2026-10-25T03:30:00', '2026-03-29T03:30:00']) {
      const instant = fromBerlinWallClock(wall);
      assert.ok(instant);
      assert.equal(berlinWallClock(instant), wall);
    }
  });

  it('moves a time inside the spring-forward gap past it', () => {
    // 02:30 doesn't exist on 29 March 2026; read as winter time it's 03:30.
    const instant = fromBerlinWallClock('2026-03-29T02:30');
    assert.equal(instant && berlinWallClock(instant), '2026-03-29T03:30:00');
  });

  it('rejects anything that isn’t a wall-clock time', () => {
    assert.equal(fromBerlinWallClock('yesterday'), null);
    assert.equal(fromBerlinWallClock('2026-07-01'), null);
    assert.equal(fromBerlinWallClock('2026-07-01T12:00:00Z'), null);
    assert.equal(fromBerlinWallClock(''), null);
  });
});
