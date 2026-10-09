# Things to know — HAFAS and EFA data sources

Search, departure boards, and the Routes tab get their data from the public
journey planners of German transport networks, mostly through the open-source
[hafas-client](https://github.com/public-transport/hafas-client) library, plus
four regional EFA (Elektronische Fahrplanauskunft) deployments that fill
HAFAS's one real coverage gap — see "EFA networks" below. This page covers the
limits and caveats of both. The HAFAS network list and region rules live in
`backend/lib/hafas/networks.ts`; the EFA ones in `backend/lib/efa/networks.ts`.

## Networks in use

RMV, NVV, VBB, VBN, VOS, VSN, NAH.SH, INSA, VMT, RSAG, AVV, Saarfahrplan,
S-Bahn München and INVG. All of them were checked live in September 2026.

Left out:

| Network | Why |
| --- | --- |
| `db` | DB shut down its HAFAS planner; the host no longer resolves. |
| `vrn`, `mobil-nrw` | Their servers no longer exist (the hosts don't resolve). |
| `bvg` | A subset of VBB. |
| `db-busradar-nrw` | Only DB's buses in NRW, with incomplete boards. |
| `kvb` | Reads a TLS certificate from disk when it loads, which broke in testing. AVV already covers Köln. |

## Coverage gaps

- **Baden-Württemberg and most of Bavaria** have no working network in the
  HAFAS library itself. Stops there come from networks that also list the rest
  of Germany, but only with trains. For example, without EFA, Stuttgart Hbf
  would show only S-Bahn, regional and long-distance trains, no buses or trams.
  The Stuttgart, Karlsruhe, Munich and Nürnberg metro areas now get their buses
  and trams from EFA instead — see "EFA networks" below. The rest of both
  states (Freiburg, Ulm, Augsburg, and everywhere not near one of those four
  cities) still has the HAFAS-only, rail-only gap.
- Munich (S-Bahn München), Ingolstadt (INVG), NRW (through AVV), Hamburg
  (through NAH.SH), Saxony (through INSA) and the other covered regions include
  local buses and trams.
- Each network's area is a rough rectangle rather than a real border. Near the
  edge of a region, a stop can end up with its neighbouring network. That
  usually doesn't matter, because neighbours carry each other's cross-border
  lines.

## EFA networks (Baden-Württemberg, Bavaria)

- **VVS** (Stuttgart), **KVV** (Karlsruhe), **MVV** (Munich) and **VGN**
  (Nürnberg) — each operator's own EFA "rapidJSON" interface, found through the
  [transport-apis](https://github.com/public-transport/transport-apis)
  registry (the same project hafas-client's maintainer runs) and confirmed
  live. A statewide EFA-BW endpoint exists too, but it's missing from that
  registry and its XML interface is due to retire at the end of 2027, so these
  four metro operators' own servers are the only verified-working source for
  now.
- **Scope is stop search and the departure board only** — the same two things
  HAFAS started with. No arrivals, no "nearby" (coordinate-based search), no
  trip planning, and no disruption notices on EFA boards yet. See
  `docs/ROADMAP.md` for what's left.
- **Permission is the same open question as HAFAS's**, not a cleaner one. A
  statewide EFA-BW dataset on MobiData BW carries an open
  Datenlizenz-Deutschland-2.0 license, but the four servers actually used here
  are the regional operators' own, reached the same way the HAFAS networks
  are: publicly, without a published terms-of-use statement for third-party
  use.
- **An EFA result always wins a same-stop duplicate from a HAFAS fallback
  network.** Search merges both sources' candidates, and inside an EFA
  network's own region (`ownerOfEfa` in `backend/lib/efa/networks.ts`) its
  result replaces the thinner HAFAS one regardless of either source's own
  area-ranking — that's the entire reason these four were added. Outside those
  four areas, nothing changes.
- **EFA timestamps are UTC**, unlike HAFAS's, which already carry the
  Europe/Berlin offset. `backend/lib/efa/normalize.ts` converts with
  `Intl.DateTimeFormat` rather than a string slice, so it stays correct across
  the DST change.
- **MVV's live data can lag.** Its own `XML_SYSTEMINFO_REQUEST` reports a
  validity window (`validity.to`) that has been observed in the past —
  departure-monitor requests for "now" fail with EFA's "invalid date" system
  message until MVV rolls the window forward. The board request still
  degrades cleanly (an upstream error or an empty board, not a crash); this
  is the operator's own data lag, not something the app's code can fix.
- **A departure-monitor response always sends both the current and the
  planned platform name** (`platformName` / `plannedPlatformName`), identical
  when nothing changed — unlike HAFAS, which only sends a planned value when
  it differs. `changedPlatform` in `backend/lib/efa/normalize.ts` does that
  comparison itself, extracting the bare platform number from each (EFA's
  platform names are pre-formatted German text like "Gleis 3"; the app
  localizes and formats that itself, so the raw number is what gets stored).

## Route times and earlier/later connections

- `/api/journeys` takes `when` (an ISO instant) with `arrival=1` for "arrive
  by", or `earlier`/`later` with a ref from a previous page. The app sends
  `paged=1` and gets `{ journeys, earlierRef, laterRef }`. Without `paged=1`
  the response is still the bare array, so app versions from before this keep
  working.
- A page ref is the issuing network's own continuation context, so it's
  prefixed with that network (`rmv:3|OF|…`), and a step to earlier or later
  connections goes back to that one network only.
- Times are picked and shown in Berlin time, whatever zone the phone is in, to
  match the timetable times everywhere else in the app.
- Earlier and later load one at a time: starting one page fetch would cancel
  the other.

## Later departures and trip details

- `/api/board` and `/api/arrivals` take `when` as Berlin wall-clock time
  (`2026-10-09T16:00`) and return the two hours from there. "Later
  departures" asks for the window starting at the last row's minute.
- A window that starts at 16:00 also lists trains planned a little earlier but
  running late, so pages are merged (deduplicated, then sorted again) rather
  than appended.
- EFA boards are capped at 40 results, which is only about 20 minutes at
  Stuttgart Hbf. "Later departures" works there too (EFA's own `itdDate` /
  `itdTime`).
- Trip details are HAFAS only: board rows carry a `tripId` (prefixed with the
  network, like stop ids) and `/api/trip` returns every served stop. EFA rows
  have no `tripId`, so they aren't tappable.
- A trip's stop ids are in the network that served the board, which isn't
  always the stop's owner. Tapping one opens its board, which re-points at the
  owning network as usual.

## Direction filters

- Long-press a line chip on a departures board to hide single directions of
  it. They're saved on the favorite (`hiddenDirections`) by line and
  destination name, or kept for the visit on a station that isn't a favorite.
- Departures only: an arrival row has an origin, not a direction.
- The match is by name, so if a network renames a destination, that filter
  stops matching and the direction shows again.

## Deutschlandticket mode

- A setting that leaves out ICE, IC/EC, night trains and FlixTrain.
- Boards filter in the app, by line category (`needsLongDistanceTicket` in
  `lib/product.ts`).
- Routes ask HAFAS to leave those products out (`regional=1`), so the five
  results are all usable rather than filtered down afterwards. Every network
  names its products differently; the list per network is
  `LONG_DISTANCE_PRODUCTS` in `backend/lib/hafas/networks.ts`. The app also
  drops any journey with a long-distance leg the network filed under a
  regional product.
- The few IC routes that accept the ticket in some regions are hidden too:
  the app goes by category, not by route.

## Permission and reliability

- These are the networks' public journey-planner feeds, used without formal
  permission. hafas-client says so openly: strictly speaking, permission is
  needed.
- DB blocked the equivalent access to its own planner (db-vendo-client) in
  2026. Any of these networks could start refusing requests the same way.
- If one network fails, search keeps working with the others. Where the network
  that covers a spot doesn't answer, another network's copy of the stop stands
  in.
- The backend caches results to keep traffic to the networks low: search for 5
  minutes, boards for 25 seconds, routes for 60 seconds, and stop positions for
  a day.

## Disruption notices

- Boards and routes ask the networks for remarks. Only `warning` (construction,
  diversions) and `status` (stop cancelled, extra service) remarks are passed
  on; the many fixed `hint`s (bicycles, wheelchairs, fare zones) are dropped in
  `backend/lib/hafas/remarks.ts`.
- A warning is usually attached to every departure of the lines it affects, so
  the app shows warnings once, in a banner at the top of the board, and keeps
  only `status` remarks on the rows.
- How much each network reports varies a lot: RMV attaches long construction
  notices, VBB almost none.

## Platform changes

- A departure carries `plannedPlatform` only when realtime moved it. Sector
  letters don't count: `13` and `13D-F` are the same platform.

## Nearby stops

- `/api/nearby?lat=&lon=` asks the network that owns the area, then the first
  fallback network. Results are within 800 m.
- In Baden-Württemberg and most of Bavaria only rail stations come back (see
  coverage gaps above).
- The app rounds the position to about 100 m before sending it.

## User agent

- Every request to a network carries a user agent that identifies the app. It
  defaults to `NextGleis (https://github.com/Jaival/NextGleis)`.
- You can override it with the `HAFAS_USER_AGENT` environment variable (see
  `backend/.env.example`).
- Don't use a bare name: VBB rejects `NextGleis` and `nextgleis` with an HTML
  error page. It seems to reject user agents that look like an unnamed script;
  anything with a URL or contact address in brackets gets through.
- Nothing needs fixing for the app to work: the default already passes.
- For the deployed backend, set your own value in the Vercel project, under
  Settings → Environment Variables, or with
  `vercel env add HAFAS_USER_AGENT production`, and then redeploy. For
  example: `NextGleis/1.0 (https://github.com/Jaival/NextGleis)`.
  - Include a URL or a contact address, so a network that sees unusual traffic
    can reach you rather than block it.
  - A dedicated inbox is better than a personal address.
- After changing it, search for "Alexanderplatz". A VBB result means the
  new value is accepted. If Berlin stops go missing, VBB is rejecting it.

## DB credentials are optional

- `DB_CLIENT_ID` and `DB_API_KEY` (the DB Timetables API) are only a fallback.
  They're used for stations saved in older app versions when no network can
  place the station's DB number.
- Without the credentials, those rare stations show an error instead of a
  board.

## Speed

- Long routes are slow upstream: Frankfurt Konstablerwache → Kiel took about 8
  seconds.
- A route between two networks can try both networks, matching both stops in
  each before routing.
- The journeys function allows up to 60 seconds on Vercel (`export const
  config` in `backend/api/journeys.ts`). The app waits up to 30 seconds for
  routes and 10 seconds for everything else.

## Line labels and saved filters

- Line names are standardised as "<category> <number>". For example, "Str 6",
  "Strab 6" and "Tram 6" all become "Tram 6", and "U5" becomes "U 5".
- Line filters saved on favorites before this change may refer to old names,
  such as "STR 6". Those lines won't match any more and may need hiding again.

## The DB pill

| Pill | Meaning |
| --- | --- |
| **DB** (solid red) | A train run by DB. This includes S-Bahn Berlin and S-Bahn Hamburg, which DB owns but which run under their own names. |
| **Train** (outlined) | Another company's train, e.g. metronom, cantus or FlixTrain. |
| **Local** (outlined) | Bus, tram, U-Bahn, ferry or on-demand service. |

- It's decided from the operator's name that the network reports. When a
  network leaves the operator out, ICE, IC and EC count as DB, and every other
  train shows as "Train".
- The labels are in `components/ServicePill.tsx`, and the rules are in
  `classifyService` in `backend/lib/lines.ts`.

## Old favorites

- Stations saved with a bare DB station number (e.g. `8000105`) still work.
  Each one is located through a network that uses DB station numbers (VBN,
  INSA or NAH.SH), then served by the network that covers that area.
- New stop IDs carry their network as a prefix, e.g. `rmv:3000010`. The field
  is still called `evaNo` so that saved favorites stay readable.

## Backend tests

- `npm test` in `backend/` runs the unit tests in `backend/test/` with Node's
  built-in test runner, straight from TypeScript. CI runs them too.
- `backend/ts-resolve.mjs` points the sources' `./x.js` imports at the `.ts`
  files; the dev server and the tests both load it.

## Running the backend locally

- Run `npm start` in `backend/`. It serves the API on `http://localhost:3000`,
  which is where the app looks by default. It needs Node 22.18 or later.
- It uses `backend/dev-server.mjs`, a small stand-in for `vercel dev` that
  needs no Vercel CLI or account. It follows the same `api/` routes, restarts
  when a file changes, and reads `backend/.env` if there is one.
- `npm run start:vercel` still runs the real `vercel dev`. For that, install
  the CLI with `npm i -g vercel` and link the project first. Don't add
  `vercel` to the backend's own dependencies: it brings back the audit warnings
  below.

## Security warnings

`npm audit` in `backend/` reports no issues.

- It used to report 5, all from `@vercel/node` and its dependencies
  (`path-to-regexp`, `undici`, `ajv`). Every release of that package from 2.1.1
  on is flagged, so upgrading wouldn't have helped.
- The backend only used the package for its request and response types, so it
  was removed. The handlers now use small local types (`ApiRequest` and
  `ApiResponse` in `backend/lib/http.ts`). Vercel's runtime adds `req.query`,
  `res.status()` and `res.json()` whether or not the package is installed.
- `@types/node` is now a direct dev dependency, because it used to come in
  through `@vercel/node`.
- If a new warning shows up, run `npm audit --omit=dev` first. That checks only
  what gets deployed.
