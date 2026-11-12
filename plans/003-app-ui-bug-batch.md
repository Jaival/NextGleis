# Plan 003: Fix four small app UI bugs (saved route reopen, board row keys, filtered-board message, refresh cancelling "later")

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e96b32d..HEAD -- "app/(tabs)/index.tsx" "app/(tabs)/routes.tsx" "app/board/[evaNo].tsx" lib/i18n/en.ts lib/i18n/de.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (run before or after plan 004, never in parallel — both edit `app/board/[evaNo].tsx` and `app/(tabs)/routes.tsx`)
- **Category**: bug
- **Planned at**: commit `e96b32d`, 2026-11-10

## Why this matters

NextGleis is an Expo (React Native) departure-board app. Four independent,
user-visible bugs, each a few lines:

- **A. Saved route ignored on reopen.** Home → tap saved route "A→B" → Routes
  shows A→B. User edits the start to C. Back on Home, tapping "A→B" again
  still shows C→B: the params didn't change, so the screen skips them.
- **B. Board rows remount every refresh.** The departure list key includes the
  row index; when a 30-second refresh adds or drops one row, every row below
  gets a new key and remounts (lost press state, wasted work).
- **C. Wrong message when directions filter everything.** If only *direction*
  filters (long-press a line chip) hide every row, the board says "no
  departures" instead of "everything is filtered out".
- **D. Pull-to-refresh drops a "later" page load.** Starting a refetch while a
  page fetch runs cancels the page fetch (TanStack Query's `refetch()` defaults
  to `cancelRefetch: true`), so the user's "Later"/"Earlier" tap is silently lost.

## Current state

Stack: Expo SDK 57, Expo Router (typed routes), TanStack Query v5, React 19
with the React Compiler (no need to add `useMemo`/`useCallback` by hand, but
keep existing ones). i18n catalogs: `lib/i18n/en.ts` (defines type `Messages`)
and `lib/i18n/de.ts` (typed `Messages`, so a key missing in either fails
`npm run typecheck`).

**A** — `app/(tabs)/index.tsx:76-86`:

```tsx
  const openRoute = useCallback((route: (typeof sortedRoutes)[number]) => {
    router.push({
      pathname: '/routes',
      params: {
        fromEva: route.fromEva,
        fromName: route.fromName,
        toEva: route.toEva,
        toName: route.toName,
      },
    });
  }, []);
```

`app/(tabs)/routes.tsx:74-100`:

```tsx
  const { fromEva, fromName, toEva, toName } = useLocalSearchParams<{
    fromEva?: string;
    fromName?: string;
    toEva?: string;
    toName?: string;
  }>();
  ...
  const paramsKey = fromEva && fromName && toEva && toName ? `${fromEva}>${toEva}` : null;
  const [appliedParams, setAppliedParams] = useState<string | null>(null);
  if (paramsKey && paramsKey !== appliedParams && fromEva && fromName && toEva && toName) {
    setAppliedParams(paramsKey);
    setFrom({ id: fromEva, name: fromName });
    setTo({ id: toEva, name: toName });
    setEditing(null);
  }
```

`paramsKey` is also read at `routes.tsx:107` (`!paramsKey` in the nearby
auto-fill guard) — that use must keep working.

**B** — `app/board/[evaNo].tsx:51-54` already has a stable key function used
for deduping pages:

```tsx
function rowKey(row: Row): string {
  const towards = 'direction' in row ? row.direction : row.origin;
  return row.tripId ?? `${row.line}|${towards}|${row.scheduledTime}`;
}
```

but the list at `app/board/[evaNo].tsx:325` uses:

```tsx
          keyExtractor={(item, index) => `${item.line}-${item.scheduledTime}-${index}`}
```

`mergePages` (`:56-66`) already dedupes by `rowKey`, so keys are unique.

**C** — `app/board/[evaNo].tsx`, inside `ListEmptyComponent` (~`:378-410`): the
chain is `isOffline ? … : isError ? … : hiddenLines.length > 0 ? <EmptyState
title={t('board.filteredTitle')} message={t('board.filteredMessage')} …/> :
<EmptyState title={t('board.emptyTitle')} …/>`. Relevant values defined
earlier in the component: `rows` (all rows after Deutschlandticket filtering,
`:136`), `visibleRows` (after line and direction filters, `:155`),
`hiddenLines`, `hiddenDirections`. Strings, `lib/i18n/en.ts:77-78`:

```ts
  'board.filteredTitle': 'Everything is filtered out',
  'board.filteredMessage': 'Tap a line above to bring its departures back.',
```

`lib/i18n/de.ts:86-87`:

```ts
  'board.filteredTitle': 'Alles ausgeblendet',
  'board.filteredMessage': 'Tippe oben auf eine Linie, um ihre Abfahrten wieder einzublenden.',
```

Tapping a line chip toggles the *whole line*; long-pressing opens the
direction sheet. So the directions case needs its own message.

**D** — `app/board/[evaNo].tsx:~368-376`:

```tsx
            <RefreshControl
              // isRefetching also covers a page being added, which has its own
              // spinner on the button.
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
```

`app/(tabs)/routes.tsx:521-529` (inside `JourneyList`), where
`const fetchingPage = isFetchingPreviousPage || isFetchingNextPage;` exists at `:498`:

```tsx
        <RefreshControl
          // isRefetching is also true while a page is added; that has its own
          // spinner on the button.
          refreshing={isRefetching && !isFetchingPreviousPage && !isFetchingNextPage}
          onRefresh={refetch}
```

