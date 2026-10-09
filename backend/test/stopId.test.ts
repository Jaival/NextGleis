import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatEfaStopId } from '../lib/efa/stopId.js';
import { parsePageRef } from '../lib/hafas/journeys.js';
import { formatStopId, parseStopId as parseHafasStopId } from '../lib/hafas/stopId.js';
import { formatTripId, parseTripId } from '../lib/hafas/trip.js';
import { parseStopId } from '../lib/stopId.js';

describe('parseStopId', () => {
  it('reads a HAFAS stop id', () => {
    assert.deepEqual(parseStopId('rmv:3000010'), {
      kind: 'hafas',
      ref: { network: 'rmv', id: '3000010' },
    });
  });

  it('reads a bare EVA number from an old favorite', () => {
    assert.deepEqual(parseStopId('8000105'), { kind: 'eva', eva: '8000105' });
  });

  it('keeps the colons inside an EFA global id', () => {
    assert.deepEqual(parseStopId('vvs:de:08111:6118'), {
      kind: 'efa',
      ref: { network: 'vvs', id: 'de:08111:6118' },
    });
  });

  it('rejects unknown networks, empty ids and short numbers', () => {
    assert.equal(parseStopId('xyz:123'), null);
    assert.equal(parseStopId('rmv:'), null);
    assert.equal(parseStopId('12345'), null);
    assert.equal(parseStopId(''), null);
  });

  it("doesn't read an EFA network as HAFAS or the other way round", () => {
    assert.equal(parseHafasStopId('vvs:de:08111:6118'), null);
    assert.equal(parseStopId('mvv:de:09162:6')?.kind, 'efa');
  });
});

describe('formatting round-trips', () => {
  it('HAFAS stop ids', () => {
    const id = formatStopId({ network: 'vbb', id: '900100003' });
    assert.equal(id, 'vbb:900100003');
    assert.deepEqual(parseStopId(id), { kind: 'hafas', ref: { network: 'vbb', id: '900100003' } });
  });

  it('EFA stop ids', () => {
    const id = formatEfaStopId({ network: 'kvv', id: 'de:08212:89' });
    assert.deepEqual(parseStopId(id), { kind: 'efa', ref: { network: 'kvv', id: 'de:08212:89' } });
  });

  it('trip ids, which contain colons, pipes and hashes of their own', () => {
    const raw = '2|#VN#1#ST#1791481399#PI#0#ZI#189527#TA#0#DA#91026#1S#8010085#';
    assert.deepEqual(parseTripId(formatTripId('rmv', raw)), { network: 'rmv', id: raw });
    assert.deepEqual(parseTripId('rmv:a:b'), { network: 'rmv', id: 'a:b' });
  });
});

describe('parseTripId and parsePageRef', () => {
  it('reject a missing or unknown network', () => {
    for (const parse of [parseTripId, parsePageRef]) {
      assert.equal(parse('no-separator'), null);
      assert.equal(parse('vvs:1|2'), null); // EFA has no trips or journeys here
      assert.equal(parse('rmv:'), null);
    }
  });

  it('keep everything after the first colon', () => {
    assert.deepEqual(parsePageRef('rmv:3|OF|MT#14#1'), { network: 'rmv', ref: '3|OF|MT#14#1' });
  });
});
