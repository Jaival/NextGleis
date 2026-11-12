type CacheEntry = { expiresAt: number; value: Promise<unknown> };

// Enough for every busy stop and query on one warm instance; old entries go
// first once it's full.
export const MAX_ENTRIES = 5_000;

// Module-scope Map — persists only while a given serverless instance stays
// warm. Vercel doesn't guarantee one warm instance under concurrent traffic,
// so this is a best-effort cache, not a strict rate-limit guarantee; the CDN
// header set in the handlers shares repeats across instances. If the free
// plan's 60 req/min ceiling ever becomes tight under real traffic, swap this
// for Vercel KV (or Upstash Redis) — same call sites, different `store`.
const store = new Map<string, CacheEntry>();

// Concurrent callers for the same key share one pending promise, so a board
// that expires under load costs one upstream call, not one per request. A
// failure is removed again so the next request retries.
export function cached<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) return hit.value as Promise<T>;
  if (hit) store.delete(key);

  // `.then` turns a synchronous throw inside compute into a rejection.
  const value = Promise.resolve().then(compute);
  store.set(key, { expiresAt: now + ttlMs, value });
  value.catch(() => {
    if (store.get(key)?.value === value) store.delete(key);
  });
  evict(now);
  return value;
}

function evict(now: number): void {
  if (store.size <= MAX_ENTRIES) return;
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
  // Map iterates in insertion order, so this drops the oldest first.
  for (const key of store.keys()) {
    if (store.size <= MAX_ENTRIES) break;
    store.delete(key);
  }
}
