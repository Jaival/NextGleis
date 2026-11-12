# Plan 005: One malformed remark or slow upstream body can no longer break or hang a backend response

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e96b32d..HEAD -- backend/lib/hafas/remarks.ts backend/lib/efa/request.ts backend/lib/dbClient.ts backend/lib/http.ts backend/test`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (if plan 001 is in progress on another branch, expect a trivial merge in `backend/lib/http.ts`)
- **Category**: bug
- **Planned at**: commit `e96b32d`, 2026-11-10

## Why this matters

The backend (`backend/`, Node 22 TypeScript, deployed as Vercel functions)
normalizes data from public transport planners. Three defects:

1. **Crash on a bad HTML entity.** Disruption texts are HTML; `plainText()`
   decodes numeric entities with `String.fromCodePoint`, which **throws
   `RangeError`** for values above `0x10FFFF`. The throw propagates out of
   board/journey normalization, so one malformed remark from a network turns
   every board or route that carries it into HTTP 500 (and errors are not
   cached, so every request retries upstream).
2. **EFA body read has no deadline.** `efaRequest` races only the `fetch()`
   promise (headers) against a 5 s timeout; `res.json()` can then hang until
   the function's platform limit. The timed-out request is also never aborted.
3. **DB Timetables client has no deadline at all**, and its HTTP status (e.g.
   401/403 when the server's own credentials are wrong) is passed straight to
   the public client as that status.

## Current state

- `backend/lib/hafas/remarks.ts:24-40`:

```ts
// Warning texts are HTML fragments: <br>, <a href>, &nbsp; and the like.
function plainText(html: string | undefined): string {
  if (!html) return '';
  const text = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (match, entity: string) => {
      if (entity.startsWith('#x') || entity.startsWith('#X')) {
        return String.fromCodePoint(parseInt(entity.slice(2), 16));
      }
      if (entity.startsWith('#')) return String.fromCodePoint(parseInt(entity.slice(1), 10));
      return ENTITIES[entity.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH - 1).trimEnd()}…` : text;
}

export function toNotices(remarks: readonly Remark[] | undefined): Notice[] | undefined {
```

  `plainText` is private; `toNotices` is exported. `Remark = Hint | Status | Warning`
  from `hafas-client`; only `type: 'warning' | 'status'` remarks are kept;
  `text` falls back to `summary`. `MAX_NOTICES = 3`.
- `backend/lib/efa/request.ts:5,26-45`:

```ts
const REQUEST_TIMEOUT_MS = 5_000;
...
export async function efaRequest<T>(
  network: EfaNetwork,
  request: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${network.endpoint}${request}`);
  ...
  const res = await withTimeout(
    fetch(url, { headers: { 'User-Agent': HAFAS_USER_AGENT, Accept: 'application/json' } }),
    REQUEST_TIMEOUT_MS,
  );
  if (!res.ok) {
    throw new EfaRequestError(`${network.label} request to ${request} failed with ${res.status}`);
  }

  return (await res.json()) as T;
}
```

  It imports `withTimeout` from `../hafas/networks.js`.
- `backend/lib/hafas/networks.ts:156-161` — the error `sendError` maps to 504:

```ts
export class UpstreamTimeoutError extends Error {
  constructor(ms: number) {
    super(`Upstream network did not answer within ${ms}ms`);
    this.name = 'UpstreamTimeoutError';
  }
}
```

- `backend/lib/dbClient.ts:15-31`:

```ts
export async function fetchDbXml(path: string): Promise<string> {
  const { clientId, apiKey } = getDbCredentials();

  const res = await fetch(`${DB_API_BASE_URL}${path}`, {
    headers: {
      'DB-Client-ID': clientId,
      'DB-Api-Key': apiKey,
      Accept: 'application/xml',
    },
  });

  if (!res.ok) {
    throw new DbApiError(`DB API request to ${path} failed with ${res.status}`, res.status);
  }

  return res.text();
}
```

- `backend/lib/http.ts`, start of `sendError`:

```ts
export function sendError(res: ApiResponse, err: unknown): void {
  if (err instanceof DbApiError) {
    res.status(err.status >= 500 ? 502 : err.status).json({ error: err.message });
    return;
  }
```

- Node 22.18+ is required by the backend; `AbortSignal.timeout(ms)` is
  available. When it fires, both `fetch()` and a pending `res.json()`/`res.text()`
  reject with an error whose `name === 'TimeoutError'`.
- Test style: see `backend/test/berlinTime.test.ts` (`node:test`, `node:assert/strict`,
  imports with `.js` extension).

## Commands you will need

Run from `backend/`.

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Install   | `npm ci`            | exit 0 |
| Typecheck | `npm run typecheck` | exit 0 |
| Tests     | `npm test`          | `ℹ fail 0` |
| One file  | `node --import ./ts-resolve.mjs --test test/remarks.test.ts` | `ℹ fail 0` |

## Scope

**In scope**: `backend/lib/hafas/remarks.ts`, `backend/lib/efa/request.ts`,
`backend/lib/dbClient.ts`, `backend/lib/http.ts`, `backend/test/remarks.test.ts` (create).

**Out of scope**:
- `withTimeout` in `backend/lib/hafas/networks.ts` and its hafas-client
  callers — hafas-client has no signal support; leave them.
- `backend/lib/timetables.ts` `Promise.all` — legacy fallback only; leave.
- Response shapes and status codes other than the `DbApiError` mapping.

## Git workflow

- Branch: `advisor/005-backend-upstream-robustness`
- One commit per step, plain imperative message (e.g. "Keep a malformed
  entity in a remark as text instead of failing the board"). End each with a
  blank line and `Assisted-by: Claude`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Write the failing test first

Create `backend/test/remarks.test.ts`:

```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Warning } from 'hafas-client';
import { toNotices } from '../lib/hafas/remarks.js';

