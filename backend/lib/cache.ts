type CacheEntry<T> = { expiresAt: number; value: T };

// Module-scope Map — persists only while a given serverless instance stays
// warm. Vercel doesn't guarantee one warm instance under concurrent traffic,
// so this is a best-effort cache, not a strict rate-limit guarantee. If the
// free plan's 60 req/min ceiling ever becomes tight under real traffic,
// swap this for Vercel KV (or Upstash Redis) for a cache shared across
// instances — same call sites, different `store`.
const store = new Map<string, CacheEntry<unknown>>();

export async function cached<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  const now = Date.now();
  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }

  const value = await compute();
  store.set(key, { expiresAt: now + ttlMs, value });
  return value;
}
