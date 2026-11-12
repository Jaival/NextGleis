/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Notice } from '../types';
import { boardWarnings } from '../lib/notices.ts';

const warn = (text: string): Notice => ({ text, severity: 'warning' });
const info = (text: string): Notice => ({ text, severity: 'info' });

describe('boardWarnings', () => {
  it('returns nothing for no rows', () => {
    assert.deepEqual(boardWarnings([]), []);
  });
  it('drops info notices', () => {
    assert.deepEqual(boardWarnings([{ notices: [info('a')] }]), []);
  });
  it('lists the same warning once', () => {
    const rows = [{ notices: [warn('a')] }, { notices: [warn('a')] }, { notices: [warn('a')] }];
    assert.deepEqual(boardWarnings(rows), [warn('a')]);
  });
  it('orders by how many rows share the warning', () => {
    const rows = [
      { notices: [warn('A'), warn('B')] },
      { notices: [warn('B')] },
      { notices: [warn('B')] },
    ];
    assert.deepEqual(boardWarnings(rows), [warn('B'), warn('A')]);
  });
  it('skips rows without notices', () => {
    assert.deepEqual(boardWarnings([{}, { notices: [warn('a')] }]), [warn('a')]);
  });
});
