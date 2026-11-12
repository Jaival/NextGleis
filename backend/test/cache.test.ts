import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { cached, MAX_ENTRIES } from '../lib/cache.js';

describe('cached', () => {
  afterEach(() => {
    mock.timers.reset();
  });

  it('runs compute once for concurrent calls with the same key', async () => {
    let calls = 0;
    const compute = async () => {
      calls++;
      return 'v';
    };
    const [a, b] = await Promise.all([cached('t1', 1000, compute), cached('t1', 1000, compute)]);
    assert.equal(calls, 1);
    assert.equal(a, 'v');
    assert.equal(b, 'v');
  });

  it('does not call compute again within the TTL', async () => {
    let calls = 0;
    const compute = async () => ++calls;
    await cached('t2', 1000, compute);
    assert.equal(await cached('t2', 1000, compute), 1);
    assert.equal(calls, 1);
  });

  it('calls compute again after the TTL', async () => {
    mock.timers.enable({ apis: ['Date'] });
    let calls = 0;
    const compute = async () => ++calls;
    await cached('t3', 1000, compute);
    mock.timers.tick(1001);
    assert.equal(await cached('t3', 1000, compute), 2);
  });

  it('does not cache a rejection', async () => {
    await assert.rejects(
      cached('t4', 1000, async () => {
        throw new Error('boom');
      }),
      /boom/,
    );
    assert.equal(await cached('t4', 1000, async () => 'ok'), 'ok');
  });

  it('turns a synchronous throw in compute into a rejection', async () => {
    let promise: Promise<string> | undefined;
    assert.doesNotThrow(() => {
      promise = cached('t5', 1000, () => {
        throw new Error('sync');
      });
    });
    await assert.rejects(promise!, /sync/);
  });

  it('evicts the oldest entry once the cache is full', async () => {
    for (let i = 0; i <= MAX_ENTRIES; i++) {
      await cached(`evict:${i}`, 60_000, async () => i);
    }
    let ran = false;
    await cached('evict:0', 60_000, async () => {
      ran = true;
      return 0;
    });
    assert.equal(ran, true);
  });
});
