# NextGleis — DevOps guide

How NextGleis is built, configured, tested, released and kept running, and why
it's set up the way it is. For deploying Expo apps in general (any project),
see [EXPO_DEPLOYMENT_GUIDE.md](./EXPO_DEPLOYMENT_GUIDE.md). For data-source
caveats (HAFAS networks, coverage, user agent), see
[THINGS_TO_KNOW.md](../THINGS_TO_KNOW.md).

Checked against Expo SDK 57, React Native 0.86 and EAS CLI 16+ in October 2026.

---

## 1. The system at a glance

```
┌──────────────────────────┐   HTTPS (JSON)   ┌──────────────────────────┐   HAFAS   ┌──────────────────┐
│  Android / iOS app       │ ───────────────▶ │  Backend proxy (Vercel)  │ ────────▶ │  RMV, VBB, VBN,  │
│  Expo SDK 57, RN 0.86    │                  │  backend/api/*.ts        │           │  NAH.SH, INSA …  │
│  Built by EAS Build      │                  │  Node serverless funcs   │ ────────▶ │  DB Timetables   │
└──────────────────────────┘                  └──────────────────────────┘ (fallback) └──────────────────┘
     ▲ EXPO_PUBLIC_API_BASE_URL                    ▲ HAFAS_USER_AGENT, DB_CLIENT_ID, DB_API_KEY
```

There are two deployable units, and they ship independently:

| Unit | Lives in | Built / hosted by | Shipped as |
| --- | --- | --- | --- |
| Mobile app | repo root (`app/`, `components/`, `lib/`) | EAS Build (cloud) or Gradle (local) | `.aab` to Google Play, `.apk` for testers |
| Backend proxy | `backend/` | Vercel (serverless functions) | One function per file in `backend/api/` |

### Why there's a backend at all

- **Secrets stay off the device.** Anything in an app bundle can be pulled out
  of the APK. The DB API key, and the user agent the networks see, belong on a
  server.
- **One place to fix upstream breakage.** HAFAS networks change, go down or
  start blocking. Fixing the proxy fixes every installed app at once, without a
  store release.
- **Caching.** Every search fans out to ~14 networks. The proxy caches results
  (search 5 min, boards 25 s, routes 60 s, stop positions 1 day) so the
  networks see far fewer requests than users make.
- **A stable contract.** The app only knows three JSON endpoints. Upstream
  formats (HAFAS, DB XML) are normalized server-side.

### Why Vercel

The backend is three stateless HTTP handlers. Vercel runs each `api/*.ts` file
as a function with no server to manage, has a free tier that fits this load,
and gives preview deployments per branch. `backend/lib/http.ts` uses small
local types rather than `@vercel/node`, so the code isn't tied to Vercel; the
local `dev-server.mjs` proves it runs on plain Node.

### Why EAS Build

- Builds Android (and iOS, which needs macOS) in the cloud from any OS,
  including this Windows machine.
- Manages the Android upload keystore. Losing a keystore means you can never
  update the Play listing again; EAS keeps it backed up.
- `appVersionSource: "remote"` + `autoIncrement` means nobody has to remember
  to bump `versionCode`.

---

## 2. Repository layout (DevOps-relevant parts)

| Path | Purpose |
| --- | --- |
| `app.json` | Expo app config: name, package `com.nextgleis.app`, icons, plugins, EAS project ID |
| `eas.json` | Build profiles (`development`, `preview`, `local`, `production`) and the submit profile |
| `plugins/withShortCxxPath.js` | Config plugin that fixes the Windows path-length bug in native builds |
| `scripts/run-android.cmd` | Boots an emulator, sets up port forwarding, builds and runs the dev app |
| `scripts/build-apk-local.cmd` | Prebuild + Gradle release APK, fully local |
| `.env.example` | App env template (`EXPO_PUBLIC_API_BASE_URL`) |
| `backend/.env.example` | Backend env template (`HAFAS_USER_AGENT`, DB credentials) |
| `backend/dev-server.mjs` | Local stand-in for `vercel dev` |
| `backend/privacy-policy.html` | Privacy policy, served by the backend deployment, linked from the app and Play listing |
| `eslint.config.js`, `.prettierrc`, `tsconfig.json` | Quality gates |

