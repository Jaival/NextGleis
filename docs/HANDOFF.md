# Handoff — new UI, plan 009 (phases 1–5)

Date: 2026-11-21. Plan: `plans/009-ui-skins-redesign.md` (its handoff log has
the per-phase details). One layout ("Bahnsteig"), three skins (Bahnsteig,
Anzeiger, Netzplan). PR chain, all open and stacked:
#21 phase 1 → #22 phase 2 → #23 phase 3 → #24 phase 4 → phase 5 (this branch).
The older note for the launch-work batches (plans 001–008) follows below.

## What is done

- Phase 1: skin system (tokens, palettes, fonts, Settings picker). The five
  colour themes and three styles are gone.
- Phase 2: building blocks (`PlatformTile`, `Countdown`, `LineBar`,
  `SignHeader`, pure helpers) with tests.
- Phase 3: every screen rebuilt on them.
- Phase 4: saved routes on Home show the next departure, its platform and a
  countdown (first three routes, one search per minute each).
- Phase 5 (code reading only, no device): trip time column grows with the
  font (`minWidth`), the rail line through the rider's own stop is visible on
  the highlight fill, the countdown column has a fixed width and shrinks its
  text instead of widening, so "JETZT" in Anzeiger does not make a row jump.
  Docs: roadmap rows 2.11 and 2.12, README features, plan and plan index rows.

## NOT done — needs an emulator

Plan 009 phase 5 stays **IN PROGRESS**. Not done:

- The device matrix: five appearances (Bahnsteig light and dark, Anzeiger,
  Netzplan light and dark), each with high contrast off and on, over Home,
  search, board, trip, Routes, connection (use a night connection Frankfurt
  Hbf → Darmstadt Schloss for a tight change), Settings and onboarding.
- German once, and the system font at 130 % once.
- The screenshots: `docs/design/screens/<skin>-<screen>.png` for Home, Routes
  results and the connection screen. None exist.
- The Phase 4 verify step: the backend log shows one `/api/journeys` per saved
  route per minute while Home is in view, and none while another tab is open.
- The "not seen" lists in the plan's handoff log for phases 3 and 4 (shadows on
  clipping cards, "17 Ost" / "103" / "AUSSTIEG" in the tile, board rows at
  130 %, status-bar icons on the Netzplan light header and onboarding, the
  yellow card with a delayed or cancelled ride, a live card at 130 % and in
  German).

## What is next

1. Someone with an emulator runs the matrix, fixes what shows up with tokens
   or components (never `theme.skin` in a screen), saves the screenshots and
   sets the Phase 5 row to DONE.
