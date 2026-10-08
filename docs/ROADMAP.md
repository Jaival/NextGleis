# NextGleis — roadmap

What's left to build, in order. Each phase is meant to ship as one or more
small PRs. Operational setup (CI, EAS environments, store release) is
described in [DEVOPS.md](./DEVOPS.md).

Status: ☐ not started · ◐ in progress · ☑ done

---

## Phase 1 — First impression (now)

The first launch decides whether a new user keeps the app. Right now that
launch is an empty, English-only home screen, and the boards hide the two
things riders worry about most: disruptions and platform changes.

| # | Item | Status | Backend | App |
| --- | --- | --- | --- | --- |
| 1.1 | **Platform changes** — show when a departure leaves from a different platform than planned | ☑ | `normalize.ts`: send `plannedPlatform` alongside `platform` | `DepartureListItem`, `JourneyCard`: highlight the new platform, strike the old one |
| 1.2 | **Disruption notices** — warnings and status remarks on boards and journeys | ☑ | Turn `remarks` on, normalize warnings/status remarks, drop hints (bike/wheelchair notes) | Notice line under a departure; disruption list at the top of the board |
| 1.3 | **Nearby stops** — stops around the user with their distance | ☑ | New `GET /api/nearby?lat=&lon=`, asks the network that owns the area | `expo-location`, a "Nearby" section on Home |
| 1.4 | **Onboarding** — first-run screen: explain, offer location | ☑ | — | One screen, shown once, stored in settings |
| 1.5 | **German translation** — German UI by default on German devices, English otherwise | ☑ | — | `expo-localization`, string catalog, language setting |

Done when: a German user with no favorites opens the app, sees German text and
the stops around them, taps one and sees platform changes and disruptions.

Phase 1 still needs a pass on a real Android device (location permission
dialog, German strings fitting their layouts) before release. It needs a new
native build: `expo-location` and `expo-localization` are native modules.

## Phase 0 — Launch blockers (in parallel with Phase 1)

Not features, but needed before the first store release.

| # | Item | Status | Notes |
| --- | --- | --- | --- |
| 0.1 | Set `EXPO_PUBLIC_API_BASE_URL` in EAS and pin `environment` per build profile | ☐ | Otherwise store builds can't reach the backend. DEVOPS.md §3 |
| 0.2 | CI on pull requests, and a tag-triggered release pipeline | ☑ | `.github/workflows/`, DEVOPS.md §8 |
| 0.3 | Backend unit tests for `normalize.ts`, `lines.ts`, `stopId.ts` | ☐ | Node's built-in test runner, no new dependency |
| 0.4 | Crash reporting | ☐ | Sentry or EAS Observe |
| 0.5 | Store listing: screenshots (DE + EN), feature graphic, data-safety form | ☐ | Data safety must mention location once 1.3 ships |
| 0.6 | Privacy policy: add location use | ☑ | Location is sent to the backend for a nearby search and not stored |

## Phase 2 — Fill the gaps in what's there

| # | Item | Notes |
| --- | --- | --- |
| 2.1 | **Route time** — depart at / arrive by, any day | `/api/journeys?when=&arrival=`; date/time picker on Routes |
| 2.2 | **Later / earlier connections** | hafas-client `laterThan` / `earlierThan` refs |
| 2.3 | **Later departures on a board** | `when` on `/api/board`; "Show later" at the end of the list |
| 2.4 | **Trip details** — tap a departure to see all its stops with live times | hafas-client `trip()`; new `/api/trip` and a trip screen |
| 2.5 | **Filter by direction** — hide "Tram 6 → X" but keep "Tram 6 → Y" | Extends `hiddenLines` on favorites; long-press a chip (spec §7.4) |
| 2.6 | **Deutschlandticket mode** — hide ICE/IC/EC/FlixTrain on boards and routes | Uses existing product classification; a setting |
| 2.7 | **Share** a board or route as a link that opens the app | `nextgleis://` scheme exists; add web fallback page on the backend |
| 2.8 | **Offline last-known board** | Persist the React Query cache for favorites |

## Phase 3 — Retention

| # | Item | Notes |
| --- | --- | --- |
| 3.1 | **Delay alerts** for saved routes at chosen times | Push notifications + a scheduled backend job; needs a small store of push tokens — the first server-side user data, so privacy policy and data safety change |
| 3.2 | **Arrival boards** ☑ | hafas-client `arrivals()`; toggle on the board |
| 3.3 | **Coverage for Baden-Württemberg and Bavaria** ◐ | Stop search and departure boards now come from EFA for Stuttgart (VVS), Karlsruhe (KVV), Munich (MVV) and Nürnberg (VGN) — see THINGS_TO_KNOW.md. Still open: arrivals, nearby, trip planning and disruption notices on EFA boards; the rest of both states (Freiburg, Ulm, Augsburg, …) still has no local-transit source |
| 3.4 | **Home-screen widget** | Deprioritized for now |
| 3.5 | Android Auto / Wear OS next-departure tile | After the widget |

---

## Implementation notes for Phase 1

- **Contract changes are additive.** New optional fields (`plannedPlatform`,
  `remarks`) only — older app versions ignore them. The backend ships first.
- **Remarks are noisy.** HAFAS returns many `hint` remarks ("bicycles
  allowed", "wheelchair accessible"). Only `warning` and `status` remarks are
  shown, deduplicated, and board-wide warnings are shown once at the top
  rather than on every row.
- **Nearby picks the right network.** The owning network for the coordinates
  (`ownerOf`) is asked first, so local buses and trams come back; a fallback
  network covers areas nobody owns.
- **Location is optional.** Everything works without permission. The app asks
  only from the onboarding screen or when the user taps "Use my location", and
  never in the background.
- **Translation covers everything at once.** Strings added by 1.1–1.4 go
  straight into the catalog.