Conventions: comments explain *why* in full sentences; match surrounding style.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|------------------------|---------------------|
| Install   | `npm ci`               | exit 0 |
| Typecheck | `npm run typecheck`    | exit 0 |
| Lint      | `npm run lint`         | 0 errors |
| Format    | `npm run format:check` | passes |
| Tests     | `npm test` (only if plan 002 has landed) | `ℹ fail 0` |

## Scope

**In scope**: `app/(tabs)/index.tsx`, `app/(tabs)/routes.tsx`,
`app/board/[evaNo].tsx`, `lib/i18n/en.ts`, `lib/i18n/de.ts`.

**Out of scope**:
- `components/TripTimeSheet.tsx` — switching depart/arrive pins "leave now" to
  the current time on purpose (an "arrive by" search needs a time; the sheet
  has a separate "Now" action). Not a bug; do not change.
- The `refetchInterval` values and focus handling — plan 004.
- The "Show later" button hidden when every row is filtered — leave as is.
- Any refactor/extraction of these screens.

## Git workflow

- Branch: `advisor/003-app-ui-bugs`
- One commit per bug (A–D), plain imperative message, e.g. "Reapply a saved
  route each time it's opened from Home". End each with a blank line and
  `Assisted-by: Claude`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1 (A): Make each open from Home a new request

1. In `app/(tabs)/index.tsx` `openRoute`, add a param `opened: String(Date.now())`
   to `params`. Comment: the timestamp makes reopening the same saved route
   count as a new request, so it replaces edits made on the Routes screen.
2. In `app/(tabs)/routes.tsx`, add `opened?: string;` to the
   `useLocalSearchParams` type and destructuring, and change `paramsKey` to
   `` `${fromEva}>${toEva}@${opened ?? ''}` `` (still `null` when any of the four
   stop params is missing). Update the comment above it to mention the timestamp.

**Verify**: `npm run typecheck` → exit 0 (typed routes accept the extra param;
if typecheck rejects `opened`, STOP).

### Step 2 (B): Key board rows by identity

In `app/board/[evaNo].tsx`, replace the `keyExtractor` at `:325` with
`keyExtractor={rowKey}`.

**Verify**: `grep -n "keyExtractor" "app/board/[evaNo].tsx"` → one line, `keyExtractor={rowKey}`. `npm run typecheck` → exit 0.

### Step 3 (C): Show the filter message when directions hide everything

1. Add key `'board.filteredDirectionsMessage'` right after
   `'board.filteredMessage'` in both catalogs:
   - en: `'Long-press a line above to show its directions again.'`
   - de: `'Halte oben eine Linie gedrückt, um ihre Richtungen wieder einzublenden.'`
2. In the board `ListEmptyComponent`, replace the condition
   `hiddenLines.length > 0` with `rows.length > 0` (there were rows; filters
   hid them all), and pick the message:
   `hiddenLines.length > 0 ? t('board.filteredMessage') : t('board.filteredDirectionsMessage')`.
   Keep the same `EmptyState` props otherwise.

**Verify**: `npm run typecheck` → exit 0 (fails if a catalog lacks the key).

### Step 4 (D): Don't let pull-to-refresh cancel a page load

1. Board: change `onRefresh={refetch}` to
   `onRefresh={() => { if (!isFetchingNextPage) refetch(); }}` — format however
   Prettier wants. Add to the existing comment: a refetch would cancel the page
   load (TanStack's `cancelRefetch`), so a pull during one is ignored.
2. Routes `JourneyList`: same, using `fetchingPage`:
   `onRefresh={() => { if (!fetchingPage) refetch(); }}`.

**Verify**: `npm run typecheck` → exit 0; `npm run lint` → 0 errors;
`npx prettier --write "app/(tabs)/index.tsx" "app/(tabs)/routes.tsx" "app/board/[evaNo].tsx" lib/i18n/en.ts lib/i18n/de.ts` then `npm run format:check` → passes.

## Test plan

No automated UI tests exist. Manual check on Android emulator or device with
the backend running (`cd backend && npm start`, app `npm run android`):

1. A: save route A→B; open it from Home; edit start to another stop; go Home;
   tap A→B → start shows A again.
2. B: no visible change expected; optional — React DevTools shows rows keep
   identity across a refresh.
3. C: open a board, long-press a line chip, hide every direction of every line
   on show → "Everything is filtered out" with the long-press hint.
4. D: on a board, tap "Later departures" and immediately pull to refresh → the
   later rows still appear.

If no emulator is available, state that the manual check was not run.

## Done criteria

- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` 0 errors; `npm run format:check` passes
- [ ] `grep -n "opened" "app/(tabs)/index.tsx" "app/(tabs)/routes.tsx"` → matches in both
- [ ] `grep -n "keyExtractor={rowKey}" "app/board/[evaNo].tsx"` → 1 match
- [ ] `grep -c "board.filteredDirectionsMessage" lib/i18n/en.ts lib/i18n/de.ts "app/board/[evaNo].tsx"` → 1 each
- [ ] `grep -n "onRefresh={refetch}" "app/board/[evaNo].tsx" "app/(tabs)/routes.tsx"` → no matches
- [ ] Only in-scope files changed (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpts above don't match the live code.
- Typed routes reject the new `opened` param.
- `rowKey` is not in scope at the `FlatList` (moved/renamed).
- The board's `ListEmptyComponent` branch order differs from the description.

## Maintenance notes

- Any other screen that deep-links into Routes with stop params should also
  pass `opened`, or a repeat open will be ignored.
- If `rowKey` changes (e.g. EFA rows gain a `tripId`), keys stay unique only
  while `mergePages` dedupes by the same function — keep them in sync.
- Reviewer: check the German string reads naturally on a small screen.
