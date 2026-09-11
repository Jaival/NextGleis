# Things to know — HAFAS data sources

Search, departure boards, and the Routes tab get their data from the public
journey planners of German transport networks, through the open-source
[hafas-client](https://github.com/public-transport/hafas-client) library. This
page covers the limits and caveats of that setup. The network list and region
rules live in `backend/lib/hafas/networks.ts`.

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
  library. Stops there come from networks that also list the rest of Germany,
  but only with trains. For example, Stuttgart Hbf shows S-Bahn, regional and
  long-distance trains, but no buses or trams.
- Munich (S-Bahn München), Ingolstadt (INVG), NRW (through AVV), Hamburg
  (through NAH.SH), Saxony (through INSA) and the other covered regions include
  local buses and trams.
- Each network's area is a rough rectangle rather than a real border. Near the
  edge of a region, a stop can end up with its neighbouring network. That
  usually doesn't matter, because neighbours carry each other's cross-border
  lines.

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
