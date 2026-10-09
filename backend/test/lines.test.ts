import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalCategory, classifyService, lineLabel } from '../lib/lines.js';

describe('canonicalCategory', () => {
  it('folds the spellings of one category onto one', () => {
    assert.equal(canonicalCategory('Str'), 'Tram');
    assert.equal(canonicalCategory('STRAB'), 'Tram');
    assert.equal(canonicalCategory('U-Bahn'), 'U');
    assert.equal(canonicalCategory('Fähre'), 'Ferry');
  });

  it('leaves unknown categories as they are, trimmed', () => {
    assert.equal(canonicalCategory(' RE '), 'RE');
    assert.equal(canonicalCategory(''), undefined);
    assert.equal(canonicalCategory(undefined), undefined);
  });
});

describe('lineLabel', () => {
  it('joins category and number', () => {
    assert.equal(lineLabel('S', '3'), 'S 3');
    assert.equal(lineLabel('Bus', '248'), 'Bus 248');
  });

  it("doesn't repeat a category the name already carries", () => {
    assert.equal(lineLabel('S', 'S7'), 'S 7');
    assert.equal(lineLabel('U', 'U5'), 'U 5');
    assert.equal(lineLabel('Str', 'Str 6'), 'Tram 6');
    assert.equal(lineLabel('Strab', 'Strab 5'), 'Tram 5');
  });

  it('only strips a whole-word prefix', () => {
    // "S" must not eat the start of "SEV".
    assert.equal(lineLabel('S', 'SEV'), 'S SEV');
  });

  it("lets a train's own category beat a broad network category", () => {
    assert.equal(lineLabel('DRE', 'MEX13', { rail: true }), 'MEX 13');
    assert.equal(lineLabel('DRE', 'RE1', { rail: true }), 'RE 1');
  });

  it('keeps route letters on buses and trams', () => {
    assert.equal(lineLabel('Bus', 'M36'), 'Bus M36');
    assert.equal(lineLabel('Bus', 'X3'), 'Bus X3');
  });

  it('splits a run-together label when there is no category', () => {
    assert.equal(lineLabel(undefined, 'RB58'), 'RB 58');
    assert.equal(lineLabel(undefined, '7'), '7');
  });

  it('falls back to the category alone without a name', () => {
    assert.equal(lineLabel('Bus', undefined), 'Bus');
    assert.equal(lineLabel(undefined, undefined), '');
  });
});

describe('classifyService', () => {
  it('treats buses, trams and the U-Bahn as local transit', () => {
    assert.equal(classifyService({ category: 'Bus' }), 'transit');
    assert.equal(classifyService({ category: 'Str' }), 'transit');
    assert.equal(classifyService({ category: 'U' }), 'transit');
  });

  it('falls back to the product when the category says nothing', () => {
    assert.equal(classifyService({ category: 'X', product: 'tram' }), 'transit');
    assert.equal(classifyService({ product: 'subway' }), 'transit');
  });

  it('decides DB from the operator', () => {
    assert.equal(classifyService({ category: 'RE', operator: 'DB Regio AG' }), 'db');
    assert.equal(classifyService({ category: 'S', operator: 'S-Bahn Berlin GmbH' }), 'db');
    assert.equal(classifyService({ category: 'RE', operator: 'Go-Ahead Baden-Württemberg' }), 'rail');
  });

  it('counts ICE, IC and EC as DB when the operator is missing', () => {
    assert.equal(classifyService({ category: 'ICE' }), 'db');
    assert.equal(classifyService({ category: 'EC' }), 'db');
    assert.equal(classifyService({ category: 'RE' }), 'rail');
  });
});
