# Plan 002: The app has a one-command unit test suite for its pure `lib/` logic, run in CI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e96b32d..HEAD -- package.json tsconfig.json eslint.config.js .github/workflows/ci.yml lib/product.ts lib/time.ts lib/delay.ts lib/notices.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `e96b32d`, 2026-11-10

## Why this matters

The Expo app has no test runner at all (`package.json` has no `test` script).
The logic that decides what riders see — which trains the Deutschlandticket
mode hides, delay labels, Berlin wall-clock math, which disruption warnings
show — is untested, and CI is green regardless. This plan adds the cheapest
possible runner, **with no new dependency**: Node's built-in `node:test`
running TypeScript directly through Node's type stripping, the same approach
`backend/` already uses. It is the prerequisite for any later refactor of the
big screens (`app/(tabs)/routes.tsx`, `app/board/[evaNo].tsx`).

## Current state

- Root `package.json` scripts (excerpt): `"typecheck": "tsc --noEmit"`,
  `"lint": "eslint ."`, `"format:check": "prettier --check ."`. No `test`.
- Root `tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules", "android", "ios", "dist", "backend"]
}
```

  `expo/tsconfig.base` sets `"noEmit": true`, `"moduleResolution": "bundler"`.
  Test files under a new root `test/` folder are picked up by `**/*.ts`
  automatically, so `npm run typecheck` checks them too.
- The four target modules only have **type-only** imports, so Node can run
  them directly (verified during planning: importing `lib/product.ts` and
  `lib/time.ts` from a `node --test` file works on Node 24/26):
  - `lib/product.ts` — `productKind(line)` and `needsLongDistanceTicket(line)`;
    category = leading letters of the label, upper-cased; unknown word → `'regional'`, no letters → `'other'`.
  - `lib/time.ts` — `formatTime(iso)` (slices `HH:mm`), `minutesBetween(from, to)`
    (both wall-clock strings like `2026-07-01T12:00:00`, no zone suffix),
    `formatDuration(minutes, t)`, `formatClock(date, language)` (Berlin time),
    `berlinNow()`, `addMinutes(wall, minutes)` (wall-clock arithmetic read as UTC on purpose).
  - `lib/delay.ts` — `departureStatus({ cancelled, delayMinutes }, colors, t)`;
    cancelled wins, then `delayMinutes > 0` → delayed, else on time.
  - `lib/notices.ts` — `boardWarnings(rows)`: keeps `severity === 'warning'`
    notices only, dedupes by `text`, most frequent first.
- Types the tests need: `Translate` from `lib/i18n` is
  `<K extends Key>(key: K, ...params: Params<K>) => string`; `ThemeColors`
  from `lib/theme`; `Notice` from `types/index.ts`
  (`{ title?: string; text: string; severity: 'warning' | 'info' }`).
  **Import these with `import type` only** — a value import of `lib/i18n` or
  `lib/theme` would pull in React Native and fail under Node.
- Test style to copy — `backend/test/berlinTime.test.ts`:

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

  (The backend uses `.js` + a resolve hook; the app tests instead import with
  the real `.ts` extension, which needs one tsconfig flag — Step 1.)
- CI: `.github/workflows/ci.yml`, job `app`, uses Node 24 and runs, in order:
  `npm ci`, `npm run typecheck`, `npm run lint`, `npm run format:check`,
  `npx expo install --check`, `npx expo-doctor`.

## Commands you will need

Run from the repo root. Node 22.18+ (CI uses 24).

| Purpose   | Command                | Expected on success |
|-----------|------------------------|---------------------|
| Install   | `npm ci`               | exit 0 |
| Typecheck | `npm run typecheck`    | exit 0 |
| Lint      | `npm run lint`         | exit 0 (warnings allowed, 0 errors) |
| Format    | `npm run format:check` | "All matched files use Prettier code style!" |
| Tests     | `npm test`             | `ℹ fail 0` |