2. Merge the chain bottom-up (#21 first) once it is checked.
3. Batch H items below still apply to the next EAS build.

## Open decisions (owner)

1. **Reset the chosen time when a saved route opens from Home.** `routes.tsx`
   keeps a time the rider picked. After "arrive by 18:00", tapping a saved
   route on Home opens Routes with that time, so its list is another query key
   than the Home card's (`when: null`) and is not there at once. A reset
   (`setTripTime(LEAVE_NOW)` when the route params apply) is one line, but the
   rider loses the time without a warning, and plan 009 forbids changing
   Routes behaviour in Phase 5. Left as is.
2. **Polling after "Later".** If the rider pressed "Later" on Routes for a
   saved route, the infinite query refetches every loaded page, so Home sends
   more than one request per minute for that route until the cache is dropped.
3. **A live card is about 40 dp taller than a plain one** (caption row plus a
   countdown), so a list can mix heights. A fix means a new card layout; it
   needs a device to judge.
4. **Trip rows have a fixed height (64)** for `getItemLayout`. At a 130 % font
   the stop name and the platform line may not fit; the time stack (about
   44 dp) does. Not seen on a device.

---

# Handoff — launch-work batches A–D (plans 001–008)

Date: 2026-11-12. Orchestrator and reviewer: Claude (Opus 5.5). Workers:
Sonnet-class subagents, one per batch. Plans and batch order:
`plans/README.md`.

Shipped as one PR per batch. The deploy workflow shipped the backend on the
merges of #15, #14 and #17 (all three runs green, smoke test included); no EAS
build ran.

## What is done

| Plan | Title | Batch | Status |
| --- | --- | --- | --- |
| 001 | Backend cache dedupes in-flight work, stays bounded, CDN serves repeats | A | Done |
| 005 | Malformed remark / slow upstream can't break or hang a response | A | Done |
| 002 | App unit test suite for pure `lib/` logic, in CI | B | Done |
| 004 | Stop polling screens that are not in view | B | Done |
| 003 | Fix four small app UI bugs | B | Done |
| 007 | Error reporting with EAS Observe, opt-out switch, privacy policy, data-safety answers | B | Done |
| 006 | Smoke test all endpoints, fix docs, add agent Checks section | C | Done |
| 008 | Research: licensed open data as replacement or backup | D | Done |

Device checks, the CDN check and the Observe dashboard check are **not** done;
see "Batch H" below.

## Pull requests

| PR | Branch | Content | State |
| --- | --- | --- | --- |
| #15 | `batch/b-app` | `plans/`, plans 002, 004, 003, 007, Expo SDK 57 patch update | Merged first (it carries the Expo update the other PRs' CI needed) |
| #14 | `batch/a-backend` | Plans 001, 005 | Merged |
| #16 | `batch/d-research` | Plan 008 note + `THINGS_TO_KNOW.md` pointer | Merged |
| #17 | `chore/mit-license` | MIT licence | Merged |
| — | `batch/c-ci-docs` | Plan 006, review fix, `plans/README.md` status rows, this note | PR open (rebased on `main` after the four merges) |

`batch/integration` was the local branch where all batches were merged and
checked together before the PRs; it is not pushed and can be deleted. Local
worktrees can be removed with `git worktree remove`:
`D:\Projects\NextGleis-a-backend`, `-b-app`, `-c-ci-docs`, `-d-research`,
`-integration`, `-license`.

## Review notes

- **A**: diff within the plans' scope lists. `cached()` now shares in-flight
  promises, drops failures, caps at 5,000 entries; every handler sets
  `Vercel-CDN-Cache-Control` on success only; `/api/stations` rejects queries
  over 100 characters; EFA and DB requests use `AbortSignal.timeout`; DB API
  errors no longer leak 401/403 to clients.
- **B**: diff within scope. Deviation accepted: the test files carry
  `/// <reference types="node" />` because `tsconfig` does not load
  `@types/node`; the plan's `tsconfig` change alone did not typecheck.
- **Plan 007 checks**: `Observe.configure` is called with `dispatchingEnabled`
  only; no router integration, `logEvent`, network traces or `sampleRate`; no
  stop id, name or coordinate reaches an Observe call; the privacy policy text
  matches the plan word for word (dated November 12, 2026). Default is on;
  Settings → Privacy → "Send error reports" turns it off.
- **C**: two small review fixes made by the reviewer (`b2a6b08`): a line break
  lost in the new smoke-test `curl` call, and "unit tests" added to the app
  half of the CI table in `docs/DEVOPS.md`.
- **D**: done in the orchestrator thread. Eight live requests to Transitous,
  one HEAD to gtfs.de; no accounts, no accepted terms.

## Check results on `batch/integration`

| Check | Result |
| --- | --- |
| App `npm run typecheck` | Pass |
| App `npm test` | Pass, 27/27 |
| App `npm run lint` | 0 errors, 1 warning (`no-console` in `scripts/sync-app-version.mjs`, pre-existing) |
| App `npm run format:check` | Pass |
| App `npx expo install --check` | Pass, after the owner-approved patch update (`3f3c6da`); it failed before, also on `advisor/plans` |
| App `npx expo-doctor` | Pass, 21/21 |
| Backend `npm run typecheck` | Pass |
| Backend `npm test` | Pass, 54/54 |
| Workflow syntax (`deploy-backend.yml`) | Validated by the C worker with `@action-validator/cli` |

Not run: the deploy smoke test (needs a deploy); `npm audit`.

## What is next

1. Merge the batch C PR.
2. Batch H (below). The new privacy policy is live since the #15 deploy, so a
   build with `expo-observe` may now go to the store.
3. Plan 008 follow-up: owner picks an option; then a plan is written for it.

## Open decisions

Decided on 2026-11-12: Expo patch update done (in #15); the code is licensed
MIT (#17), which meets Transitous's open-source rule; one PR per batch.

1. **Commercial or not**: affects Transitous and RMV terms.
2. **Permission requests**: send the German draft in the research note to VBB,
   RMV and NVBW; apply for an RMV API key.

## Batch H — owner only, still open

1. `eas env:set` for `EXPO_PUBLIC_API_BASE_URL` (roadmap 0.1).
2. The backend is deployed. Check `x-vercel-cache: HIT` on a repeated request
   within 25 s (plan 001).
3. `eas build --platform android --profile preview`; on a device run:
   - plan 004: backend request log shows board, trip and routes polling stop
     off screen;
   - plan 003: checks A–D, including the German direction-filter string on a
     small screen;
   - plan 007: the "Send error reports" switch, and optionally a forced render
     error to see the error screen.
4. Confirm sessions arrive under expo.dev → project → Observe, and that turning
   the switch off stops new sessions.
5. Play Console: Data safety form from `docs/DATA_SAFETY.md`, screenshots
   (DE + EN), feature graphic (roadmap 0.5).
6. Delete the unused root `.env`.
