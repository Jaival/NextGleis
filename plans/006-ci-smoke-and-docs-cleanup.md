# Plan 006: Smoke test covers every endpoint, docs state the truth, and agents get a Checks section

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e96b32d..HEAD -- .github/workflows/deploy-backend.yml docs/DEVOPS.md AGENTS.md PRODUCT_SPEC.md CLAUDE_CODE_PROMPT.md backend/package.json.test`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none. If plan 002 (app unit tests) is DONE when you start, include its `npm test` in the Checks list (Step 4); otherwise leave it out.
- **Category**: dx / docs
- **Planned at**: commit `e96b32d`, 2026-11-10

## Why this matters

- The post-deploy smoke test hits only 3 of 6 backend endpoints. Route search
  (`/api/journeys`), trip details (`/api/trip`) and arrival boards can break
  in production while the pipeline is green. The Vercel CLI is installed as
  `@latest`, so a CLI release can change deploy behavior without a commit.
- `docs/DEVOPS.md` states things that are false today ("no automated tests",
  "three stateless HTTP handlers"); `PRODUCT_SPEC.md` and
  `CLAUDE_CODE_PROMPT.md` describe the original DB-Timetables / Cloudflare
  design. People and coding agents act on these.
- The project's agent instructions (`AGENTS.md`, included by `CLAUDE.md`) have
  no list of the commands that prove a change is good.
- `backend/package.json.test` is a stale copy of the manifest that lists the
  deliberately removed `@vercel/node`.

## Current state

- `.github/workflows/deploy-backend.yml:66-88` (end of file):

```yaml
        working-directory: backend
        run: |
          npm install --global vercel@latest
          vercel deploy --prod --yes --token="$VERCEL_TOKEN"

      # Check the live backend answers the endpoints the app calls.
      - name: Smoke test
        if: vars.BACKEND_URL != ''
        env:
          BACKEND_URL: ${{ vars.BACKEND_URL }}
        run: |
          check() {
            echo "GET $1"
            curl --fail --silent --show-error --retry 4 --retry-all-errors --retry-delay 10 \
              --max-time 30 "$BACKEND_URL$1" | jq -e "$2" > /dev/null
          }
          check "/api/stations?query=Alexanderplatz" 'length > 0'
          check "/api/nearby?lat=50.107&lon=8.664" 'length > 0'
          check "/api/board/rmv:3000010" 'type == "array"'
          curl --fail --silent --show-error --max-time 30 "$BACKEND_URL/privacy-policy.html" > /dev/null
          echo "Backend OK"
```

- API facts (from `backend/types/index.ts` and handlers):
  - `/api/stations?query=` → array of `{ evaNo: string, name: string, … }`.
  - `/api/board/<id>` → array of departure rows; HAFAS rows may carry `tripId`.
  - `/api/arrivals/<id>` → array (HAFAS stop ids only; `rmv:…` is HAFAS).
  - `/api/trip?id=<tripId>` → object with a `stops` array.
  - `/api/journeys?from=<id>&to=<id>&paged=1` → `{ journeys: [...], earlierRef?, laterRef? }`.
- `docs/DEVOPS.md` wrong lines:
  - `:42-43` "The app only knows three JSON endpoints." (it calls six: stations, nearby, board, arrivals, trip, journeys)
  - `:47` "The backend is three stateless HTTP handlers." (six files in `backend/api/`)
  - `:179-191` quality-gates code block lacks `npm test` in the backend part.
  - `:205-206` "There are no automated tests yet. Until there are, smoke-test on a device before releasing (section 7, step 4)."
  - `:306` CI table row says backend runs "typecheck, `npm audit --omit=dev`" — it also runs `npm test` (see `.github/workflows/ci.yml`, backend job).
  - `:496` backlog row `| No automated tests | Regressions found manually | Start with backend unit tests for normalize.ts, merge.ts, lines.ts |`
- `AGENTS.md` (whole file):

```md
# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.
```

- `PRODUCT_SPEC.md` line 1: `# Transit Board — Product & Technical Spec (Android, MVP)`.
- `CLAUDE_CODE_PROMPT.md` line 1 starts "Read PRODUCT_SPEC.md in this repo fully before writing any code…" (a one-time scaffolding prompt).
- Current data sources and hosting, for the banners: HAFAS networks via
  hafas-client plus four EFA servers, DB Timetables only as a legacy
  fallback; backend on Vercel. Source of truth: `README.md` and `THINGS_TO_KNOW.md`.
