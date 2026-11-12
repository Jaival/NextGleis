# Plan 008 (research spike): Can licensed open data replace or back up the unpermitted planner feeds?

> **Executor instructions**: This is a research task. You write **one
> Markdown file** and change no code. Follow the method, answer every
> question in the template with a source link, and say "not found" rather
> than guess. If anything in "STOP conditions" occurs, stop and report. When
> done, update the status row for this plan in `plans/README.md` — unless a
> reviewer dispatched you and told you they maintain the index.
>
> You need web access (search + fetch). If you have none, STOP.

## Status

- **Priority**: P2 (the long-term answer to the project's biggest risk)
- **Effort**: M (half a day of reading; no code)
- **Risk**: LOW
- **Depends on**: none; can run in parallel with every other plan
- **Category**: direction / research
- **Planned at**: commit `e96b32d`, 2026-11-11

## Why this matters

NextGleis shows live departure boards for German bus and train stops. All of
its data comes from transport networks' public journey planners — 14 HAFAS
endpoints through `hafas-client` and 4 EFA servers — **used without formal
permission** (`THINGS_TO_KNOW.md`, "Permission and reliability"). Deutsche Bahn
blocked the equivalent access to its own planner in 2026. Any network can do
the same, and that region of the app goes dark with no notice. The app is
about to be published on Google Play, which raises its visibility.

Germany also publishes timetable and realtime data under open licences. This
spike finds out whether those sources are good enough to (a) replace the
unpermitted feeds, (b) stand in when one is blocked, or (c) neither — with
evidence, so the decision is made once.

## What the app needs from a source

Read these before judging a candidate:

- `THINGS_TO_KNOW.md` — the networks in use, their gaps, cache lifetimes.
- `backend/types/index.ts` — the response contract (`Station`, `Departure`,
  `Arrival`, `Journey`, `Trip`, `Notice`).
- `backend/api/*.ts` — the six endpoints.

| Capability | Endpoint | Must-have for a replacement? |
| --- | --- | --- |
| Stop search by name | `/api/stations` | Yes |
| Departures for a stop, next ~2 h, **with realtime delay and cancellations** | `/api/board` | Yes — this is the product |
| Line name, product type, direction, planned + actual platform | `/api/board` | Yes (platform: nice to have) |
| Stops near a coordinate | `/api/nearby` | Yes |
| Arrivals | `/api/arrivals` | No |
| Journey planning A→B | `/api/journeys` | No (can stay on the current feeds) |
| Trip details (all stops of one run) | `/api/trip` | No |
| Disruption notices | on boards/journeys | No |

Constraints that shape the answer:

- The backend is **Vercel functions, no database, in-memory cache only**, two
  runtime dependencies. A source that needs a multi-gigabyte timetable import
  or a routing engine means new always-on infrastructure — record that cost,
  it is allowed to be the answer but not to be hidden.
- Free. No per-request fees.
- Coverage must include local buses and trams, not only rail.

## Candidates to check

Leads from plan time — **none of these facts are verified**; verifying them is
the job. Add any better candidate you find.

1. **DELFI Germany-wide GTFS** (DELFI e.V.; distributed via the national
   access point / `opendata-oepnv.de`, mirrored and cleaned by `gtfs.de`).
   Static timetable. Check: licence, registration, update frequency, size.
2. **GTFS-Realtime for Germany** (`gtfs.de` advertises a realtime feed;
   DELFI/Mobilithek may offer one). Check: which operators it really covers,
   delay vs cancellation vs platform data, update interval, licence.
3. **Mobilithek** (`mobilithek.info`, the federal national access point).
   Check: what realtime public-transport offers exist, and whether access
   needs a contract per data provider.
4. **Regional open-data portals** with realtime: MobiData BW (GTFS-RT, TRIAS),
   VBB, VRR/Open Data ÖPNV, MVG/MVV, Bayern (DEFAS / bayerninfo). Check each
   one's licence and whether it has a live departures interface, not just files.
5. **Transitous** (`transitous.org`) — a community-run routing service (MOTIS)
   over open feeds, with a public API. Check: usage policy for third-party
   apps, whether production use is allowed, German realtime coverage, stop
   departures endpoint, rate limits, uptime promises.
6. **Asking for permission** — a non-technical candidate. Check whether any of
   the 18 networks in use publishes an API programme, terms, or a contact for
   third-party developers (e.g. VBB, RMV, VVS, MVV open-data pages). A written
   "yes" from the two or three biggest networks may beat any migration.
7. **TRIAS / VDV 431 interfaces** offered officially by some associations
   (often on request, with a key). Check which associations offer it and on
   what terms.

## Method

1. Read the three repo sources listed above (15 minutes).
2. For each candidate, find the **primary source** (the publisher's own page,
   licence text, API docs). Blog posts and forum threads are leads, not proof.
3. Fill one row of the comparison table per candidate. Every cell gets a
   link or "not found".
4. For candidates that pass on paper (open licence + realtime + local
   transit), do a **small live check** if no registration is needed: fetch
   the feed or endpoint **once or twice**, and compare one busy stop (e.g.
   Frankfurt Hauptwache, Berlin Alexanderplatz, Stuttgart Hauptbahnhof)
   against what the current app backend would show. Report: is there
   realtime? buses/trams? platforms? Keep it to a handful of requests per
   source; identify yourself with a generic client name; do not create
   accounts or accept terms on the owner's behalf.
5. Write the recommendation.

## Deliverable

Create `docs/research/licensed-data-sources.md` (create the `research`
directory). Normal prose, dated, self-contained — other threads will read
only this file. Structure:

```markdown
# Licensed data sources for NextGleis — research note

Date · who/what ran it · commit

## Answer in three sentences
(replace / back up / neither — and the one next step)

## Comparison

| Source | Licence (link) | Attribution / registration / key | Static or realtime | Realtime content (delay, cancel, platform) | Coverage (which regions, local transit?) | Access shape (files / API) | Fits a no-database backend? | Limits / terms for apps | Verified live? |

## Per-candidate notes
(what was checked, what was found, links, what stayed unknown)

## Coverage map against today's 18 networks
(per network in THINGS_TO_KNOW.md: is there a licensed source with realtime? yes / partly / no)

## Options
1. Replace — what it takes (infrastructure, cost per month, effort), what gets worse.
2. Back up — a fallback when a network blocks the app: where it would plug in
   (`backend/lib/`), what the rider would lose in fallback mode.
3. Ask — which networks to write to first, and a short draft request (German).
4. Do nothing — what to monitor instead.

## Recommendation
(one option, why, the first concrete step, and what would change the answer)

## Open questions
```

## Scope

**In scope**: `docs/research/licensed-data-sources.md` (create).

**Out of scope**: any code, any dependency, `THINGS_TO_KNOW.md` (the reviewer
adds a pointer after accepting the note), creating accounts, sending emails,
load-testing any source.

## Git workflow

- Branch: `advisor/008-data-source-research`
- One commit: "Research licensed data sources as an alternative to the planner feeds".
  End with a blank line and `Assisted-by: Claude`.
- Do NOT push or open a PR unless the operator instructed it.

## Done criteria

- [ ] `docs/research/licensed-data-sources.md` exists with every template section filled
- [ ] Every licence claim links to the publisher's own page
- [ ] At least candidates 1, 2, 5 and 6 have a definite finding (not "unclear") or a stated reason why none could be reached
- [ ] The recommendation names one option and one next step
- [ ] `npm run format:check` passes (Prettier checks Markdown)
- [ ] No other file changed
- [ ] `plans/README.md` status row updated

## STOP conditions

- No web access.
- A source requires registration, a contract or accepting terms to see the
  data — record that as a finding; do not register.
- You are about to send more than ~10 requests to one source.

## Maintenance notes

- The note is a snapshot; licences and feeds change. Re-check before building on it.
- Reviewer: challenge any "realtime: yes" that was not verified live, and
  check the infrastructure cost of the "replace" option is stated in euros
  and moving parts, not adjectives.
- Follow-up plans (a fallback source, or permission requests) are written
  only after the owner picks an option.