`android/` and `ios/` are **generated** (Continuous Native Generation) and
gitignored. Never edit them by hand; change `app.json` or a config plugin and
run `npx expo prebuild --clean`.

---

## 3. Environments and configuration

### Environments

| Environment | App build | Backend | Who uses it |
| --- | --- | --- | --- |
| Local | `npm run android` / Expo dev client | `npm start` in `backend/` on `localhost:3000` | You, while coding |
| Preview | EAS `preview` profile (`.apk`, internal) | Vercel preview deployment or production | Testers |
| Production | EAS `production` profile (`.aab`) | Vercel production | Play Store users |

### Variables

| Variable | Where it's read | Secret? | Set in |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | `lib/api.ts` (inlined into the JS bundle **at build time**) | No — it's public | `.env` locally; EAS environment variables for cloud builds |
| `HAFAS_USER_AGENT` | `backend/lib/env.ts` | No, but deployment-specific | `backend/.env` locally; Vercel project env vars |
| `DB_CLIENT_ID`, `DB_API_KEY` | `backend/lib/env.ts` | **Yes** | `backend/.env` locally; Vercel env vars (optional) |
| `DB_API_BASE_URL` | `backend/lib/env.ts` | No | Only if DB moves the API again |

Rules:

- **Anything prefixed `EXPO_PUBLIC_` is readable by anyone who downloads the
  app.** Never put a key there.
- `EXPO_PUBLIC_*` values are baked in when the JS bundle is built. Changing one
  means a new build (or an OTA update, once `expo-updates` is added).
- `.env` files are gitignored, and EAS cloud builds only upload files git
  tracks. **A cloud build will not see your local `.env`.** Set the variable in
  EAS (below).

#### Setting the API URL for EAS builds

