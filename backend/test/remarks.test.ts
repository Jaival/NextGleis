import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Warning } from 'hafas-client';
import { toNotices } from '../lib/hafas/remarks.js';

const warning = (text: string) => ({ type: 'warning', text }) as Warning;

describe('toNotices entity decoding', () => {
  it('decodes named entities', () => {
    assert.deepEqual(toNotices([warning('Gleis&nbsp;3 &amp; 4')]), [
      { text: 'Gleis 3 & 4', severity: 'warning' },
    ]);
  });

  it('decodes decimal and hex entities', () => {
    assert.equal(toNotices([warning('&#228;&#xFC;')])?.[0]?.text, 'äü');
  });

  it('keeps an out-of-range decimal entity as text', () => {
    assert.equal(
      toNotices([warning('Bauarbeiten &#99999999; heute')])?.[0]?.text,
      'Bauarbeiten &#99999999; heute',
    );
  });

  it('keeps an out-of-range hex entity as text', () => {
    assert.equal(toNotices([warning('&#x110000;')])?.[0]?.text, '&#x110000;');
  });
});
