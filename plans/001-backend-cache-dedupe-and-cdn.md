# Plan 001: Backend cache dedupes in-flight work, stays bounded, and lets Vercel's CDN serve repeats

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e96b32d..HEAD -- backend/lib/cache.ts backend/lib/http.ts backend/api backend/test`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S–M
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `e96b32d`, 2026-11-10

## Why this matters

The backend (Vercel serverless functions in `backend/api/`) proxies public
German transport-network planners (HAFAS, EFA) that the project uses without
formal permission; one of them (DB) already blocked comparable traffic in 2026.
Keeping upstream request volume low is therefore existential. Today:

1. Successful responses carry **no `Cache-Control`-style header**, so Vercel's
   CDN caches nothing — every app request invokes a function, and each cold or
   parallel instance has its own empty in-memory cache.
2. The in-memory `cached()` helper has **no in-flight dedupe**: N concurrent
   requests for the same board at cache expiry trigger N upstream calls.
3. The cache **never evicts** expired entries and `/api/stations` keys on raw,
   unbounded user input, so memory grows for the life of a warm instance (and
   forever on the local dev server).

After this plan: the CDN absorbs repeats across all users and instances,
concurrent misses share one upstream call, failures are not cached, and the
store is capped.

## Current state

- `backend/lib/cache.ts` — the whole cache (21 lines):

```ts
type CacheEntry<T> = { expiresAt: number; value: T };

// Module-scope Map — persists only while a given serverless instance stays
// warm. ...
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
```

- Call sites of `cached(` (signature must not change):
  - `backend/api/stations.ts:19` — key `stations:${query.toLowerCase()}`, TTL `SEARCH_TTL_MS` (5 min)
  - `backend/api/nearby.ts:31` — TTL `NEARBY_TTL_MS` (60 min)
  - `backend/api/board/[evaNo].ts:50` — TTL 25 000
  - `backend/api/arrivals/[evaNo].ts:33` — TTL 25 000
  - `backend/api/trip.ts:19` — TTL 25 000
  - `backend/api/journeys.ts:73` — TTL 60 000
  - `backend/lib/hafas/resolve.ts:21,36,72` — 1-day lookups
- Every handler starts with `res.setHeader('Access-Control-Allow-Origin', '*');`
  and ends with `res.status(200).json(...)` inside `try`, `sendError(res, err)`
  in `catch`. Example, `backend/api/stations.ts`:

```ts
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const query = queryParam(req, 'query');
  if (!query) {
    res.status(400).json({ error: 'Missing required "query" parameter' });
    return;
  }

  try {
    const results = await cached(`stations:${query.toLowerCase()}`, SEARCH_TTL_MS, () =>
      searchStops(query),
    );
    res.status(200).json(results);
  } catch (err) {
    sendError(res, err);
  }
}
```

- `backend/lib/http.ts` — shared helpers: `ApiRequest`, `ApiResponse`
  (extends Node `ServerResponse`, so `setHeader` exists), `queryParam`,
  `sendError`. New response helpers belong here.
- Tests: Node's built-in runner, TypeScript run directly. Pattern to copy:
  `backend/test/berlinTime.test.ts`:

```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { berlinWallClock, fromBerlinWallClock } from '../lib/berlinTime.js';