const warning = (text: string) => ({ type: 'warning', text }) as Warning;
```

Cases:
1. `toNotices([warning('Gleis&nbsp;3 &amp; 4')])` → `[{ text: 'Gleis 3 & 4', severity: 'warning' }]` (`assert.deepEqual`).
2. Decimal and hex entities decode: `'&#228;&#xFC;'` → text `'äü'`.
3. Out-of-range decimal `'Bauarbeiten &#99999999; heute'` does not throw and keeps the entity as written: text `'Bauarbeiten &#99999999; heute'`.
4. Out-of-range hex `'&#x110000;'` → text `'&#x110000;'`.

**Verify**: `node --import ./ts-resolve.mjs --test test/remarks.test.ts` → cases 1–2 pass, 3–4 fail with `RangeError`. (If 3–4 already pass, STOP.)

### Step 2: Fix the decoder

In `plainText`, compute the code point, and return `match` unchanged when it
is not a finite number in `0..0x10FFFF`. Shape:

```ts
    .replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (match, entity: string) => {
      if (!entity.startsWith('#')) return ENTITIES[entity.toLowerCase()] ?? match;
      const hex = entity[1] === 'x' || entity[1] === 'X';
      const codePoint = parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      // A malformed entity from a network stays as text rather than throwing
      // and failing every board that carries the remark.
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
    })
```

**Verify**: `node --import ./ts-resolve.mjs --test test/remarks.test.ts` → `ℹ pass 4`; `npm test` → `ℹ fail 0`.

### Step 3: Give EFA requests a real deadline

In `backend/lib/efa/request.ts`:
1. Pass `signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)` in the `fetch` options
   and drop the `withTimeout(...)` wrapper.
2. Wrap the fetch, status check and `res.json()` in `try`; in `catch`, if
   `err instanceof Error && err.name === 'TimeoutError'` throw
   `new UpstreamTimeoutError(REQUEST_TIMEOUT_MS)`, otherwise rethrow `err`.
   Keep the `EfaRequestError` for non-OK status.
3. Import `UpstreamTimeoutError` from `../hafas/networks.js` instead of `withTimeout`.
4. Comment: the signal covers the body as well as the headers, and aborts
   the socket rather than leaving it running.

**Verify**: `npm run typecheck` → exit 0; `grep -n "withTimeout" lib/efa/request.ts` → no matches; `npm test` → `ℹ fail 0`.

### Step 4: Same deadline for DB Timetables, and stop leaking its status

1. `backend/lib/dbClient.ts`: add `const REQUEST_TIMEOUT_MS = 5_000;`, pass
   `signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)`, wrap fetch + `res.text()`
   with the same `TimeoutError` → `UpstreamTimeoutError` mapping as Step 3
   (import from `./hafas/networks.js`). Never include header values in any message.
2. `backend/lib/http.ts` `sendError`: for `DbApiError`, log the detail with
   `console.error(err.message)` and respond
   `res.status(err.status === 404 ? 404 : 502).json({ error: 'Timetable service request failed' })`.
   Comment: a 401/403 here is the server's own credential problem, not the client's.

**Verify**: `npm run typecheck` → exit 0; `npm test` → `ℹ fail 0`;
`grep -n "err.status >= 500" lib/http.ts` → no matches.

## Test plan

- `backend/test/remarks.test.ts`: 4 cases (Step 1).
- Timeouts (Steps 3–4) are not unit-tested: they would need a fake slow
  server; covered by typecheck and review. Optional manual check: run
  `npm start`, request `/api/board/<an EFA stop id from /api/stations?query=Stuttgart%20Hbf>` → 200 as before.

## Done criteria

- [ ] `cd backend && npm run typecheck` exits 0
- [ ] `cd backend && npm test` exits 0, `test/remarks.test.ts` 4 passing
- [ ] `grep -n "AbortSignal.timeout" backend/lib/efa/request.ts backend/lib/dbClient.ts` → 1 match each
- [ ] Only in-scope files changed
- [ ] `plans/README.md` status row updated

## STOP conditions

- Step 1 cases 3–4 already pass before the fix (someone fixed it; report).
- `AbortSignal.timeout` is missing from the TypeScript `lib`/`@types/node` in use.
- `sendError`'s `DbApiError` branch differs from the excerpt.

## Maintenance notes

- Any new upstream `fetch` in the backend should use `AbortSignal.timeout`
  and the same `TimeoutError` → `UpstreamTimeoutError` mapping (504 to clients).
- Reviewer: confirm no header or credential value reaches a log line or a response.
