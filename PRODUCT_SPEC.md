# Transit Board — Product & Technical Spec (Android, MVP)

> Working title only — **do not ship this as "ÖPNV Navigator."** That name, its logo, and its exact UI belong to an independent iOS developer's published app. This project is *inspired by* the concept (a German transit departure app), built from scratch with your own name, icon, and visual design, on your own Android/React Native codebase and DB's public data feed. Pick your own name before you build the icon/store listing — a few unclaimed-sounding ideas: **Gleisblick, Abfahrtszeit, NextGleis, Bahnblick, Haltepunkt.**

---

## 1. Concept

A single-purpose Android app: search a bus/train stop in Germany, see its live departure board, filter it down to the lines you actually care about, and pin your regular stops to the home screen for one-tap access.

**Core value prop:** "The departure board for *your* stop, with only *your* lines showing."

## 2. Tech stack

- **Expo (React Native) + TypeScript**, Expo Router (file-based navigation)
- **TanStack Query (React Query)** for data fetching/caching against your backend proxy
- **Zustand** (or React Context) for lightweight local UI state
- **AsyncStorage** (`@react-native-async-storage/async-storage`) for persisting favorite stations/lines — no account system needed for MVP
- **EAS Build** for producing the Android release build (`.aab`) to upload to Play Console
- Backend: a small serverless proxy (see §5) — **do not call the DB API directly from the app**

## 3. Data source: DB API Marketplace — "Timetables" product

- Register at `https://developers.deutschebahn.com`, create an application, subscribe to the **Timetables** product (Free plan: 60 calls/minute, 24/7, no approval wait).
- This gives you a client ID + API key. The exact base URL and required auth headers are shown in that product's **API Console** tab once you're subscribed — grab them from there rather than guessing, since the marketplace has migrated portals before and paths can shift.
- Endpoints available on the free plan:
  - `GET /station/{pattern}` — station name search → returns matching stations with their `evaNo` (station ID)
  - `GET /plan/{evaNo}/{date}/{hour}` — scheduled timetable for a station in a given hour slice
  - `GET /fchg/{evaNo}` — full current changes (delays, cancellations, platform changes)
  - `GET /rchg/{evaNo}` — recent changes only
- **Responses are XML**, not JSON — the proxy needs to parse and flatten these into clean JSON for the app.
- **Only ~18 hours of data at a time** and only *station boards*, not trip search — this is a hard ceiling of the free API, not an implementation gap.
- **License:** CC BY 4.0 — the app must credit **Deutsche Bahn AG / DB InfraGO AG** as the data source somewhere (an "About / Data sources" screen is enough).
- **Before publishing:** read the current Nutzungsbedingungen (terms of use) linked from the Timetables product page. The free tier's terms may distinguish non-commercial vs. commercial use — confirm your intended use (even an ad-free free app) is covered before you submit to the Play Store.

## 4. MVP scope

**In scope**
1. Station search (autocomplete via `/station/{pattern}`)
2. Live departure board for a selected station — merges scheduled (`/plan`) + realtime changes (`/fchg`/`/rchg`) into one list with delay indicators
3. Per-line filtering on a board (tap a line chip to hide/show it — this is the original's standout feature and is fully buildable on this API)
4. Favorite stations — save stops, reorder them, one tap from the home screen to their board
5. Pull-to-refresh + auto-refresh every ~30s while a board is open
6. Basic empty/error/offline states

**Explicitly out of scope for v1** (note these so nobody's surprised later)
- Point-to-point route planning with transfers (needs a different data source — see §7)
- Network maps / PDF downloads
- Widgets, Siri/Assistant shortcuts, geofencing notifications, watch support
- Accounts, sync across devices, arrival boards (start with departures only)

## 5. Backend proxy (required, not optional)

Client secrets embedded in a mobile app bundle can be extracted from the APK, so the DB client ID/key must live server-side.

Minimal serverless function (Cloudflare Workers, Vercel Edge Function, or a small hosted Node/Express service) exposing:

- `GET /api/stations?query=...` → proxies `/station/{pattern}`, returns JSON
- `GET /api/board/:evaNo` → fetches `/plan` for the current + next hour slice, merges in `/rchg`, converts XML→JSON, returns a normalized `{ line, direction, scheduledTime, actualTime, delayMinutes, platform, cancelled }[]`
- In-memory or KV cache per station (~20–30s TTL) so the app's auto-refresh doesn't blow through the 60 req/min ceiling
- DB credentials read from environment variables, never returned to the client

## 6. Data model (client-side)

```ts
type FavoriteStation = {
  evaNo: string;
  name: string;
  hiddenLines: string[]; // lines the user has filtered out, per-station
  order: number;
};

type DepartureRow = {
  line: string;
  direction: string;
  scheduledTime: string; // ISO
  actualTime?: string;
  delayMinutes?: number;
  platform?: string;
  cancelled: boolean;
};
```

Stored locally via AsyncStorage under a single `favorites` key (list of `FavoriteStation`) — no backend persistence needed for MVP.

## 7. Screens

1. **Home** — list of favorite stations (empty state prompts a search); tap → board
2. **Search** — station name input, debounced autocomplete results
3. **Board** — selected station's departures, line-filter chips at top, pull-to-refresh, delay badges
4. **Line filter (long-press a line)** — optional stretch: pick specific destinations for that line to show, mirroring the original's per-direction filter
5. **About** — DB data attribution (CC BY 4.0), app version, privacy policy link

## 8. Play Store publishing checklist

- Google Play Console account (one-time developer registration fee — confirm the current amount in Console, it's occasionally adjusted)
- Unique package name, e.g. `com.yourdomain.transitboard`
- Target API level: **new submissions after Aug 31, 2026 must target Android 16 (API 36)** — use a current Expo SDK version and EAS Build will set this correctly; don't hardcode an older `targetSdkVersion`
- App icon, feature graphic, screenshots — all original, not copied from the iOS app's store listing
- A hosted **privacy policy** page (required in Play Console even for a no-account app — state what's stored locally and that station queries are relayed through your proxy to DB's public API)
- Fill out the **Data Safety** form accurately (likely "no personal data collected" for this MVP, since there's no login and favorites are stored on-device only)
- Build & submit: `eas build --platform android` → `eas submit --platform android` (or manual upload of the `.aab`)

## 9. Roadmap (post-MVP, not part of this build)

- Real point-to-point route search — would require either DB's paid/expanded RIS products or a community HAFAS-based API (open-source clients like `db-vendo-client`), since the free Timetables API doesn't do this
- Arrival boards, not just departures
- Home-screen widget (Android widgets are straightforward in Expo via a config plugin)
- Notifications for saved-line delays
- Downloadable network maps
