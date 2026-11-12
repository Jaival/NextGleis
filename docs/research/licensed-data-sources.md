# Licensed data sources for NextGleis — research note

2026-11-12 · Claude (Opus 5.5) in the orchestrator thread, executing
`plans/008-licensed-data-source-spike.md` · base commit `afc2470`

## Answer in three sentences

Licensed open data is good enough to **back up** today's feeds now, and
probably to replace them later: the DELFI timetable plus the DELFI GTFS-Realtime
stream cover all of Germany including buses and trams, under CC BY / CC BY-SA,
and a live check showed real delays and cancellations at four busy stops — even
in Freiburg, which the app cannot serve with local transit today. The cheapest
way to use it without running our own routing server is Transitous, but its
policy allows only open-source, non-commercial apps that stay "light on
resources", and the NextGleis repo has no open-source licence yet, so that is a
decision for the owner before any code is written. The one next step: the owner
decides whether to put the repo under an open-source licence; if yes, a plan for
a Transitous-backed fallback board follows, and in parallel the owner writes to
VBB, RMV and NVBW (MobiData BW) for permission or official keys.

## Comparison

| Source | Licence (link) | Attribution / registration / key | Static or realtime | Realtime content (delay, cancel, platform) | Coverage (which regions, local transit?) | Access shape (files / API) | Fits a no-database backend? | Limits / terms for apps | Verified live? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DELFI Germany-wide GTFS (opendata-oepnv.de) | Not stated on the dataset page; portal lists CC BY 4.0, DL-DE BY 2.0 and CC BY-NC-ND 4.0 as licences in use ([overview](https://www.opendata-oepnv.de/ht/de/standards/uebersicht-der-verwendeten-lizenzen)); Transitous records it as CC BY 4.0 ([feeds/de.json](https://github.com/public-transport/transitous/blob/main/feeds/de.json)) | Registration required ("only available for registered Users", [DELFI page](https://www.opendata-oepnv.de/ht/de/organisation/delfi/startseite)) | Static | — | All of Germany, all modes ([DELFI page](https://www.opendata-oepnv.de/ht/de/organisation/delfi/startseite)) | Weekly ZIP (Mondays) | No — needs import into a routing/query engine | Not read (behind registration) | No (registration not done, by plan rule) |
| gtfs.de static feeds (DELFI-derived) | CC BY 4.0 ([gtfs.de feeds](https://gtfs.de/en/feeds/)) | Attribution; no registration for free feeds | Static | — | Germany: long-distance, regional rail, local transit as separate feeds | ZIP, next 30 days | No — same as above | No guarantee of completeness | Not downloaded |
| DELFI GTFS-RT via gtfs.de | CC BY-SA 4.0 ([gtfs.de realtime](https://gtfs.de/en/realtime/)) | Attribution, share-alike; no registration | Realtime (TripUpdates + ServiceAlerts, every 10 s, "BETA") | Delays and cancellations (TripUpdates); platforms not stated | Listed regions: Dresden/Chemnitz, Köln/Bonn, Bremen/Niedersachsen/SH, Rhein-Ruhr, Nürnberg, Berlin/Brandenburg, Bayern, Rhein-Neckar, Münster, Baden-Württemberg, plus DELFI SIRI for other states; buses marked incomplete for VRR and NVBW ([gtfs.de realtime](https://gtfs.de/en/realtime/)) | One protobuf file, `realtime-free.pb`, **31.6 MB** per fetch (HEAD, 2026-11-12) | No — 31 MB every 10 s must be matched against the full static GTFS | No rate limit stated; no guarantee of availability | Headers only (200, fresh `Last-Modified`) |
| DELFI-Realtime on Mobilithek | Search snippet says "Lizenz, freie Nutzung/Open Data"; page is a JS app and could not be read ([offer](https://mobilithek.info/offers/858688352316981248)) | Mobilithek account + subscription (not verified) | Realtime GTFS-RT | Not read | Germany (per title) | Brokered subscription | No | Not read | No |
| Transitous (MOTIS over DELFI + regional feeds) | Data under each source's licence; DE realtime sources are CC BY-SA 4.0 / CC BY 4.0 ([feeds/de.json](https://github.com/public-transport/transitous/blob/main/feeds/de.json)) | Link to transitous.org/sources, follow source + OSM attribution; `User-Agent` with app name and contact; no key ([API policy](https://transitous.org/api/)) | Realtime | Live: delay (scheduled vs actual time), `cancelled`/`tripCancelled`, `track`/`scheduledTrack` where the source has it | All of Germany, buses and trams included | JSON API: `/api/v1/geocode` (stop search), `/api/v1/reverse-geocode` (nearby, `type=STOP`), `/api/v6/stoptimes` (board, arrivals), `/api/v6/trip`, `/api/v6/plan` ([OpenAPI](https://github.com/motis-project/motis/blob/master/openapi.yaml)) | **Yes** — same shape as today's HAFAS/EFA calls | Open-source and non-commercial only; "light on our resources"; > 720 `/plan` per day needs coordination; best effort, may cut off any consumer at any time ([API policy](https://transitous.org/api/)) | **Yes** — 8 requests, see notes |
| VBB GTFS + GTFS-RT | CC BY 4.0 ([VBB datasets](https://vbb.de/en/vbb-services/api-/-open-data/datasets), [feed page](https://production.gtfsrt.vbb.de)) | Attribution; Transitous config carries a header credential for the RT feed (not verified whether a key is needed) | Static + realtime | GTFS-RT from VDV 454 | Berlin/Brandenburg, all modes | Files + protobuf | No (same matching problem) | Not read | Indirectly (through Transitous, Alexanderplatz) |
| MobiData BW — TRIAS-API / EFA-JSON-API (NVBW, EFA-BW) | Data: DL-DE BY 2.0 ([TRIAS dataset](https://mobidata-bw.de/dataset/trias)); interface: NVBW terms ([PDF, Sept 2026](https://www.mobidata-bw.de/data/Nutzungsbedingungen_Trias.pdf)) | TRIAS needs a personal Requestor-Key (§3.1); EFA-JSON: no key mentioned in §3.1 | Realtime where EFA-BW has it ([factsheet](https://www.mobidata-bw.de/data/MobiData-BW-Factsheet-TRIAS.pdf)) | Same as EFA (the app already parses EFA `rapidJSON`) | All of Baden-Württemberg, all modes | Live query API | **Yes** — same shape as the EFA code in `backend/lib/efa/` | Free "until further notice" (§5.1); may rate-limit or block on mass retrieval (§6.3); 2 weeks' notice termination (§7.1) | No (endpoint URL not confirmed) |
| RMV API (HAFAS ReST, "RMV Auskunft API") | RMV terms ([Nutzungsbedingung](https://www.rmv.de/s/de/rmv-open-data/nutzungsbedingung)) | Key by form (name, email, purpose); name RMV + logo (§5f) | Live queries; realtime not stated | Not stated | RMV area (Hessen) | Live query API | Yes | 600 queries/h and 5,000/day (§5b); passenger information only (§6a); free (§8a); revocable with 4 weeks' notice (§10a) | No (needs key) |
| MVV open data | CC BY, name MVV + retrieval date ([MVV for developers](http://www.mvv-muenchen.de/service-hilfe/mvv-content-fuer-entwickler)) | No registration for downloads | Static only; TRIAS "coming soon", journey-planner access "closed beta" | — | MVV area, all modes | GTFS ZIP every 4–8 weeks | No | No guarantee | No |
| Bayern (DEFAS / bayerninfo) | General terms only ([bayerninfo](https://www.bayerninfo.de/en/about-bayerninfo-1/data-offer/public-transport-data)) | Realtime VDV 453: data delivery contract; TRIAS: "Portal contract" | Static (via DELFI) + realtime by contract | Not read | Bayern | Contract APIs | TRIAS would fit | Contract with BEG | No |
| Open Data ÖPNV API agreement (generic) | Licence per agreement v1.0, 2018 ([Nutzungsvereinbarung API](https://www.opendata-oepnv.de/ht/de/standards/nutzungsvereinbarung-api)) | Credentials per licensor; attribution text required (§4.3) | Live queries | Not stated | Per licensor (not named on the page) | API | Yes | User-triggered live queries only, no bulk retrieval (§3.1); free in general (§5.1); 2 weeks' notice (§7.1) | No |

## Per-candidate notes

### 1. DELFI Germany-wide GTFS

- Checked: the DELFI organisation page on opendata-oepnv.de, the licence
  overview page, gtfs.de's feed page, Transitous's feed config.
- Found: GTFS, NeTEx and ZHV (stop directory) downloads, refreshed on Mondays,
  "only available for registered Users". The dataset page itself does not name
  its licence; the licence-terms page must be accepted at download, so it was
  not read (plan STOP rule: no accepting terms). Transitous records the dataset
  as CC BY 4.0, and gtfs.de republishes cleaned versions under CC BY 4.0 with
  no registration.
- Size: not stated anywhere read. Not downloaded.
- Unknown: the exact licence text on opendata-oepnv.de.
- **Definite finding:** a nationwide static timetable with local transit exists
  under an open licence (CC BY 4.0 via gtfs.de, no registration). On its own it
  has no realtime and needs an import into a query engine — it does not fit the
  current Vercel-only backend.

### 2. GTFS-Realtime for Germany

- Checked: gtfs.de realtime page, a HEAD request on the feed, Transitous config,
  Mobilithek search results.
- Found: `https://realtime.gtfs.de/realtime-free.pb`, TripUpdates and
  ServiceAlerts, updated every 10 s, CC BY-SA 4.0, labelled "BETA". It matches
  gtfs.de's static feeds. The file is **31.6 MB** (HEAD on 2026-11-12, fresh
  `Last-Modified`). The source list names DELFI SIRI feeds plus regional
  partners; bus coverage is marked incomplete for VRR and NVBW, and Hamburg
  Hochbahn is "in preparation / open license questions". Transitous uses two
  DELFI GTFS-RT copies (CC BY-SA 4.0) plus VBB (CC BY 4.0) and VBN
  (CC BY-SA 4.0).
- DELFI also offers "DELFI-Realtime GTFS-RT Trip Updates" on Mobilithek; the
  page is a JavaScript app and its terms could not be read. A March 2026 press
  item describes a DELFI–Google contract for the same realtime data, operated
  by the DELFI-RegioCluster Nord (VBN) — secondary source, not used as proof.
- **Definite finding:** nationwide GTFS-RT with delays and cancellations exists
  under CC BY-SA 4.0 with no registration. Consuming it directly means
  downloading ~30 MB every 10–30 s and matching it to the static timetable:
  always-on infrastructure, not a Vercel function.

### 3. Mobilithek

- The federal access point; DELFI-Realtime is offered there. The offer pages
  render only in a browser, so licence and access terms stayed unread. Search
  snippets say "freie Nutzung/Open Data" and brokered access (subscription).
  An account would be needed to confirm; not created (plan rule).
- **Finding:** not needed while gtfs.de republishes the same DELFI realtime
  without registration. Re-check if gtfs.de's free stream goes away.

### 4. Regional portals

- **VBB:** static GTFS and GTFS-RT, both CC BY 4.0. Covered indirectly by the
  Transitous live check at Alexanderplatz.
- **MobiData BW (NVBW):** the strongest regional find. A statewide **EFA-JSON
  API and TRIAS API** over EFA-BW, data under DL-DE BY 2.0, interface terms
  dated September 2026: free until further notice, Requestor-Key needed for
  TRIAS only, mass retrieval may be rate-limited or blocked, termination with
  two weeks' notice. The app already speaks EFA `rapidJSON` for VVS and KVV
  (`backend/lib/efa/`), so a BW-wide licensed EFA source could also close the
  Freiburg / Ulm / rest-of-BW gap from `THINGS_TO_KNOW.md`. The API base URL is
  in the parameter PDF and was not confirmed live. Note: `THINGS_TO_KNOW.md`
  says the EFA-BW **XML** interface retires at the end of 2027; the JSON API is
  a separate resource — check its lifetime too.
- **MVV:** static GTFS under CC BY, no realtime; TRIAS "coming soon".
- **Bayern (DEFAS):** realtime only through a data-delivery contract (VDV 453)
  or a portal contract (TRIAS) with BEG.
- **VRR / NRW:** not checked directly; gtfs.de lists Rhein-Ruhr and Köln/Bonn
  in its realtime sources (buses incomplete for VRR). A VRS realtime GTFS-RT
  appeared in search as an "OpenService with a usage agreement" — not read.

### 5. Transitous

- Checked: the API usage policy, the German feed list, the MOTIS OpenAPI, and
  a live check with a generic `User-Agent` (8 requests in total: 4 geocode, 4
  stoptimes).
- Live results, 2026-11-12 around 16:17 Berlin time, `n=40`:

  | Stop | Rows | With realtime | Delayed rows | Cancelled | With platform | Modes |
  | --- | --- | --- | --- | --- | --- | --- |
  | Berlin S+U Alexanderplatz | 41 | 40 | 3 | 1 | 26 | S-Bahn, U-Bahn |
  | Stuttgart Hbf | 43 | 40 | 16 | 1 | 42 | regional, S-Bahn, Stadtbahn, bus, long-distance |
  | Frankfurt Hauptwache | 40 | 40 | 15 | 0 | 0 | S-Bahn, U-Bahn |
  | Freiburg Bertoldsbrunnen | 41 | 41 | 3 | 0 | 41 | tram |

- Each row carries line name, mode, headsign, scheduled and actual time, track
  and scheduled track, `cancelled`, and a `tripId` — everything `/api/board`
  needs. Stop search (`geocode`, `type=STOP`) returned the right stops first.
  `reverse-geocode` with `type=STOP` is the nearby candidate (not tried).
- **Freiburg is a current gap** in the app (rail only, `THINGS_TO_KNOW.md`);
  Transitous returned live tram departures with delays and platforms there.
- Not done: a side-by-side comparison with the app's own backend for the same
  stop and minute (no deployed backend URL used in this run). The plan asked
  for it; do it before building.
- Terms: open-source and non-commercial projects only, "light on our
  resources", attribution link to transitous.org/sources, `User-Agent` with a
  contact, best effort, may stop serving any consumer at any time.
- **Blocking fact:** the GitHub repo is public but has **no licence file**, and
  both `package.json` files say `"private": true`. As it stands NextGleis does
  not meet "published under an appropriate open-source license".
- **Definite finding:** technically a near drop-in source for search, board,
  nearby and trip, with real realtime; usable only after the owner adds an
  open-source licence, and never as a guaranteed service.

### 6. Asking for permission

- **RMV** has a published programme: a free key by web form, 600 queries/hour
  and 5,000/day, RMV named as source with logo, passenger information only,
  revocable with four weeks' notice. 5,000/day is tight: boards are cached 25 s
  per stop, so it covers roughly one busy stop polled all day plus searches.
  Ask for a higher limit when applying.
- **VBB** publishes open data (CC BY 4.0) including GTFS-RT; whether its HAFAS
  API needs agreement was not confirmed from a primary source.
- **NVBW (MobiData BW)** publishes terms for its EFA-JSON/TRIAS API (above).
- **MVV**: developer page offers data downloads and widgets; API access is in
  closed beta; general contact only.
- Bayern: contract with BEG.
- The remaining HAFAS networks (NVV, VBN, VOS, VSN, NAH.SH, INSA, VMT, RSAG,
  AVV, Saarfahrplan, S-Bahn München, INVG) were not checked one by one.
- **Definite finding:** at least RMV and NVBW offer a written, free route to
  licensed access today; VBB's data is open. Asking is cheap and covers the
  biggest current users.

### 7. TRIAS / VDV 431

- Offered: NVBW (MobiData BW, Requestor-Key, terms above), Bayern (portal
  contract with BEG), MVV ("coming soon"). The generic Open Data ÖPNV API
  agreement (v1.0, 2018) allows commercial use in apps, user-triggered live
  queries only, free in general.
- TRIAS is XML; for BW the EFA-JSON API is the easier fit for the existing code.

## Coverage map against today's 18 networks

"Licensed realtime" means a source with an open or published licence that
carries realtime for the network's area. "Live" = seen in this run's live check.

| Network | Licensed source with realtime? | Evidence |
| --- | --- | --- |
| RMV | Yes — RMV API (key) and DELFI GTFS-RT | Live via Transitous (Hauptwache: 15 of 40 delayed; no platforms) |
| NVV | Partly — DELFI GTFS-RT; region not listed by name on gtfs.de | Not verified |
| VBB | Yes — VBB GTFS-RT (CC BY 4.0) | Live via Transitous (Alexanderplatz) |
| VBN | Yes — VBN GTFS-RT (CC BY-SA 4.0); gtfs.de lists Bremen/Niedersachsen | Not verified live |
| VOS | Partly — gtfs.de lists Niedersachsen | Not verified |
| VSN | Partly — gtfs.de lists Niedersachsen | Not verified |
| NAH.SH | Partly — gtfs.de lists Schleswig-Holstein; Hamburg Hochbahn "in preparation" | Not verified |
| INSA | Partly — gtfs.de lists Dresden/Chemnitz; Sachsen-Anhalt not named | Not verified |
| VMT | Partly — only via "DELFI SIRI for other states" | Not verified |
| RSAG | Partly — same as VMT | Not verified |
| AVV | Partly — gtfs.de lists Köln/Bonn and Rhein-Ruhr; AVV GTFS is ODbL (static) | Not verified |
| Saarfahrplan | Partly — only via "DELFI SIRI for other states" | Not verified |
| S-Bahn München | Partly — gtfs.de lists Bayern; DEFAS realtime needs a contract | Not verified |
| INVG | Partly — gtfs.de lists Bayern | Not verified |
| VVS (EFA) | Yes — MobiData BW EFA-JSON (DL-DE BY 2.0), DELFI GTFS-RT | Live via Transitous (Stuttgart Hbf, incl. buses) |
| KVV (EFA) | Yes — KVV SIRI (CC BY 4.0) in Transitous, MobiData BW | Not verified live |
| MVV (EFA) | Partly — static CC BY only from MVV; realtime via DELFI/Bayern | Not verified |
| VGN (EFA) | Partly — gtfs.de lists Nürnberg | Not verified |
| *Gap: Freiburg / rest of BW* | Yes — MobiData BW, DELFI GTFS-RT | Live via Transitous (Freiburg Bertoldsbrunnen, trams) |

## Options

### 1. Replace

- **What it takes:** run our own MOTIS (the engine behind Transitous) on DELFI
  GTFS + gtfs.de GTFS-RT + an OSM extract of Germany. Moving parts: one
  always-on Linux server, a weekly timetable import job, a realtime poller
  (~30 MB per fetch), disk for the OSM extract, monitoring and updates. The
  Vercel functions would call it instead of HAFAS/EFA.
- **Cost (estimate, not verified):** no published RAM figure for a
  Germany-wide MOTIS import was found. One MOTIS-based German project reports
  ~10 GB RAM to build its database. A dedicated server with 64 GB RAM sits at
  roughly €40–60/month at budget hosts (Hetzner-class); add the owner's time
  for operations. Effort: several days to set up, ongoing upkeep.
- **What gets worse:** realtime quality depends on DELFI's feed, which is
  "BETA" and incomplete for buses in VRR and BW; platforms are missing in some
  regions (none at Frankfurt Hauptwache). Disruption notices come only as
  GTFS-RT ServiceAlerts.

### 2. Back up

- **Where:** a third source next to `backend/lib/hafas/` and `backend/lib/efa/`,
  e.g. `backend/lib/transitous/` (search, board, nearby). When a network's
  calls fail repeatedly (blocked, host gone), `resolve`/`search` route that
  network's stops to the fallback. Stop ids would need a new prefix and a
  mapping by name and coordinate — the hard part.
- **Alternative for BW only:** MobiData BW EFA-JSON as a fifth EFA network —
  same code path as VVS/KVV, licensed, and it also closes the rest-of-BW gap.
- **What the rider loses in fallback:** possibly platforms in some regions,
  HAFAS-specific notices, and trip ids from a different system (favourites keep
  working only if the id mapping holds). Transitous may refuse traffic at any
  time, so the fallback itself is best effort.

### 3. Ask

- Write first to **VBB** (Berlin, biggest user group, open-data friendly),
  **RMV** (has a key programme — apply and ask for a higher daily limit), and
  **NVBW** (MobiData BW; covers the whole BW gap).
- Draft request (German):

  > Betreff: Nutzung Ihrer Fahrplanauskunft in der App „NextGleis“
  >
  > Sehr geehrte Damen und Herren,
  >
  > ich entwickle NextGleis, eine kostenlose Android-App, die Abfahrtstafeln
  > für Bus und Bahn in Deutschland anzeigt. Die App fragt für Ihr Gebiet
  > Haltestellensuche und Abfahrten mit Echtzeitdaten ab. Abfragen gehen nur
  > über unseren Server, der jede Tafel 25 Sekunden und jede Suche fünf
  > Minuten zwischenspeichert, damit Ihre Server wenig belastet werden.
  >
  > Ich möchte das gern auf eine saubere Grundlage stellen. Dürfen wir Ihre
  > Schnittstelle dafür nutzen, oder gibt es einen Zugang (API-Schlüssel,
  > Nutzungsbedingungen), den Sie für Drittanbieter-Apps vorsehen? Die
  > Quellenangabe nach Ihren Vorgaben nehmen wir selbstverständlich auf.
  >
  > Mit freundlichen Grüßen

### 4. Do nothing

- Monitor instead: per-network error rates in the Vercel logs (a sustained
  403/DNS failure = blocked), the hafas-client and transport-apis issue
  trackers, and DB's history as a warning sign. Cost: none now; a dark region
  with no notice when it happens.

## Recommendation

**Back up, starting with "Ask".** Today's feeds work and cover more than any
single licensed source in one place; replacing them buys legal comfort at the
cost of always-on infrastructure. The licensed sources are good enough to take
over a region when a network blocks the app.

First concrete step: the **owner decides on an open-source licence for the
repo** (it gates Transitous, the cheapest fallback), and in the same week
sends the request above to VBB, RMV and NVBW, and applies for the RMV key.
Then a plan follows: MobiData BW EFA-JSON as a licensed EFA network (also
closes the BW gap), and a Transitous-backed fallback for blocked networks.

What would change the answer:

- A network blocks the app → build the fallback for that region at once.
- The owner keeps the code closed or makes the app commercial → Transitous is
  out; the fallback becomes self-hosted MOTIS (Option 1 cost) or per-network
  official APIs.
- A written "no" from a network → move that network to a licensed source.
- gtfs.de's free realtime stream ends or Transitous stops serving third parties.

## Open questions

- Exact licence text for the DELFI datasets on opendata-oepnv.de (behind
  registration and accept-terms).
- Mobilithek DELFI-Realtime terms and access path (needs an account).
- MobiData BW EFA-JSON base URL, lifetime, and whether it needs a key.
- Is NextGleis meant to be commercial (ads, paid tier)? Transitous and RMV
  terms depend on it.
- A side-by-side check of one stop: app backend vs Transitous, same minute.
- RAM and disk needed for a self-hosted Germany-wide MOTIS (measure if Option 1
  is ever chosen).
- Terms for the twelve HAFAS networks not checked one by one.

## Sources

- DELFI on Open Data ÖPNV: https://www.opendata-oepnv.de/ht/de/organisation/delfi/startseite
- Licences used on Open Data ÖPNV: https://www.opendata-oepnv.de/ht/de/standards/uebersicht-der-verwendeten-lizenzen
- Open Data ÖPNV API agreement: https://www.opendata-oepnv.de/ht/de/standards/nutzungsvereinbarung-api
- gtfs.de feeds: https://gtfs.de/en/feeds/
- gtfs.de realtime: https://gtfs.de/en/realtime/
- Mobilithek DELFI-Realtime offer: https://mobilithek.info/offers/858688352316981248
- Transitous API policy: https://transitous.org/api/
- Transitous German feeds: https://github.com/public-transport/transitous/blob/main/feeds/de.json
- MOTIS OpenAPI: https://github.com/motis-project/motis/blob/master/openapi.yaml
- VBB datasets: https://vbb.de/en/vbb-services/api-/-open-data/datasets
- VBB GTFS-RT feed page: https://production.gtfsrt.vbb.de
- MobiData BW TRIAS dataset: https://mobidata-bw.de/dataset/trias
- MobiData BW TRIAS/EFA-JSON terms: https://www.mobidata-bw.de/data/Nutzungsbedingungen_Trias.pdf
- MobiData BW TRIAS factsheet: https://www.mobidata-bw.de/data/MobiData-BW-Factsheet-TRIAS.pdf
- RMV open data: https://www.rmv.de/s/de/rmv-open-data
- RMV API terms: https://www.rmv.de/s/de/rmv-open-data/nutzungsbedingung
- MVV for developers: http://www.mvv-muenchen.de/service-hilfe/mvv-content-fuer-entwickler
- Bayerninfo public transport data: https://www.bayerninfo.de/en/about-bayerninfo-1/data-offer/public-transport-data
- MOTIS-based project RAM note (secondary): https://awesome.ecosyste.ms/projects/github.com%2Fschaerfo%2Fdtakt-fahrplan