describe('berlinWallClock', () => {
  it('applies summer time (UTC+2)', () => {
    assert.equal(berlinWallClock(new Date('2026-07-01T10:00:00Z')), '2026-07-01T12:00:00');
  });
});
```

  Imports use `.js` extensions (resolved to `.ts` by `backend/ts-resolve.mjs`).
- Conventions: 2-space indent, single quotes, comments explain *why* in full
  sentences (see existing comments). No new dependencies in `backend/` — the
  repo deliberately keeps it at two runtime deps.

Decided, do not change: the TTL values (search 5 min, boards/trip 25 s,
routes 60 s, nearby 1 h, lookups 1 day) are documented in `THINGS_TO_KNOW.md`.

## Commands you will need

Run from `backend/` (Node 22.18+ required).

| Purpose   | Command                         | Expected on success |
|-----------|---------------------------------|---------------------|
| Install   | `npm ci`                        | exit 0 |
| Typecheck | `npm run typecheck`             | exit 0, no output |
| Tests     | `npm test`                      | `ℹ fail 0` |
| One file  | `node --import ./ts-resolve.mjs --test test/cache.test.ts` | `ℹ fail 0` |
| Audit     | `npm audit --omit=dev --audit-level=high` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `backend/lib/cache.ts`
- `backend/lib/http.ts`
- `backend/api/stations.ts`, `backend/api/nearby.ts`, `backend/api/trip.ts`,
  `backend/api/journeys.ts`, `backend/api/board/[evaNo].ts`,
  `backend/api/arrivals/[evaNo].ts`
- `backend/test/cache.test.ts` (create)
- `THINGS_TO_KNOW.md` (one bullet, step 5)

**Out of scope**:
- TTL values — documented decisions.
- Adding Vercel KV / Redis — the CDN header gives cross-instance sharing for free.
- `backend/lib/hafas/resolve.ts` — it benefits automatically; do not edit it.
- Any app (`app/`, `lib/`) file.
- `vercel.json` — headers are set per response, not in config.

## Git workflow

- Branch: `advisor/001-backend-cache`
- Commit messages: plain imperative sentence, no prefix, matching `git log`
  (e.g. "Stop releases that would ship without a backend URL"). End each
  message with a blank line and `Assisted-by: Claude`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Rewrite `cached()` to share in-flight promises, drop failures, and cap size

Replace the body of `backend/lib/cache.ts` with this shape (keep and update the
existing explanatory comment):

```ts
type CacheEntry = { expiresAt: number; value: Promise<unknown> };

