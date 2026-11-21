/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Translate } from '../lib/i18n';
import {
  addMinutes,
  berlinNow,
  formatClock,
  formatDuration,
  formatTime,
  minutesBetween,
  minutesUntil,
} from '../lib/time.ts';

const t = ((key: string, ...params: unknown[]) =>
  [key, ...params].join(':')) as unknown as Translate;

describe('formatTime', () => {
  it('slices HH:mm from a wall-clock string', () => {
    assert.equal(formatTime('2026-07-01T12:34:00'), '12:34');
  });
});

describe('minutesBetween', () => {
  it('counts minutes within a day', () => {
    assert.equal(minutesBetween('2026-07-01T12:00:00', '2026-07-01T13:15:00'), 75);
  });
  it('counts minutes across midnight', () => {
    assert.equal(minutesBetween('2026-07-01T23:50:00', '2026-07-02T00:10:00'), 20);
  });
});

describe('addMinutes', () => {
  it('rolls over midnight', () => {
    assert.equal(addMinutes('2026-07-01T23:50:00', 20), '2026-07-02T00:10:00');
  });
  it('uses wall-clock arithmetic and ignores the DST change by design', () => {
    assert.equal(addMinutes('2026-10-25T01:50', 30), '2026-10-25T02:20:00');
  });
});

describe('formatClock', () => {
  it('shows Berlin summer time', () => {
    assert.equal(formatClock(new Date('2026-07-01T10:00:00Z'), 'de'), '12:00');
  });
  it('shows Berlin winter time', () => {
    assert.equal(formatClock(new Date('2026-12-01T10:00:00Z'), 'en'), '11:00');
  });
});

describe('berlinNow', () => {
  it('returns a wall-clock string', () => {
    assert.match(berlinNow(), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });
});

describe('formatDuration', () => {
  it('splits hours and minutes', () => {
    assert.equal(formatDuration(75, t), 'common.duration:1:15');
    assert.equal(formatDuration(5, t), 'common.duration:0:5');
  });
});

describe('minutesUntil', () => {
  it('counts whole minutes on time', () => {
    assert.equal(minutesUntil('2026-11-12T10:06:00', undefined, '2026-11-12T10:00:00'), 6);
  });

  it('adds the delay', () => {
    assert.equal(minutesUntil('2026-11-12T10:06:00', 4, '2026-11-12T10:00:00'), 10);
  });

  it('rounds down, so "5 min" means at least five full minutes', () => {
    assert.equal(minutesUntil('2026-11-12T10:06:00', 0, '2026-11-12T10:00:30'), 5);
    assert.equal(minutesUntil('2026-11-12T10:06:00', 0, '2026-11-12T10:05:59'), 0);
  });

  it('is negative once it has passed', () => {
    assert.equal(minutesUntil('2026-11-12T10:00:00', 0, '2026-11-12T10:03:00'), -3);
    assert.equal(minutesUntil('2026-11-12T10:00:00', 0, '2026-11-12T10:00:10'), -1);
  });

  it('works across midnight', () => {
    assert.equal(minutesUntil('2026-11-13T00:05:00', 2, '2026-11-12T23:58:00'), 9);
  });
});