If `EXPO_PUBLIC_API_BASE_URL` is missing, `lib/api.ts` falls back to
`http://10.0.2.2:3000` (the emulator's view of your PC). A store build with
that fallback can't reach anything. Set it once per environment:

```sh
eas env:set --name EXPO_PUBLIC_API_BASE_URL --value https://<your-backend>.vercel.app --environment production --visibility plaintext
eas env:set --name EXPO_PUBLIC_API_BASE_URL --value https://<your-backend>.vercel.app --environment preview --visibility plaintext
eas env:list --environment production
```

Each build profile in `eas.json` names its environment explicitly
(`"environment": "production"` and so on), so it's never inferred.

To pull EAS values into a local `.env` for testing: `eas env:pull --environment preview`.

---

## 4. Local development

Prerequisites: Node 22.18+ (the backend's dev server uses Node's built-in
TypeScript stripping), Android Studio with an SDK and an AVD, JDK 17,
`npm i -g eas-cli`.

```sh
# Backend (terminal 1)
cd backend
cp .env.example .env        # optional; defaults work
npm install
npm start                   # http://localhost:3000

# App (terminal 2)
cp .env.example .env
npm install
npm run android:emu         # boots emulator, adb reverse 8081/3000, builds, runs
```

Why `adb reverse`: inside the emulator `localhost` is the emulator itself.
Reversing ports 8081 (Metro) and 3000 (backend) lets the app reach your PC
without relying on LAN IPs. `lib/api.ts` also defaults Android to `10.0.2.2`,
the emulator's alias for the host.

The project uses `expo-dev-client`, not Expo Go: it has native modules and
config plugins Expo Go can't load. Rebuild the dev client
(`npm run android`) whenever you add a native dependency or change
`app.json`; for JS-only changes, Metro hot-reloads.

### The Windows path-length fix

On Windows, CMake/ninja fail when object-file paths exceed ~250 characters.
Reanimated's deep source tree inside a git worktree trips this
(`ninja: error: manifest 'build.ninja' still dirty after 100 tries`).
`plugins/withShortCxxPath.js` redirects the CMake staging directory to
`C:/rnb/nextgleis` during prebuild. It's a no-op on macOS/Linux and on EAS
cloud builds. If you still hit it, enable long paths
(`git config --system core.longpaths true` and the Windows `LongPathsEnabled`
registry key) or clone to a shorter path.

---

## 5. Quality gates

Run these before every PR. They are what CI should run (section 8).

```sh
npm run typecheck           # tsc --noEmit, strict + noUncheckedIndexedAccess
npm run lint                # eslint-config-expo + prettier, exhaustive-deps as error
npm run format:check        # prettier
npx expo install --check    # dependency versions match SDK 57
npx expo-doctor             # project health checks

cd backend
npm run typecheck
npm audit --omit=dev        # only what gets deployed
```

Why each one matters:

- **typecheck** — `noUncheckedIndexedAccess` catches the "array index might be
  undefined" bugs that otherwise crash on device.
- **lint** — `react-hooks/exhaustive-deps` is an error here because stale
  effect dependencies were the most common bug class in this codebase.
- **expo install --check** — mismatched native module versions are the #1
  cause of builds that compile but crash at launch.
- **npm audit --omit=dev** — dev-only advisories don't ship; don't let them
  block a release.

There are no automated tests yet. Until there are, smoke-test on a device
before releasing (section 7, step 4).

---

## 6. Build profiles (`eas.json`)

| Profile | Output | Use it for | Command |
| --- | --- | --- | --- |
| `development` | `.apk` with dev client | Local development on a device without Android Studio | `eas build -p android --profile development` |
| `preview` | `.apk`, release mode, internal | Sharing a test build (install link / QR code) | `eas build -p android --profile preview` |
| `local` | `.apk` via `:app:assembleRelease` | Release APK built on your own machine | `npm run build:apk:eas-local` |
| `production` | `.aab`, auto-incremented `versionCode` | Google Play | `eas build -p android --profile production` |

Fully offline alternative (no EAS account needed): `npm run build:apk:gradle`
runs `expo prebuild` then `gradlew assembleRelease`. Note that a Gradle build
signs with whatever keystore `android/` is configured with (the debug keystore
by default) — fine for sideloading, never for Play.

### Versioning

- `version` in `app.json` (`1.0.0`) is the user-visible version name. Bump it
  yourself for each store release: patch for fixes, minor for features.
- `versionCode` is owned by EAS (`appVersionSource: "remote"`,
  `autoIncrement: true` on `production`). Check it with
  `eas build:version:get -p android`; set it with `eas build:version:set` if
  you ever upload a build made outside EAS.

---

## 7. Releasing

### Backend release

The backend is deployed from `backend/` as its own Vercel project (Root
Directory = `backend`).

1. Merge to `main`. With the Vercel GitHub integration, that deploys to
   production; every other branch gets a preview URL. Without the
   integration: `cd backend && vercel --prod`.
2. Check the deployment:
   ```sh
   curl "https://<backend>/api/stations?query=Alexanderplatz"   # expect VBB results
   curl "https://<backend>/api/board/<an evaNo from above>"
   curl "https://<backend>/api/nearby?lat=50.107&lon=8.664"          # expect Frankfurt Hbf first
   curl "https://<backend>/privacy-policy.html"
   ```
3. Environment variable changes only apply to **new** deployments. After
   changing one in Vercel, redeploy.

The journeys function has `maxDuration: 60` (`backend/api/journeys.ts`). Long
cross-network routes take ~8 s upstream; the app waits 30 s for routes and 10 s
for everything else.

**Backwards compatibility:** old app versions stay installed for months. Never
remove or rename a response field the app reads, and keep accepting bare DB
station numbers in `/api/board/:evaNo` (favorites saved by older versions use
them). Add fields; don't change existing ones.

### App release (Android)

1. **Gates pass** (section 5) on `main`.
2. **Bump** `version` in `app.json` and commit.
3. **Build:** `eas build -p android --profile production`.
4. **Smoke-test** the matching preview build on a real device: search a stop
   in Berlin, Frankfurt and Hamburg; open a board; pull to refresh; plan a
   route; toggle dark mode; kill the app offline and reopen.
5. **Submit:** `eas submit -p android --profile production` (goes to the
   **internal** track, per `eas.json`).
6. **Promote** internal → closed/open testing → production in Play Console,
   ideally with a staged rollout (10% → 50% → 100%).

One-time Play setup: create the app in Play Console, finish the store listing,
content rating, data-safety form and privacy policy URL
(`https://<backend>/privacy-policy.html`), and create a Google service account
key. `eas.json` reads it from `./google-service-account.json` (gitignored).
For CI, upload it to EAS instead (`eas credentials -p android` → Google
Service Account) and drop `serviceAccountKeyPath` from `eas.json`, so no key
file needs to exist on the runner.

### Release order

When a release changes both sides: **deploy the backend first**, make sure the
old app still works against it, then ship the app. The reverse order leaves new
app versions calling endpoints that don't exist yet.

---

## 8. CI/CD (GitHub Actions)

Two workflows in `.github/workflows/`:

| Workflow | Runs on | Does |
| --- | --- | --- |
| `ci.yml` | Every pull request and push to `main` | App: typecheck, lint, Prettier, `expo install --check`, `expo-doctor`. Backend: typecheck, `npm audit --omit=dev` |
| `release.yml` | Pushing a `v*.*.*` tag, or manually for an existing tag | CI checks → version check → backend deploy + smoke test → EAS builds → Google Play (internal) → GitHub Release |

### Cutting a release

```sh
git switch main && git pull
npm version patch            # or minor / major; 1.0.0 -> 1.0.1
git push --follow-tags
```

`npm version` bumps `package.json`, and `scripts/sync-app-version.mjs` copies
the version into `app.json`, in one commit tagged `v1.0.1`. Pushing the tag
starts `release.yml`. The release fails early if the tag, `package.json` and
`app.json` disagree. A tag with a suffix (`v1.1.0-beta.1`) becomes a GitHub
pre-release.

What the release does, in order:

1. **Checks:** the whole of `ci.yml`, against the tagged commit.
2. **Backend:** deploys to Vercel if `DEPLOY_BACKEND` is `true`, then
   smoke-tests the live backend (`/api/stations`, `/api/nearby`,
   `/api/board`, privacy policy). The backend goes before the app, because the
   new app may need endpoints the old backend lacks (section 7).
3. **Builds:** two EAS builds in parallel. `production` makes the `.aab` for
   Play and `preview` makes an installable `.apk`. Both wait for EAS to finish
   (up to 2 hours with queueing) and are downloaded.
4. **Play:** if `PLAY_SUBMIT` is `true`, submits the `.aab` to the internal
   track. Promote it in Play Console.
5. **GitHub Release:** created with both files attached and notes generated
   from the merged PRs since the last tag. It's skipped if the Play
   submission failed.

To retry a failed release after fixing the cause: Actions → Release → Run
workflow, and enter the tag. Re-running uploads replacement files to an
existing release.

### One-time setup

**Expo:**

1. Create an access token: expo.dev → Account settings → Access tokens.
2. Run one production build locally (`eas build -p android --profile
   production`) so EAS creates the keystore; CI can't answer that prompt.
3. Set the API URL for the build environments (section 3):
   `eas env:set --name EXPO_PUBLIC_API_BASE_URL --value https://<backend> --environment production --visibility plaintext`,
   and the same for `preview`.

**GitHub** (repo Settings → Secrets and variables → Actions):

| Name | Kind | Needed for | Value |
| --- | --- | --- | --- |
| `EXPO_TOKEN` | Secret | Builds, submit | The Expo access token |
| `BACKEND_URL` | Variable | Smoke test | e.g. `https://nextgleis.vercel.app`, no trailing slash. Leave unset to skip |
| `DEPLOY_BACKEND` | Variable | Backend deploy | `true` to deploy from the release. Leave unset if Vercel's GitHub integration already deploys `main` |
| `VERCEL_TOKEN` | Secret | Backend deploy | vercel.com → Account settings → Tokens |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Secrets | Backend deploy | From `backend/.vercel/project.json` after `vercel link` |
| `PLAY_SUBMIT` | Variable | Play upload | `true` once the app exists in Play Console |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Secret | Play upload | The full JSON key of the Play service account |

The backend-deploy, build and submit jobs run in a GitHub environment called
`production`, created automatically on the first run. To require an approval
before anything ships, add yourself as a required reviewer under Settings →
Environments → production. Secrets can also be moved into that environment so
only release jobs can read them.

**Branch protection:** under Settings → Branches, require the `App` and
`Backend` checks on `main`.

### Cost

The repo is public, so GitHub Actions minutes are free. Each release uses two
EAS Android builds from the plan's monthly allowance. Check usage on
expo.dev → Billing before raising the release cadence.

---

## 9. Over-the-air updates (not set up yet)

`expo-updates` isn't installed, so every JS fix currently needs a store
release. To enable OTA updates:

```sh
npx expo install expo-updates
eas update:configure                     # sets updates.url, channels in eas.json
```

Use `"runtimeVersion": { "policy": "fingerprint" }` in `app.json`: the runtime
version changes whenever native code changes, so an update can never land on a
build that lacks the native code it needs. Then:

```sh
eas update --channel production --environment production --message "Fix board sorting"
```

Use rollouts (`--rollout-percentage`) for anything risky, and
`eas update:rollback` if it goes wrong. Native changes (new native dependency,
`app.json` plugin or permission change, SDK upgrade) still need a new build.

---

## 10. Monitoring and operations

### What to watch

| Signal | Where |
| --- | --- |
| Backend errors, latency, timeouts | Vercel → project → Logs / Observability |
| Crashes and ANRs | Play Console → Android vitals |
| Build failures | expo.dev → project → Builds |
| User reports | Play Console reviews |

Backend status codes to recognise in logs (`backend/lib/http.ts`):

| Code | Meaning |
| --- | --- |
| 400 | Missing query parameter — an app bug |
| 404 | Stop not found on any network |
| 502 | A network answered with an error |
| 504 | A network didn't answer in time |
| 500 | Unhandled error — read the stack trace |

### Runbook

**Search returns no results for a region.** One network is down or blocking.
Check the Vercel logs for errors from that network, try it again later, and
look at whether it now rejects the user agent (see THINGS_TO_KNOW.md). If it's
gone for good, remove it from `backend/lib/hafas/networks.ts` and redeploy —
no app release needed.

**Everything is slow or 504s.** Upstream is slow. The caches absorb repeated
queries, but each warm instance has its own cache (`backend/lib/cache.ts`), so
under heavy, spread-out traffic the hit rate drops. If that becomes a
problem, swap the `Map` for a shared store (Upstash Redis / Vercel KV) behind
the same `cached()` function.

**App can't reach the backend at all.** Check that the build had
`EXPO_PUBLIC_API_BASE_URL` set (section 3) and that the Vercel deployment and
domain are live.

**Bad backend deploy.** Vercel → Deployments → previous good deployment →
Promote to Production (or `vercel rollback`). Takes seconds.

**Bad app release.** Halt the staged rollout in Play Console. Fix, bump
`version`, rebuild, resubmit. (With OTA set up, a JS-only fix can go out with
`eas update` instead.)

**Lost access to the keystore.** Don't. It lives in EAS credentials; back it
up with `eas credentials -p android` → Download, and store the file in a
password manager. With Play App Signing enabled (default for new apps), Google
can reset a lost upload key, but it takes days.

---

## 11. Security checklist

- [ ] No secrets in `EXPO_PUBLIC_*` variables or in git (`.env`,
      `google-service-account.json`, `*.jks`, `*.p8` are gitignored)
- [ ] DB credentials only in Vercel env vars, marked sensitive
- [ ] `HAFAS_USER_AGENT` identifies the deployment with a URL or contact address
- [ ] `npm audit --omit=dev` clean in both packages
- [ ] Keystore backed up outside EAS
- [ ] Privacy policy URL live before each Play submission
- [ ] Data-safety form declares approximate/precise location (used for nearby
      stops, sent to the backend, not stored or shared)
- [ ] Backend responses set `Access-Control-Allow-Origin: *` — fine for public,
      read-only data; revisit if the API ever gains write endpoints or user data

---

## 12. Known gaps / backlog

| Gap | Impact | Fix |
| --- | --- | --- |
| API URL not set in EAS yet | Cloud builds fall back to `10.0.2.2` | `eas env:set`, section 3 |
| No OTA updates | Every JS fix needs a store release | Section 9 |
| No automated tests | Regressions found manually | Start with backend unit tests for `normalize.ts`, `merge.ts`, `lines.ts` |
| Per-instance cache | Lower hit rate under load | Shared KV store |
| No iOS `bundleIdentifier` | Can't build for iOS | Add `ios.bundleIdentifier` to `app.json` |
| No crash reporting in-app | Only Play vitals | Add Sentry (`@sentry/react-native`) or EAS Observe |
