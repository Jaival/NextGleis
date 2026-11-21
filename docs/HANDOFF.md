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
- Matrix thread (branch `feat/ui-skins-phase-5-matrix`, 2026-11-21), Pixel_8_Pro
  emulator, local backend. Fixed with components only: the search placeholder
  stays on one line with an ellipsis at a large font (a one-line `Text` draws
  it, the native hint is transparent); the board destination (departures and
  arrivals) takes two lines; on the connection screen the stop name and the
  "departs HH:MM" text are two lines, so the time is never cut; trip rows grow
  with the font and `getItemLayout` is gone (decision 4: at 2.0× the stop name
  and platform clipped at height 64). Seen on the device after the fix: the
  placeholder in Netzplan light and dark and in Anzeiger at 1.5×; the board
  destination and arrivals in Anzeiger at 1.5×; the connection card in Anzeiger
  at 1.5×; trip rows in Netzplan at 1.5× and 2.0× (jump to the own stop works).
  Not re-seen after the fix: Bahnsteig for the board and connection changes.
- Matrix cells seen in this thread: exactly 130 % (font scale 1.3, set with
  `adb shell settings put system font_scale 1.3`) on Bahnsteig, Netzplan and
  Anzeiger; a three-digit platform (Stuttgart Hbf, "101", "102") in the tile
  at 1.3× (Bahnsteig), 1.5× (Anzeiger, Netzplan); Settings at a large font in
  Netzplan (1.3×) and Anzeiger (1.5×); search at a large font in Bahnsteig
  (1.3×) and Anzeiger (1.5×); high contrast in German at 1.3× on Netzplan
  light, Bahnsteig light and Anzeiger (Settings, Home, board, connection);
  German at 1.5× on Netzplan dark (Settings, Home, board, connection); trip rows
  at a large font in Bahnsteig (1.3×) and Netzplan (1.5×, 2.0×); two live cards
  on Home at 1.5× with one delayed ride (amber countdown) in Netzplan dark.
- All 165 older captures (132 in `D:/t3/shots-p5/matrix/`, 33 in
  `docs/design/screens/`) were viewed as contact sheets, four shots per sheet at
  448 px wide: enough for layout, clipping and colour, not for one-pixel detail.
  9 new screenshots were added to `docs/design/screens/`.

## NOT done — needs an emulator

Plan 009 phase 5 stays **IN PROGRESS**: the whole matrix in the plan (five
appearances, high contrast off and on, every screen) is not seen. Missing:

- High contrast on: search results, Settings, onboarding and the board's
  Arrivals tab are not captured in any appearance (Home, board departures,
  trip, Routes and connection are, in all five). High contrast at a large font
  only in German (see above), not in English.
- Arrivals tab: seen once after the change (Anzeiger, 1.5×). Not seen in
  Bahnsteig or Netzplan.
- Onboarding at a large font and in German is not captured (normal font only).
- A live card whose first ride is cancelled: by design `nextJourney` skips
  cancelled connections, so the card shows the next one. The cancelled
  connection itself was seen in the Routes list. A delayed card was seen.
- Screen readers (TalkBack) with the new search placeholder were not tried.
  The `TextInput` keeps `placeholder` and `accessibilityLabel`; the visible
  overlay is hidden from accessibility.
- Seen once, not repeated: after a scroll on Home with two saved routes the
  second live card was blank in one screenshot; later runs (cold start,
  scroll) showed it. Most likely a layout animation caught mid-way.
- The ROUTES heading on Home touches or is touched by the card in a few old
  captures (Netzplan, 1.24×; German). Not seen after the layout settles; the
  cause is the card height change when its live row loads (reflow animation).
- The device was left on the font size "large" (1.0). The app was left on
  Anzeiger, English, high contrast off, with two saved routes (Frankfurt Hbf to
  Darmstadt Schloss, Darmstadt Hbf to Böllenfalltor) and Deutschlandticket mode
  off. The original app settings are unknown.

## What is next

1. Someone with an emulator closes the gaps above (mostly high contrast on
   Settings, search, onboarding and Arrivals) and sets the Phase 5 row to DONE.
   If the owner accepts the matrix as seen, say so in the PR and set it then.
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
4. **Trip rows have a fixed height (64)** — done in the matrix thread. At 2.0×
   the stop name and platform clipped, so rows are `minHeight` 64 and grow, and
   `getItemLayout` is dropped. `onScrollToIndexFailed` scrolls near the row and
   retries once.
5. **Pull-to-refresh spinner** — show it only when the rider pulls down, not on
   every background or focus refetch (`refreshing={isRefetching}`). UI only, no
   query change. A small PR from `main` after the chain merges (roadmap 2.14).
6. **Merge order** — hold the merge of #21 until the device matrix is done and
   Phase 5 is DONE. Then merge #21 to #25 bottom-up, then do items 1 and 5.

## Brief for the matrix thread (used; kept for the next run)

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