Windows note: if `npm run lint` / `format:check` report `Delete ␍` on files
you did not touch, your checkout has CRLF line endings; run
`git add --renormalize . && git checkout -- .` only if the operator allows,
otherwise ignore errors in untouched files and report them.

## Scope

**In scope**:
- `package.json` (add one script only)
- `tsconfig.json` (add one compiler option only)
- `test/product.test.ts`, `test/time.test.ts`, `test/delay.test.ts`, `test/notices.test.ts` (create)
- `.github/workflows/ci.yml` (add one step)
- `eslint.config.js` only if Step 3's fallback is needed
- `README.md` — the scripts table, one row

**Out of scope**:
- Do not install jest, jest-expo, vitest or any package. No `package-lock.json` change.
- Do not change any `lib/` source, even if a test reveals odd behavior —
  write the test to the current behavior and list the oddity in your report.
- Component / screen tests — not this plan.
- `backend/` — has its own suite.

## Git workflow

- Branch: `advisor/002-app-unit-tests`
- Commit messages: plain imperative sentence, no prefix (e.g. "Add unit tests
  for product, time, delay and notice helpers"). End with a blank line and
  `Assisted-by: Claude`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Allow `.ts` import paths in the typecheck

Add `"allowImportingTsExtensions": true` to `compilerOptions` in root
`tsconfig.json`. (Valid because the base config sets `noEmit`; Metro is
unaffected.)

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Add the `test` script

In root `package.json` `scripts`, add after `"typecheck"`:

```json
"test": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test \"test/**/*.test.ts\"",
```

(The flag silences Node's notice that `lib/*.ts` parse as ES modules in a
package without `"type": "module"`. Do not add `"type": "module"` — it would
change how Expo/Metro config files load.)

**Verify**: `npm test` → exits non-zero or reports 0 tests (no files yet) — either is fine at this step.

### Step 3: Write the four test files

Each file starts with:

```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
```

and imports the module under test as `../lib/<name>.ts`. Use this stub
translator where a `Translate` is needed:

```ts
import type { Translate } from '../lib/i18n';
const t = ((key: string, ...params: unknown[]) => [key, ...params].join(':')) as unknown as Translate;
```

Cases (one `it` each; exact expected values given):

`test/product.test.ts`
- `productKind('ICE 4523')` → `'highSpeed'`; `'IC 2021'` → `'longDistance'`; `'NJ 40490'` → `'longDistance'`; `'FLX 1234'` → `'longDistance'`
- `'S 3'` → `'suburban'`; `'U 5'` → `'metro'`; `'Tram 6'` → `'tram'`; `'Bus 42'` → `'bus'`; `'AST 5'` → `'bus'`
- unknown word category: `'RE 30'` → `'regional'`; `'MEX 12'` → `'regional'`
- no letters: `'42'` → `'other'`; empty string → `'other'`
- case and whitespace: `'  ice 9'` → `'highSpeed'`
- `needsLongDistanceTicket`: true for `'ICE 1'`, `'IC 1'`, `'EC 1'`, `'NJ 1'`, `'FLX 1'`; false for `'RE 1'`, `'S 1'`, `'Bus 1'`, `'Tram 1'`

`test/time.test.ts`
- `formatTime('2026-07-01T12:34:00')` → `'12:34'`
- `minutesBetween('2026-07-01T12:00:00', '2026-07-01T13:15:00')` → `75`; across midnight `('2026-07-01T23:50:00', '2026-07-02T00:10:00')` → `20`
- `addMinutes('2026-07-01T23:50:00', 20)` → `'2026-07-02T00:10:00'`
- `addMinutes('2026-10-25T01:50', 30)` → `'2026-10-25T02:20:00'` (wall-clock arithmetic; ignores the DST change by design — say so in the test name)
- `formatClock(new Date('2026-07-01T10:00:00Z'), 'de')` → `'12:00'`; `formatClock(new Date('2026-12-01T10:00:00Z'), 'en')` → `'11:00'`
- `berlinNow()` matches `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/`
- `formatDuration(75, t)` → `'common.duration:1:15'`; `formatDuration(5, t)` → `'common.duration:0:5'`

`test/delay.test.ts`
- Build `const colors = { cancelled: 'C', cancelledSoft: 'CS', delay: 'D', delaySoft: 'DS', onTime: 'O', onTimeSoft: 'OS' } as unknown as ThemeColors;` (`import type { ThemeColors } from '../lib/theme';`)
- cancelled with delay 10 → `{ kind: 'cancelled', label: 'status.cancelled', fg: 'C', bg: 'CS' }` (use `assert.deepEqual`)
- delay 5 → kind `'delayed'`, label `'status.delayed:5'`
- delay 0 → kind `'onTime'`; delay undefined → kind `'onTime'`; delay -2 → kind `'onTime'`

`test/notices.test.ts`
- `boardWarnings([])` → `[]`
- info notices are dropped
- the same warning text on 3 rows appears once
- order: warning A on 1 row, warning B on 3 rows → `[B, A]`
- rows without `notices` are skipped without error

**Verify**: `npm test` → `ℹ fail 0`, `ℹ pass` ≥ 25.

Then `npm run typecheck` → exit 0 and `npm run lint` → 0 errors.
Fallback: if lint errors **only** on the `.ts` extension of the test imports
(rule name contains `import/`), add one block to `eslint.config.js` before the
`ignores` block: `{ files: ['test/**/*.ts'], rules: { '<that rule>': 'off' } }`
with a one-line comment why. Any other lint error: fix it in the test file.

Then `npx prettier --write test/` and `npm run format:check` → passes.

If an expected value above does not match current behavior, do NOT change
`lib/`; STOP for `product`/`delay`/`notices` mismatches (the plan's model of the
code is wrong), and for `time` mismatches caused only by ICU locale output
(e.g. `formatClock`), report the actual string and assert that instead.

### Step 4: Run tests in CI

In `.github/workflows/ci.yml`, job `app`, add after the `Typecheck` step:

```yaml
      - name: Unit tests
        run: npm test
```

**Verify**: `npx --yes yaml-lint .github/workflows/ci.yml` is not required;
instead check `grep -n "Unit tests" -A1 .github/workflows/ci.yml` shows two
matches (backend job already has one) and the new one is under `app:`.

### Step 5: Document the script

In `README.md`, find the table of npm scripts (it lists `android:emu`,
`build:apk:gradle`, `typecheck`, …). Add a row for `npm test`: "Unit tests for
the app's pure helpers in `lib/` (Node's test runner, no extra dependency)".
Match the table's existing column format exactly.

