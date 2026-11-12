# Plan 004: Board, trip and routes stop polling while their screen is not in view

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e96b32d..HEAD -- "app/board/[evaNo].tsx" "app/trip/[id].tsx" "app/(tabs)/routes.tsx" lib/network.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (run before or after plan 003, never in parallel — both edit `app/board/[evaNo].tsx` and `app/(tabs)/routes.tsx`)
- **Category**: perf
- **Planned at**: commit `e96b32d`, 2026-11-10

## Why this matters

NextGleis (Expo / React Native) polls live data: the departure board every
30 s, the trip screen every 30 s, the route list every 60 s. Polling pauses
when the *app* goes to the background (`lib/network.ts`), but not when a
*screen* is covered. Tapping a departure pushes the trip screen on top of the
board — the board keeps polling underneath. The Routes tab keeps polling while
the user is on another tab. Each hidden poll costs battery and mobile data on
the phone and traffic to the transport networks behind the backend, which the
project must keep low. After this plan only the visible screen polls, and a
screen refetches once on return if its data is stale.

## Current state

- `lib/queryClient.ts` — global defaults: `staleTime: 15_000`, `retry: 1`.
- `lib/network.ts:21-28` — app-level focus only:

```ts
function setupFocusManager() {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      setFocused(status === 'active');
    });
    return () => subscription.remove();
  });
}
```

- `app/board/[evaNo].tsx:115-129` — `useInfiniteQuery({ queryKey: ['board', mode, evaNo], …, refetchInterval: 30_000 })`
- `app/trip/[id].tsx:72-76`:

```tsx
  const { data, isLoading, isError, isRefetching, refetch, fetchStatus } = useQuery({
    queryKey: ['trip', id],
    queryFn: ({ signal }) => getTrip(id, signal),
    refetchInterval: 30_000,
  });
```

- `app/(tabs)/routes.tsx:451-472` — inside the `JourneyList` component (rendered
  by the Routes screen): `useInfiniteQuery({ queryKey: ['journeys', …], …, refetchInterval: 60_000 })`.
- No file in `app/`, `components/`, `lib/` uses `useIsFocused` or `useFocusEffect` today.
- Library facts (verified in `node_modules` at plan time):
  - `useIsFocused` is exported from `expo-router` (`node_modules/expo-router/build/exports.d.ts:20`).
    Do **not** import it from `expo-router/react-navigation` — that export is marked deprecated.
  - TanStack Query 5.101.4 supports the `subscribed?: boolean` option on
    `useQuery` / `useInfiniteQuery`. With `subscribed: false` the observer
    detaches: no interval timer runs, and the component keeps showing the last
    result. When it becomes `true` again, the observer re-attaches and fetches
    once if the data is stale (older than `staleTime`, 15 s) — this is
    TanStack's documented React Native pattern for screens out of focus.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|------------------------|---------------------|
| Install   | `npm ci`               | exit 0 |
| Typecheck | `npm run typecheck`    | exit 0 |
| Lint      | `npm run lint`         | 0 errors |
| Format    | `npm run format:check` | passes |
| Tests     | `npm test` (only if plan 002 has landed) | `ℹ fail 0` |

## Scope

**In scope**: `app/board/[evaNo].tsx`, `app/trip/[id].tsx`, `app/(tabs)/routes.tsx`.

**Out of scope**:
- `lib/network.ts` and `lib/queryClient.ts` — app-level focus stays as is.
- `refetchInterval` values — unchanged.
- Refetching only the first page of infinite queries — TanStack v5 removed
  per-page refetch; deferred (see Maintenance notes).
- Any other `useQuery` (search, nearby) — they don't poll.

## Git workflow

- Branch: `advisor/004-pause-off-screen-polling`
- One commit, plain imperative message: "Stop polling boards, trips and routes
  that aren't on screen". End with a blank line and `Assisted-by: Claude`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Board

In `app/board/[evaNo].tsx`:
1. Add `useIsFocused` to the existing `expo-router` import (the file already
   imports `useLocalSearchParams`/`useRouter` from `expo-router`; extend that
   import, don't add a second one).
2. In `BoardScreen`, before the `useInfiniteQuery` call: `const isFocused = useIsFocused();`
3. Add `subscribed: isFocused,` to the `useInfiniteQuery` options, next to
   `refetchInterval`, with a comment: a board under the trip screen (or after
   leaving it) shouldn't keep polling; on return it refetches once if stale.

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Trip

Same three changes in `app/trip/[id].tsx` for its `useQuery`.

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Routes

In `app/(tabs)/routes.tsx`, inside the `JourneyList` function component
(not `RoutesScreen`), call `const isFocused = useIsFocused();` before its
`useInfiniteQuery`, and add `subscribed: isFocused,`. Comment: the Routes tab
stays mounted while another tab is open.

**Verify**: `npm run typecheck` → exit 0; `npm run lint` → 0 errors;
`grep -rn "subscribed: isFocused" app | wc -l` → `3`;
`grep -rn "expo-router/react-navigation" app/board app/trip "app/(tabs)/routes.tsx"` → no matches.

### Step 4: Format

`npx prettier --write "app/board/[evaNo].tsx" "app/trip/[id].tsx" "app/(tabs)/routes.tsx"` then `npm run format:check` → passes.

## Test plan

No automated UI tests. Manual check with the backend running locally
(`cd backend && npm start`; its console logs every request as
`GET /api/... 200 12ms`):

1. Open a board. Within ~30 s the backend logs `GET /api/board/...` again.
2. Tap a departure with a trip → trip screen. For 60 s the backend logs
   `/api/trip?...` every ~30 s and **no** `/api/board/...` lines.
3. Go back → one `/api/board/...` request shortly after (data was stale), then every 30 s.
4. Search a route on the Routes tab, switch to Home for 2 minutes → no
   `/api/journeys` lines while on Home.

If no emulator/device is available, say the manual check was not run.

## Done criteria

- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` 0 errors; `npm run format:check` passes
- [ ] `grep -rn "subscribed: isFocused" app | wc -l` → 3
- [ ] `grep -rn "useIsFocused" app` → imports from `'expo-router'` only
- [ ] Only the 3 in-scope files changed
- [ ] `plans/README.md` status row updated

## STOP conditions

- `useIsFocused` is not exported from `expo-router` in the installed version
  (typecheck error on the import).
- TypeScript rejects `subscribed` on `useInfiniteQuery` / `useQuery`.
- Manual check shows the board shows a loading skeleton (not the old rows)
  after returning from a trip within 5 minutes — report it; do not add
  workarounds.

## Maintenance notes

- An unsubscribed query has no observers, so after `gcTime` (TanStack default
  5 min) its cached data is dropped; returning after that shows the loading
  state once. Acceptable; raise `gcTime` for `['board', …]` if users complain.
- Deferred: each refetch of an infinite query re-fetches every loaded page
  (e.g. a board after three "later" taps makes 4 requests per poll). Fixing it
  needs a structural change (e.g. polling only page one via a separate query),
  not worth it until usage data shows many multi-page sessions.
- Any new polling screen should use the same `subscribed: useIsFocused()` pattern.
