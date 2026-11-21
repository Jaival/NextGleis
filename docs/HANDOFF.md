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
- Phase 5 fixes: trip time column grows with the font (`minWidth`), the rail
  line through the rider's own stop is visible on the highlight fill, the
  countdown column has a fixed width and shrinks its text instead of widening
  (so "JETZT" in Anzeiger does not make a row jump), the line bar and the
  search field grow with the font, and the typed text in the search field no
  longer keeps Plex Mono after a skin switch. The first three came from reading
  code, the rest from the emulator.
- Phase 5 device check, two runs on the Pixel_8_Pro emulator with the local
  backend. Captured: Home, search, board, trip, Routes, a connection with 2
  changes, Settings and onboarding in all five appearances; high contrast on
  five screens in all five; German; the system font at 1.24× and 1.5× in all
  five; Home with a saved station in four. 33 screenshots are in
  `docs/design/screens/` (English, normal font, plus three large-font or German
  ones). About 250 were taken; the rest are only on the machine of that run
  (`D:\t3\shots-p5\`), not in the repo.
- The agent looked at a subset by eye, not every captured shot. "Captured" is
  not "checked".
- confirmed on the emulator with one live card on Home (one saved route): the backend log showed 2 `/api/journeys` requests in 130 s with Home in view and 0 in 130 s with Settings in view. That is one request per card per minute, none off screen. Cards with several routes, and the 'Later' case, were not measured.
- Docs: roadmap rows 2.11 and 2.12, README features, plan and plan index rows.

## NOT done — needs an emulator

Plan 009 phase 5 stays **IN PROGRESS**. Not done:

- Looking through the captured shots that nobody viewed, and the rest of the
  matrix: a live card with a delayed or cancelled ride; a three-digit
  platform ("103") in the tile; Settings and search results at a large font;
  high contrast in German on the light skins and at a large font; German at a
  large font; the trip row at a large font in Bahnsteig and Netzplan.
- The system font at exactly 130 % (1.24× and 1.5× were tested, which bracket
  it).
- Found, not fixed, owner decides: the Netzplan search placeholder wraps to a
  second line (cut) at 1.24× and above; at 1.24× and 1.5× the Anzeiger board
  destination is cut to about two words, and the yellow card on the connection
  screen loses "departs 17:24" to an ellipsis. A two-line destination changes
  row heights.
- The device was left on the font size "large" (1.0), the app on Bahnsteig
  light, English, high contrast off. The original app settings are unknown.

## What is next

1. Someone with an emulator finishes the matrix, fixes what shows up with
   tokens or components (never `theme.skin` in a screen), saves the remaining
   screenshots and sets the Phase 5 row to DONE.
2. Merge the chain bottom-up (#21 first) once it is checked.
3. Batch H items below still apply to the next EAS build.

## Decided (2026-11-21)

1. **Routes time reset** — do it: tapping a saved route on Home opens Routes
   with "leave now" (`setTripTime(LEAVE_NOW)` when the route params apply).
   Not in plan 009. A small PR from `main` after the chain merges (roadmap 2.13).
   Why: after "arrive by 18:00" the Routes list has another query key than
   the Home card and is not there at once.
2. **Polling after "Later"** — accepted for now. After "Later" the infinite
   query refetches every loaded page, so Home sends more than one request per
   minute for that route until the cache is dropped. It needs a deliberate
   press and happens only while Home is in view. A real fix changes the query
   setup and needs its own plan.
3. **Live card about 40 dp taller than a plain one** — accepted. Mixed heights
   in a vertical list are normal. Revisit if the rest of the matrix shows a
   problem.
4. **Trip rows have a fixed height (64)** for `getItemLayout` — kept until a
   device shows clipping at a large font. Then drop `getItemLayout` (trip lists
   are short).
5. **Pull-to-refresh spinner** — show it only when the rider pulls down, not on
   every background or focus refetch (`refreshing={isRefetching}`). UI only, no
   query change. A small PR from `main` after the chain merges (roadmap 2.14).
6. **Merge order** — hold the merge of #21 until the device matrix is done and
   Phase 5 is DONE. Then merge #21 to #25 bottom-up, then do items 1 and 5.

## Brief for the matrix thread (paste into a new thread, Opus)

Finish plan 009 phase 5: the device matrix in `docs/HANDOFF.md` ("NOT done").
Branch from `feat/ui-skins-phase-5`. Fix what shows up with tokens or
components only, never `theme.skin` in a screen. No change to query keys,
polling intervals or navigation targets. Save screenshots to
`docs/design/screens/`. Set the Phase 5 row to DONE only when the whole matrix
is seen. Run all AGENTS.md Checks, push, update the PR.

Setup that worked (Windows, Pixel_8_Pro emulator, Android 17):

1. `device_list`, then `device_open` with the `hostId` and device `id`. If it
   answers `DEVICE_IN_USE`, stop and ask the owner. Never close another session.
2. Backend: `npm start` in `backend/` (port 3000). Metro: `npm start` in the repo
   root (port 8081). The app falls back to `http://10.0.2.2:3000`.
3. Port forwards (adb only for these): `adb -s emulator-5554 reverse tcp:8081
   tcp:8081` and the same for 3000. Remove only those two at the end. Never
   `adb reverse --remove-all`.
4. Open the dev client with the deep link
   `exp+nextgleis://expo-development-client/?url=http://localhost:8081`. The first
   bundle takes about 15 s and may show a blank screen.
5. Drive the UI with the `agent-device` command from `device_open` only:
   `snapshot -i`, `press @ref --settle`, `screenshot <file>`, `back`,
   `settings text-size <medium|large|extra-large|extra-extra-large|accessibility-medium>`
   (1.0 is "large"; 130 % is between "extra-large" 1.12 and "extra-extra-large" 1.24).
   Onboarding opens with `agent-device open com.nextgleis.app nextgleis://onboarding`.
6. Wait 6 s after a screen opens before a screenshot: the pull-to-refresh
   spinner of an old refetch can sit in the picture. Retake until clean.
7. Poll check: count `api/journeys` lines in the backend log, with the number of
   cards on screen written down this time.
8. At the end: stop Metro and the backend, remove the two forwards, set the
   font back to "large", and note the app settings you left.

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