**Verify**: `git diff --stat` lists only in-scope files.

## Test plan

Covered by Step 3: ~25 cases across 4 files, modeled on
`backend/test/berlinTime.test.ts`. Final: `npm test` → all pass.

## Done criteria

- [ ] `npm test` exits 0 with ≥ 25 passing tests in `test/`
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` reports 0 errors
- [ ] `npm run format:check` passes
- [ ] `grep -n '"test"' package.json` → 1 match
- [ ] `git diff --stat -- package-lock.json` → empty (no new dependency)
- [ ] `.github/workflows/ci.yml` app job runs `npm test`
- [ ] `plans/README.md` status row updated

## STOP conditions

- Node reports a syntax/type-stripping error inside a `lib/` file (it uses a
  TS feature Node can't strip, such as `enum`) — report the file and line.
- Importing a target module pulls in `react-native` at runtime.
- Any `product`/`delay`/`notices` expectation in Step 3 fails.
- Making lint pass needs more than the single-rule override described.

## Maintenance notes

- Only modules with type-only imports can be tested this way. A helper that
  imports React Native must keep its pure logic in a separate file to be tested.
- When a future plan extracts logic from `app/board/[evaNo].tsx`
  (`mergePages`, `rowKey`) or `app/(tabs)/routes.tsx` into `lib/`, add tests here first.
- Reviewer: confirm no `lib/` file changed and no dependency was added.