// Enough for every busy stop and query on one warm instance; old entries go
// first once it's full.
export const MAX_ENTRIES = 5_000;

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
```

Notes: `cached` is no longer `async` (it returns the stored promise itself, so
concurrent callers get the *same* promise). The signature stays compatible.

**Verify**: `npm run typecheck` → exit 0. `npm test` → `ℹ fail 0`.

### Step 2: Add `backend/test/cache.test.ts`

Cover, each as its own `it`, using unique keys per test (the store is module
state shared across tests in the file):

1. Concurrent calls with the same key run `compute` once and resolve to the same value
   (call `cached` twice without awaiting, count invocations).
2. A hit within the TTL does not call `compute` again.
3. After the TTL passes, `compute` runs again — use `mock.timers` from
   `node:test`: `mock.timers.enable({ apis: ['Date'] })`, then
   `mock.timers.tick(ttl + 1)`; call `mock.timers.reset()` in `afterEach`.
4. A rejected `compute` is not cached: first call rejects
   (`await assert.rejects(...)`), second call with a succeeding compute resolves.
5. A synchronous throw inside `compute` becomes a rejection, not a thrown error.
6. Eviction: insert `MAX_ENTRIES + 1` distinct keys (resolved values), then
   call `cached` for the first key with a counting compute and assert it ran
   (the oldest was evicted).

**Verify**: `node --import ./ts-resolve.mjs --test test/cache.test.ts` → `ℹ pass 6`, `ℹ fail 0`.

### Step 3: Cap search query length

In `backend/api/stations.ts`, after the `if (!query)` check, reject queries
longer than 100 characters with `res.status(400).json({ error: '"query" is too long' })`.
Define `const MAX_QUERY_LENGTH = 100;` next to `SEARCH_TTL_MS` with a one-line
comment (no stop name is that long; it bounds cache keys and upstream fan-out
to 18 networks).

**Verify**: `npm run typecheck` → exit 0.

### Step 4: Send a CDN cache header on successful responses

1. In `backend/lib/http.ts` add:

```ts
// Lets Vercel's CDN answer repeats of this exact URL for `seconds`, across
// every instance and user, before a function runs at all. Only the CDN reads
// this header; the app and other proxies don't cache. Set it on success only,
// so an upstream error is never pinned.
export function cacheOnCdn(res: ApiResponse, seconds: number): void {
  res.setHeader('Vercel-CDN-Cache-Control', `max-age=${seconds}`);
}
```

2. In each handler, call `cacheOnCdn(res, <seconds>)` immediately before the
   `res.status(200).json(...)` line (inside `try`, after the `await cached(...)`
   resolved). Seconds = the same TTL the handler already uses for `cached`,
   converted to seconds — reuse the existing constant where one exists
   (e.g. `cacheOnCdn(res, SEARCH_TTL_MS / 1000)`):
   - `stations.ts`: `SEARCH_TTL_MS / 1000` (300)
   - `nearby.ts`: `NEARBY_TTL_MS / 1000` (3600)
   - `board/[evaNo].ts`, `arrivals/[evaNo].ts`, `trip.ts`: `25`
   - `journeys.ts`: `60`
3. Do not add the header on 4xx/5xx paths.

**Verify**:
- `npm run typecheck` → exit 0
- `grep -c "cacheOnCdn(res" api/stations.ts api/nearby.ts api/trip.ts api/journeys.ts "api/board/[evaNo].ts" "api/arrivals/[evaNo].ts"` → each file `1`
- Local smoke: `npm start` (background), then
  `curl -s -D - "http://localhost:3000/api/stations?query=Alexanderplatz" -o /dev/null | grep -i vercel-cdn-cache-control`
  → `Vercel-CDN-Cache-Control: max-age=300`. Stop the server afterwards.
  (If the network is unreachable from your sandbox, the request may 502; then
  only check that a 502 response does NOT contain the header, and note it.)

### Step 5: Document it

In `THINGS_TO_KNOW.md`, section "Permission and reliability", after the bullet
starting "The backend caches results to keep traffic to the networks low",
add one bullet: successful responses also carry `Vercel-CDN-Cache-Control`
with the same lifetime, so Vercel's CDN serves repeats across instances;
concurrent requests for the same key share one upstream call; failures are
never cached.

**Verify**: `git diff --stat` shows only in-scope files.

## Test plan

- `backend/test/cache.test.ts`: 6 cases listed in Step 2, modeled on
  `backend/test/berlinTime.test.ts`.
- Full suite: `npm test` → all existing tests plus 6 new pass.

## Done criteria

- [ ] `cd backend && npm run typecheck` exits 0
- [ ] `cd backend && npm test` exits 0, `test/cache.test.ts` has 6 passing tests
- [ ] `grep -rn "Vercel-CDN-Cache-Control" backend/lib/http.ts` → 1 match
- [ ] `grep -rn "cacheOnCdn(res" backend/api | wc -l` → 6
- [ ] `grep -n "MAX_QUERY_LENGTH" backend/api/stations.ts` → ≥2 matches
- [ ] `git status` shows only in-scope files modified/created
- [ ] `plans/README.md` status row updated

## STOP conditions

- `cache.ts` no longer matches the excerpt above.
- Any existing test fails after Step 1 and the cause is not obvious from the
  new promise semantics.
- `mock.timers` with `apis: ['Date']` is unavailable in the installed Node
  (error mentions unknown API) — report the Node version instead of
  rewriting tests around real timers.
- A handler has a response path you cannot classify as success vs. error.

## Maintenance notes

- After deploy, a human should confirm the CDN works: request the same
  `/api/board/...` URL twice within 25 s against the production URL and check
  the second response has `x-vercel-cache: HIT`. If it shows `MISS` every
  time, Vercel ignores the header for this project setup — check Vercel's
  current docs on `Vercel-CDN-Cache-Control` and the project's caching settings.
- The CDN keys by full URL, so `/api/board/x` and `/api/board/x?when=...` are
  separate entries — this matches the in-memory keys.
- `expiresAt` now counts from request start, not completion; a slow upstream
  shortens the effective TTL slightly. Intended.
- Deferred: negative caching of failed stop lookups (`resolve.ts`) — separate
  decision; failures are deliberately retried now.
