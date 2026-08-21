Read PRODUCT_SPEC.md in this repo fully before writing any code — it's the spec for the whole project, including an important scope note about what the free DB Timetables API can and can't do.

Build an Expo (React Native + TypeScript) Android app called "[YOUR APP NAME]" per that spec. Work in phases, and stop after each phase for me to review before continuing:

**Phase 1 — Scaffold**
- Init an Expo project with TypeScript and Expo Router
- Set up folder structure: `app/` (routes), `components/`, `lib/` (API client, storage), `types/`
- Add TanStack Query, Zustand, AsyncStorage
- Add a placeholder app icon/name so I can rename before publishing

**Phase 2 — Backend proxy**
- Scaffold a minimal serverless proxy (Cloudflare Workers, unless I tell you otherwise) with the three endpoints described in spec §5
- Read DB client ID/API key from environment variables — never hardcode them, never send them to the client
- Implement XML→JSON conversion for the DB Timetables responses and the plan+rchg merge logic described in the spec
- Add the short in-memory/KV cache described in the spec
- Write me the exact steps to deploy this and where to put my DB credentials — don't assume I've deployed it yet

**Phase 3 — Core screens**
- Build Home, Search, Board, and About screens per spec §7
- Board screen: line-filter chips, delay badges, pull-to-refresh, 30s auto-refresh
- Wire favorites to AsyncStorage per the data model in spec §6
- Use your own original visual design — don't try to imitate any existing transit app's look

**Phase 4 — Polish**
- Empty/error/offline states everywhere data is fetched
- Loading skeletons for the board
- Basic accessibility labels on interactive elements

**Phase 5 — Android/Play Store prep**
- Configure `app.json`/`eas.json` for an Android build, current target API level per spec §8
- Draft a privacy policy page for me to host, covering what's described in spec §8
- Give me the exact `eas build` / `eas submit` commands to run

Ask me before Phase 2 which serverless platform I actually want to deploy to, if I haven't told you already. Don't invent the DB API's base URL or auth header names — ask me to paste them from the API Console once I've subscribed, since they're not something to guess at.
