/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { needsLongDistanceTicket, productKind } from '../lib/product.ts';

describe('productKind', () => {
  it('maps high-speed trains', () => {
    assert.equal(productKind('ICE 4523'), 'highSpeed');
  });
  it('maps other long-distance trains', () => {
    assert.equal(productKind('IC 2021'), 'longDistance');
    assert.equal(productKind('NJ 40490'), 'longDistance');
    assert.equal(productKind('FLX 1234'), 'longDistance');
  });
  it('maps city networks', () => {
    assert.equal(productKind('S 3'), 'suburban');
    assert.equal(productKind('U 5'), 'metro');
    assert.equal(productKind('Tram 6'), 'tram');
    assert.equal(productKind('Bus 42'), 'bus');
    assert.equal(productKind('AST 5'), 'bus');
  });
  it('falls back to regional for unknown word categories', () => {
    assert.equal(productKind('RE 30'), 'regional');
    assert.equal(productKind('MEX 12'), 'regional');
  });
  it('falls back to other when there are no letters', () => {
    assert.equal(productKind('42'), 'other');
    assert.equal(productKind(''), 'other');
  });
  it('ignores case and surrounding whitespace', () => {
    assert.equal(productKind('  ice 9'), 'highSpeed');
  });
});

describe('needsLongDistanceTicket', () => {
  it('is true for long-distance categories', () => {
    for (const line of ['ICE 1', 'IC 1', 'EC 1', 'NJ 1', 'FLX 1']) {
      assert.equal(needsLongDistanceTicket(line), true, line);
    }
  });
  it('is false for regional and city lines', () => {
    for (const line of ['RE 1', 'S 1', 'Bus 1', 'Tram 1']) {
      assert.equal(needsLongDistanceTicket(line), false, line);
    }
  });
});