- Markdown is not Prettier-formatted (`.prettierignore` has `*.md`); keep the
  existing hand-wrapped style (~80 columns).

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Latest Vercel CLI version | `npm view vercel version` | a version like `NN.N.N` |
| Workflow syntax | `npx --yes @action-validator/cli .github/workflows/deploy-backend.yml` | exit 0 (if the tool can't be fetched, skip and say so) |
| jq filter check (only if `jq` is installed; GitHub's ubuntu runners have it, the planning machine did not) | `echo '[{"tripId":"x"},{}]' \| jq -r 'map(select(.tripId))[0].tripId // empty'` | `x` |
| App checks | `npm run typecheck && npm run lint && npm run format:check` | all pass |

## Scope

**In scope**: `.github/workflows/deploy-backend.yml`, `docs/DEVOPS.md`,
`AGENTS.md`, `PRODUCT_SPEC.md` (banner only), `CLAUDE_CODE_PROMPT.md` (banner only),
`backend/package.json.test` (delete).

**Out of scope**:
- `CLAUDE.md` — it only includes `AGENTS.md`; edit `AGENTS.md`.
- Rewriting the body of `PRODUCT_SPEC.md` / `CLAUDE_CODE_PROMPT.md` — history; banner only.
- `.github/workflows/ci.yml`, `release.yml` — unchanged.
- `Timetables-1.0.274.json` — vendored reference spec, keep.

## Git workflow

- Branch: `advisor/006-ci-smoke-docs`
- Commits: one for the workflow, one for docs/cleanup. Plain imperative
  messages, e.g. "Smoke-test journeys, trips and arrivals after a backend
  deploy". End each with a blank line and `Assisted-by: Claude`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Pin the Vercel CLI

Run `npm view vercel version`; take its major number `N`. Replace
`npm install --global vercel@latest` with `npm install --global vercel@N`
(major pin: security fixes still arrive; breaking releases don't). Add a
one-line comment above it saying why it's pinned.

**Verify**: `grep -n "vercel@latest" .github/workflows/deploy-backend.yml` → no matches.

### Step 2: Extend the smoke test

After the existing `check "/api/board/rmv:3000010" ...` line, add:

```bash
          check "/api/arrivals/rmv:3000010" 'type == "array"'

          # A route between two stops found by search, so no stop id is hard-coded twice.
          get() {
            curl --fail --silent --show-error --retry 4 --retry-all-errors --retry-delay 10 \
              --max-time 30 "$BACKEND_URL$1"
          }
          from=$(get "/api/stations?query=Frankfurt%20Hauptwache" | jq -r '.[0].evaNo')
          to=$(get "/api/stations?query=Frankfurt%20Hbf" | jq -r '.[0].evaNo')
          check "/api/journeys?from=$(jq -rn --arg v "$from" '$v|@uri')&to=$(jq -rn --arg v "$to" '$v|@uri')&paged=1" '.journeys | type == "array"'

          # Trip details for any departure on the board that has one.
          trip=$(get "/api/board/rmv:3000010" | jq -r 'map(select(.tripId))[0].tripId // empty')
          if [ -n "$trip" ]; then
            check "/api/trip?id=$(jq -rn --arg v "$trip" '$v|@uri')" '.stops | length > 0'
          else
            echo "No departure with a trip id right now; skipping /api/trip"
          fi
```

Keep indentation consistent with the surrounding `run: |` block (10 spaces).
The `check` function must stay defined before these lines.

**Verify**:
- `grep -c "check \"/api/" .github/workflows/deploy-backend.yml` → `6` or more
- Workflow validator (see commands) → exit 0, or state it was skipped.
- Optional, if network allowed and the backend runs locally (`cd backend && npm start`):
  copy the `run:` body into a temp script with `BACKEND_URL=http://localhost:3000`
  and run it → ends with `Backend OK`. Delete the temp script afterwards.

### Step 3: Correct `docs/DEVOPS.md`

1. `:42-43` → "The app knows six JSON endpoints (stations, nearby, board,
   arrivals, trip, journeys)." keeping the sentence that follows.
2. `:47` → "The backend is six stateless HTTP handlers." (rest of paragraph unchanged).
3. Quality-gates block (`:179-191`): add `npm test                    # node:test unit tests`
   after `npm run typecheck` in the `cd backend` part. If plan 002 is DONE,
   also add `npm test` after `npm run typecheck` in the app part.
4. `:205-206` → "Backend unit tests run in CI (`backend/test/`). The app's
   screens have no automated tests, so smoke-test on a device before
   releasing (section 7, step 4)." (If plan 002 is DONE, say "the app's
   screens" stays true; its `lib/` helpers are tested.)
5. `:306` CI row: backend part becomes "typecheck, unit tests, `npm audit --omit=dev`".
6. `:496` backlog row → `| No UI tests | Screen regressions found manually | Unit-test logic extracted to lib/; consider component tests later |`.

**Verify**: `grep -n "no automated tests\|No automated tests\|three stateless\|three JSON" docs/DEVOPS.md` → no matches.

### Step 4: Add a Checks section to `AGENTS.md`

Append after the existing content:

```md
## Checks

Run before every commit. CI runs the same.

App (repo root):

    npm run typecheck
    npm run lint
    npm run format:check
    npx expo install --check

Backend (`backend/`):

    npm run typecheck
    npm test
    npm audit --omit=dev --audit-level=high

## Where to read first

- `README.md` — architecture and scripts
- `THINGS_TO_KNOW.md` — data-source limits and decided trade-offs
- `docs/ROADMAP.md` — what's next
- `PRODUCT_SPEC.md` and `CLAUDE_CODE_PROMPT.md` are historical; don't follow them.
```

If plan 002 is DONE, add `npm test` after `npm run typecheck` in the app list.

**Verify**: `grep -n "## Checks" AGENTS.md` → 1 match.

### Step 5: Mark historical docs and delete the stale manifest

1. Insert at the top of `PRODUCT_SPEC.md` and `CLAUDE_CODE_PROMPT.md`:

```md
> **Historical.** This was the original MVP brief. The app now gets its data
> from HAFAS networks (hafas-client) and four EFA servers, with DB Timetables
> only as a legacy fallback, and the backend runs on Vercel. See `README.md`
> and `THINGS_TO_KNOW.md` for how it works today.

```

2. `git rm backend/package.json.test`.

**Verify**: `head -1 PRODUCT_SPEC.md CLAUDE_CODE_PROMPT.md` → both start with `> **Historical.**`;
`git ls-files backend/package.json.test` → empty;
`npm run typecheck && npm run lint && npm run format:check` → pass (sanity; nothing code-related changed).

## Test plan

No unit tests. Verification is the workflow check in Step 2 and the greps.
The real proof is the next run of "Deploy backend" in GitHub Actions — the
operator should watch it after merge.

## Done criteria

- [ ] `grep -n "vercel@latest" .github/workflows/deploy-backend.yml` → no matches
- [ ] Smoke test covers stations, nearby, board, arrivals, journeys, trip (`grep -n "/api/" .github/workflows/deploy-backend.yml`)
- [ ] `grep -n "no automated tests\|No automated tests\|three stateless\|three JSON" docs/DEVOPS.md` → no matches
- [ ] `AGENTS.md` has a `## Checks` section
- [ ] Both historical docs carry the banner; `backend/package.json.test` deleted
- [ ] Only in-scope files changed
- [ ] `plans/README.md` status row updated

## STOP conditions

- `deploy-backend.yml` smoke step differs from the excerpt.
- The local smoke run (if attempted) shows `/api/journeys` or `/api/trip`
  failing — that is a real backend bug; report it, don't loosen the check.
- `docs/DEVOPS.md` line contents differ from the listed quotes.

## Maintenance notes

- New endpoints must get a smoke-test line in `deploy-backend.yml`.
- The journeys check depends on "Frankfurt Hauptwache" and "Frankfurt Hbf"
  resolving via RMV. If RMV ever drops out (see `THINGS_TO_KNOW.md`), switch
  to a pair in another network.
- Bump the pinned Vercel CLI major deliberately, after reading its changelog.
