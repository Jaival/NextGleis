/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Translate } from '../lib/i18n';
import type { ThemeColors } from '../lib/theme';
import { departureStatus } from '../lib/delay.ts';

const t = ((key: string, ...params: unknown[]) =>
  [key, ...params].join(':')) as unknown as Translate;
const colors = {
  cancelled: 'C',
  cancelledSoft: 'CS',
  delay: 'D',
  delaySoft: 'DS',
  onTime: 'O',
  onTimeSoft: 'OS',
} as unknown as ThemeColors;

describe('departureStatus', () => {
  it('cancelled wins over a delay', () => {
    assert.deepEqual(departureStatus({ cancelled: true, delayMinutes: 10 }, colors, t), {
      kind: 'cancelled',
      label: 'status.cancelled',
      fg: 'C',
      bg: 'CS',
    });
  });
  it('reports a positive delay', () => {
    const s = departureStatus({ cancelled: false, delayMinutes: 5 }, colors, t);
    assert.equal(s.kind, 'delayed');
    assert.equal(s.label, 'status.delayed:5');
  });
  it('is on time at zero delay', () => {
    assert.equal(departureStatus({ cancelled: false, delayMinutes: 0 }, colors, t).kind, 'onTime');
  });
  it('is on time when delay is unknown', () => {
    assert.equal(departureStatus({ cancelled: false }, colors, t).kind, 'onTime');
  });
  it('is on time when early', () => {
    assert.equal(departureStatus({ cancelled: false, delayMinutes: -2 }, colors, t).kind, 'onTime');
  });
});
