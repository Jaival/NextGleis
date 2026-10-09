# NextGleis

A departure board app for buses, trams and trains in Germany. Search for a
stop, see its live departures, hide the lines you don't care about, and pin
your regular stops to the home screen.

> The departure board for *your* stop, with only *your* lines showing.

Built with Expo (React Native) and TypeScript. Android is the main target; iOS
and web also run.

## Features

- **Stop search** across Germany, with nearby stops based on your location
- **Live departure and arrival boards** with delays, cancellations, platform
  changes and disruption notices
- **Line and direction filters**: tap a line chip to hide it, long-press to
  hide single directions
- **Favorites**: save stops and routes, reorder them, open them in one tap
- **Route search** from A to B, depart at / arrive by, with earlier and later
  connections
- **Trip details**: tap a departure to see every stop it serves, with live times
- **Deutschlandticket mode**: hides ICE, IC/EC, night trains and FlixTrain
- German and English UI, light and dark themes

## How it works

```
┌────────────────────┐  JSON   ┌──────────────────────┐        ┌───────────────────────┐
│  App (Expo, RN)    │ ──────▶ │  Backend proxy       │ ─────▶ │  HAFAS networks       │
│  app/ lib/         │         │  backend/api/*.ts    │        │  (RMV, VBB, NAH.SH …) │
│  components/       │         │  Vercel / plain Node │ ─────▶ │  EFA (VVS, KVV, MVV,  │
└────────────────────┘         └──────────────────────┘        │  VGN), DB Timetables  │
                                                               └───────────────────────┘
```

The app never talks to the transport networks directly. It calls a small
backend in [`backend/`](backend/), which:

- queries the public journey planners of German transport networks, mostly via
  [hafas-client](https://github.com/public-transport/hafas-client), plus four
  EFA servers for Stuttgart, Karlsruhe, Munich and Nürnberg
- merges and normalizes their responses into one JSON format
- caches results so the networks see far fewer requests than users make
- keeps credentials and the user agent off the device

## Tech stack

| Part | Uses |
| --- | --- |
| App | Expo SDK 57, React Native 0.86, React 19, Expo Router (file-based, typed routes), React Compiler |
| State and data | TanStack Query (server data), Zustand + AsyncStorage (favorites, settings) |
| UI | Reanimated, Gesture Handler, expo-haptics |
| Backend | Node serverless functions (deployed on Vercel), hafas-client, fast-xml-parser |
| Builds | EAS Build (cloud) or Gradle (local) |
| CI/CD | GitHub Actions: checks on every PR, tag-triggered releases |

## Project structure

```
app/            Screens (Expo Router): tabs, board/[evaNo], trip/[id], onboarding
components/     Reusable UI components
lib/            API client, stores, theme, i18n, hooks, helpers
types/          Shared app types
assets/         Icons and splash images
plugins/        Expo config plugins (Windows path-length fix)
scripts/        Android emulator and local APK build helpers
backend/        API proxy: api/ routes, lib/ (hafas, efa, cache, …), tests
docs/           DevOps guide, Expo deployment guide, roadmap
```

## Getting started

### What you need

- **Node.js 22.18 or later** (the backend runs TypeScript directly through
  Node's built-in type stripping)
- **Android Studio** with an Android SDK and an emulator (AVD), and **JDK 17**,
  for running the app on Android locally
- Optional: `npm i -g eas-cli` and an [Expo account](https://expo.dev/signup)
  for cloud builds

You don't need any API keys to run the project. The backend works with its
defaults.

### 1. Start the backend

```sh
cd backend
cp .env.example .env   # optional, defaults work
npm install
npm start              # serves the API on http://localhost:3000
```

### 2. Start the app

In a second terminal, from the repo root:

```sh
cp .env.example .env
npm install
npm run android:emu    # Windows: boots an emulator, builds and runs the app
```

On macOS or Linux, start an emulator yourself and run `npm run android`
(or `npm run ios` on a Mac with Xcode).

The first run compiles the native app and takes a while. After that, Metro
hot-reloads your JavaScript changes.

> **Expo Go won't work.** The project uses native modules and config plugins
> that Expo Go can't load, so it runs in its own development build
> (`expo-dev-client`). Rebuild with `npm run android` whenever you add a native
> dependency or change `app.json`.

### Running on a phone without Android Studio

Build a development client in the cloud and install the `.apk` on your phone:

```sh
eas build -p android --profile development
```

Then run `npm start` and open the project from the dev client. Point
`EXPO_PUBLIC_API_BASE_URL` in `.env` at an address your phone can reach (your
PC's LAN IP or a deployed backend), not `localhost`.

## Environment variables

| Variable | File | Needed? | What it does |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | `.env` | Recommended | Backend URL the app calls. Defaults to `http://10.0.2.2:3000` on Android, `http://localhost:3000` elsewhere. |
| `HAFAS_USER_AGENT` | `backend/.env` | Optional | User agent sent to the networks. Must include a URL or contact address; VBB rejects a bare name. |
| `DB_CLIENT_ID`, `DB_API_KEY` | `backend/.env` | Optional | DB Timetables API credentials, only used as a fallback for stops saved in old app versions. |
| `DB_API_BASE_URL` | `backend/.env` | Optional | Only if DB moves its API again. |

Anything prefixed `EXPO_PUBLIC_` is baked into the app bundle and readable by
anyone who installs the app. Never put a secret there. Cloud builds on EAS
don't see your local `.env`; set the variable with `eas env:set` (see
[DEVOPS.md §3](docs/DEVOPS.md#3-environments-and-configuration)).

## Scripts

App (repo root):

| Command | Does |
| --- | --- |
| `npm start` | Start Metro for the dev client |
| `npm run android` / `npm run ios` | Build and run the native app |
| `npm run android:emu` | Windows: boot an emulator, forward ports, build and run |
| `npm run web` | Run in the browser |
| `npm run typecheck` | TypeScript check |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run build:apk:gradle` | Build a release APK locally with Gradle |
| `npm run build:apk:eas-local` | Build a release APK locally with EAS |

Backend (`backend/`):

| Command | Does |
| --- | --- |
| `npm start` | Local dev server on port 3000, restarts on file changes |
| `npm run start:vercel` | Run with the real `vercel dev` (needs the Vercel CLI) |
| `npm test` | Unit tests (Node's built-in test runner) |
| `npm run typecheck` | TypeScript check |

## Releasing

Releases are cut from a version tag:

```sh
npm version minor      # bumps package.json and app.json, commits, tags
git push --follow-tags
```

GitHub Actions then runs the checks, deploys and smoke-tests the backend,
builds the Android `.aab` and `.apk` on EAS, optionally submits to the Google
Play internal track, and creates a GitHub Release with both files attached.
Setup and secrets are described in [DEVOPS.md §8](docs/DEVOPS.md#8-cicd-github-actions).

## Things to know

- **Coverage has gaps.** Most of Germany has full bus, tram and train data.
  Outside the Stuttgart, Karlsruhe, Munich and Nürnberg areas, Baden-Württemberg
  and most of Bavaria only show trains.
- **The data feeds are used without formal permission.** They're the networks'
  public journey planners. Any network could start blocking requests, as DB did
  with its own planner in 2026. If one fails, the others keep working.
- **Trip details and routes are HAFAS only.** EFA departures (southern metro
  areas) can't be tapped for trip details.
- **All times are Berlin time**, whatever time zone the phone is in.
- **Windows path length:** native builds can fail with
  `ninja: error: manifest 'build.ninja' still dirty`. `plugins/withShortCxxPath.js`
  handles this; if it still happens, enable Git and Windows long paths or clone
  to a shorter path.
- **Long routes are slow upstream** (up to ~10 s). The app waits up to 30 s for
  routes and 10 s for everything else.

Details on all of these are in [THINGS_TO_KNOW.md](THINGS_TO_KNOW.md).

## Further reading

- [THINGS_TO_KNOW.md](THINGS_TO_KNOW.md): data sources, networks, caching, caveats
- [docs/DEVOPS.md](docs/DEVOPS.md): environments, builds, CI/CD, releases, runbook
- [docs/EXPO_DEPLOYMENT_GUIDE.md](docs/EXPO_DEPLOYMENT_GUIDE.md): general guide to shipping Expo apps
- [docs/ROADMAP.md](docs/ROADMAP.md): what's done and what's next
- [PRODUCT_SPEC.md](PRODUCT_SPEC.md): the original product spec

## Data sources and attribution

Timetable data comes from the public journey planners of German transport
networks (RMV, NVV, VBB, VBN, VOS, VSN, NAH.SH, INSA, VMT, RSAG, AVV,
Saarfahrplan, S-Bahn München, INVG, VVS, KVV, MVV, VGN) and, as a fallback, the
Deutsche Bahn Timetables API (Deutsche Bahn AG / DB InfraGO AG, CC BY 4.0).
