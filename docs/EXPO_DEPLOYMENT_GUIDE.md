# Expo deployment guide

A reusable, step-by-step guide to taking any Expo app from a local project to
the Google Play Store and Apple App Store, and keeping it updated. Nothing here
is specific to NextGleis; for that, see [DEVOPS.md](./DEVOPS.md).

Written for Expo SDK 55+ (checked against SDK 57) and EAS CLI 16+. Expo moves
fast: when a command doesn't behave as described, check the versioned docs at
`https://docs.expo.dev/versions/v<your SDK>.0.0/`.

---

## 0. The mental model

An Expo app ships in two layers:

```
┌─────────────────────────────────────────────┐
│  Update layer   JS bundle + assets           │  ← can change over the air (EAS Update)
├─────────────────────────────────────────────┤
│  Native layer   compiled Kotlin/Swift/C++,   │  ← only changes with a new store build
│                 permissions, icons, plugins  │     (EAS Build → EAS Submit)
└─────────────────────────────────────────────┘
```

Every deployment decision comes down to: **did the native layer change?**

| You changed… | Ship it with |
| --- | --- |
| JS/TS code, images, copy | OTA update (`eas update`) |
| Added/upgraded a package with native code | New build + store submission |
| `app.json`: plugins, permissions, icon, splash, package name | New build + store submission |
| Expo SDK or React Native version | New build + store submission |
| An `EXPO_PUBLIC_*` value | OTA update or new build (it's inlined in the JS) |

The Expo services involved:

| Service | Does | Free tier? |
| --- | --- | --- |
| **EAS Build** | Compiles `.apk`/`.aab`/`.ipa` in the cloud, manages signing | Yes, limited builds/month |
| **EAS Submit** | Uploads builds to Play / App Store | Yes |
| **EAS Update** | Over-the-air JS updates | Yes, limited updates/month |
| **EAS Workflows** | CI/CD that chains the above | Yes, limited |
| **EAS Hosting** | Hosts Expo web exports and API routes | Yes, limited |

Everything EAS does can also be done locally (Gradle, Xcode, Transporter);
EAS just removes the need for a Mac and a hand-managed keystore.

---

## 1. One-time setup

### Accounts

| Account | Cost | Needed for |
| --- | --- | --- |
| [Expo](https://expo.dev/signup) | Free | All EAS services |
| [Google Play Console](https://play.google.com/console/signup) | One-time fee | Android store |
| [Apple Developer Program](https://developer.apple.com/programs/) | Yearly fee | iOS store, TestFlight, any iOS device build |

New personal Play accounts must run a **closed test with a minimum number of
testers for a minimum period** before production access is granted. Check
Play Console's current requirement and start early; it's the slowest step of a
first launch.

### Tools

```sh
npm install --global eas-cli
eas login
eas whoami
```

Node LTS, plus (only for local native builds) Android Studio + JDK 17, and on
macOS Xcode + CocoaPods.

### Link the project

```sh
eas init            # creates the project on expo.dev, writes extra.eas.projectId to app config
eas build:configure # creates eas.json
```

### Set identity in app config

These are permanent once published. Pick them carefully.

```json
{
  "expo": {
    "name": "My App",
    "slug": "my-app",
    "version": "1.0.0",
    "scheme": "myapp",
    "ios":     { "bundleIdentifier": "com.mycompany.myapp" },
    "android": { "package": "com.mycompany.myapp" }
  }
}
```

- `android.package` / `ios.bundleIdentifier`: reverse-DNS, unique, **cannot be
  changed** after the first store upload.
- `version`: the user-visible version (`1.4.2`). You bump it.
- Build numbers (`android.versionCode`, `ios.buildNumber`): let EAS manage
  them (section 2).

### Run the health checks once

```sh
npx expo install --check   # fixes package versions that don't match your SDK
npx expo-doctor            # flags config problems before a build does
```

---

## 2. `eas.json`: build profiles

A solid default that fits most apps:

```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "environment": "development",
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "environment": "preview",
      "channel": "preview",
      "android": { "buildType": "apk" }
    },
    "production": {
      "environment": "production",
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": { "track": "internal" },
      "ios": { "ascAppId": "<App Store Connect app ID>" }
    }
  }
}
```

What each piece does and why:

| Setting | Why |
| --- | --- |
| `appVersionSource: "remote"` | EAS stores build numbers server-side, so two people (or CI) can't upload the same `versionCode`. |
| `autoIncrement: true` | Bumps the build number on every production build. |
| `distribution: "internal"` | Produces something installable directly (APK / ad-hoc iOS) with a shareable link. |
| `buildType: "apk"` | APKs install directly; Play requires `.aab`, which is the default for other profiles. |
| `developmentClient: true` | Your own "Expo Go" containing your native modules. |
| `environment` | Which set of EAS environment variables the build gets (section 3). Set it explicitly. |
| `channel` | Which OTA updates the build listens to (section 6). Only needed with `expo-updates`. |
| `track: "internal"` | Submissions land on Play's internal track, not straight in front of users. |

---

## 3. Environment variables and secrets

### The three kinds of value

| Kind | Example | Where it goes |
| --- | --- | --- |
| Public client config | API base URL, feature flags | `EXPO_PUBLIC_*` — inlined into the JS bundle, **visible to anyone** |
| Build-time config | `APP_VARIANT`, Sentry auth token | Non-prefixed EAS variable, read in `app.config.js` or build scripts |
| Real secrets | Third-party API keys, DB passwords | **Never in the app.** Put them on a backend/API route and call that. |

A mobile binary can always be unpacked. If a key is in the app, assume it's
public.

### Store them in EAS

```sh
eas env:set --name EXPO_PUBLIC_API_URL --value https://api.example.com --environment production --visibility plaintext
eas env:set --name SENTRY_AUTH_TOKEN  --value ****                    --environment production --visibility sensitive
eas env:list --environment production
eas env:pull --environment development    # write them to a local .env for dev
```

Visibility: `plaintext` (anyone on the project can read), `sensitive`
(hidden in UI/logs, still readable by CLI), `secret` (never leaves EAS
servers; not available when resolving config locally).

### Gotchas

- **Your local `.env` is not uploaded to EAS Build** if it's gitignored (it
  should be). Cloud builds only see EAS variables. "Works locally, broken in
  the store build" is very often this.
- From SDK 55, `eas update` requires `--environment`, and then uses **only**
  EAS variables, ignoring `.env` files. That keeps updates and builds
  consistent.
- Changing an `EXPO_PUBLIC_*` value does nothing to installed apps until you
  ship a new build or update.

### App variants (optional)

To install dev, preview and production side by side, use `app.config.js`
with a different package name per variant:

```js
const variant = process.env.APP_VARIANT ?? 'production';
const suffix = variant === 'production' ? '' : `.${variant}`;

export default ({ config }) => ({
  ...config,
  name: variant === 'production' ? 'My App' : `My App (${variant})`,
  ios: { ...config.ios, bundleIdentifier: `com.mycompany.myapp${suffix}` },
  android: { ...config.android, package: `com.mycompany.myapp${suffix}` },
});
```

Set `APP_VARIANT` per EAS environment.

---

## 4. Building

### Development builds (day-to-day)

Expo Go only works if you use nothing beyond the Expo Go SDK. As soon as you
add a native library or config plugin, use a development build:

```sh
npx expo install expo-dev-client
eas build -p android --profile development   # install once on device/emulator
npx expo start                               # then iterate on JS as usual
```

Or locally: `npx expo run:android` / `npx expo run:ios`.

Rebuild the dev client whenever the native layer changes (table in section 0).

### Preview builds (testers)

```sh
eas build -p android --profile preview
eas build -p ios --profile preview          # needs devices registered: eas device:create
```

EAS gives you an install link and QR code. For iOS testers, TestFlight
(section 5) is usually easier than ad-hoc device registration.

### Production builds

```sh
eas build -p android --profile production   # .aab
eas build -p ios --profile production       # .ipa
eas build -p all --profile production       # both
```

The first Android production build asks to generate a keystore; let EAS do
it. The first iOS build logs into your Apple account and creates certificates
and provisioning profiles.

### Local builds (no EAS minutes, or offline)

```sh
eas build -p android --profile production --local   # same pipeline, your machine
# or plain native tooling:
npx expo prebuild --clean
cd android && ./gradlew bundleRelease
```

`--local` needs the full native toolchain installed and, for iOS, a Mac.

### Continuous Native Generation (CNG)

By default `android/` and `ios/` are generated from `app.json` + config
plugins during `prebuild`, and are best kept out of git. Benefits: SDK upgrades
regenerate native projects cleanly, and config lives in one place. If you
need a native tweak, write a **config plugin** (`plugins/*.js` using
`expo/config-plugins`) rather than editing generated files. If you do commit
`android/`/`ios/`, EAS builds them as-is and ignores native-affecting
`app.json` fields — pick one approach and stick with it.

---

## 5. Submitting to the stores

### Google Play

One-time:

1. Create the app in Play Console.
2. Create a **Google service account** with release permissions
   ([guide](https://expo.fyi/creating-google-service-account)), download the
   JSON key.
3. Upload it to EAS: `eas credentials -p android` → production →
   Google Service Account → Upload. (Keeps the key out of the repo and works in CI.)
4. Fill in store listing, content rating, target audience, **data safety**,
   and a **privacy policy URL**. Play won't let you leave draft without them.

Each release:

```sh
eas submit -p android --profile production            # pick a build
# or build and submit in one go:
eas build -p android --profile production --auto-submit
```

Then in Play Console, promote internal → closed → production. Use a **staged
rollout** (for example 10% → 50% → 100%) and watch Android vitals between
steps; you can halt a rollout but you can't un-ship one.

### Apple App Store

One-time:

1. Apple Developer Program membership.
2. Create the app in App Store Connect (bundle ID must match).
3. Create an **App Store Connect API key** (Users and Access → Integrations)
   and let EAS use it: `eas credentials -p ios`. Needed for unattended/CI
   submission.

Each release:

```sh
eas submit -p ios --profile production    # uploads to App Store Connect / TestFlight
```

The build appears in TestFlight after processing. Internal testers get it
right away; external testers need a short beta review. Submit for App Review
from App Store Connect with screenshots, description, privacy "nutrition
label", and review notes (include a demo login if the app needs one).

### Store checklist

- [ ] Icon, adaptive icon (Android), splash screen
- [ ] Screenshots for each required device size
- [ ] Privacy policy hosted at a public URL
- [ ] Data safety (Play) / privacy labels (Apple) match what the app actually does
- [ ] Permissions requested only when used, with clear purpose strings (iOS `infoPlist`)
- [ ] Target API level meets Play's current minimum (Expo SDKs track this; staying on a recent SDK keeps you compliant)
- [ ] Attribution for any data licences (e.g. CC BY)
- [ ] Version bumped in app config

---

## 6. Over-the-air updates (EAS Update)

### Set up once

```sh
npx expo install expo-updates
eas update:configure
```

In app config, set a runtime version policy:

```json
"runtimeVersion": { "policy": "fingerprint" }
```

| Policy | Runtime version changes when… | Use if |
| --- | --- | --- |
| `fingerprint` | Anything that affects native code changes (computed hash) | You want it to be impossible to send an incompatible update. **Recommended.** |
| `appVersion` | You bump `version` | You reliably bump `version` on every native change |
| manual string | You change it | You want full control |

Then build again (the build must contain `expo-updates`).

### Concepts

- **Channel** — baked into a build (`"channel": "production"` in `eas.json`).
- **Branch** — a stream of updates. By default channel `production` reads
  branch `production`.
- **Runtime version** — an update only goes to builds with the same runtime
  version.

### Publishing

```sh
eas update --channel preview    --environment preview    --message "Try new onboarding"
eas update --channel production --environment production --message "Fix crash on empty list"
```

Safer production practice:

```sh
eas update --channel production --environment production --rollout-percentage 10 --message "..."
# watch error rates on expo.dev, then raise the rollout, or:
eas update:rollback
```

By default the app checks for an update on cold start and applies it on the
**next** cold start. "I published but don't see it" usually means: close the
app fully and open it twice, or the build's channel/runtime version doesn't
match.

### What OTA can't do

It can't add native code, change permissions, icons or the package name, or
change the SDK. Store guidelines also expect OTA updates not to change an
app's core purpose. Use it for fixes and incremental features.

---

## 7. CI/CD

### Pipeline shape

```
PR opened ──▶ typecheck · lint · tests · expo install --check · expo-doctor
                │
merge to main ──▶ (same checks) ──▶ preview update or preview build for testers
                │
release trigger ─▶ fingerprint ─┬─ native changed ─▶ build ─▶ submit ─▶ stores
                                └─ JS only ────────▶ eas update (production)
```

### Option A: EAS Workflows (simplest)

Files in `.eas/workflows/*.yml`, run on EAS infrastructure, no tokens to
manage. This one, from the Expo docs, builds and submits only when the native
fingerprint changed, and otherwise sends an OTA update:

```yaml
# .eas/workflows/deploy-to-production.yml
name: Deploy to production
on:
  push:
    branches: ['main']

jobs:
  fingerprint:
    type: fingerprint
    environment: production
  get_android_build:
    needs: [fingerprint]
    type: get-build
    params:
      fingerprint_hash: ${{ needs.fingerprint.outputs.android_fingerprint_hash }}
      profile: production
  build_android:
    needs: [get_android_build]
    if: ${{ !needs.get_android_build.outputs.build_id }}
    type: build
    params: { platform: android, profile: production }
  submit_android:
    needs: [build_android]
    type: submit
    params:
      build_id: ${{ needs.build_android.outputs.build_id }}
  update_android:
    needs: [get_android_build]
    if: ${{ needs.get_android_build.outputs.build_id }}
    type: update
    environment: production
    params: { branch: production, platform: android }
```

Duplicate the `*_android` jobs with `ios` for iOS. Requires `expo-updates`
and the `fingerprint` runtime policy. Run manually with
`eas workflow:run deploy-to-production.yml`. Connect the GitHub repo in the
project's settings on expo.dev for push triggers.

### Option B: GitHub Actions (or any CI)

Create a token at expo.dev → Account settings → Access tokens, store it as
the `EXPO_TOKEN` repository secret.

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint .
      - run: npx expo install --check
      - run: npx expo-doctor

  release:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build -p android --profile production --non-interactive --no-wait --auto-submit
```

`--non-interactive` makes the CLI fail instead of prompting; `--no-wait` frees
the runner while EAS builds. Use GitHub Actions for checks and EAS Workflows
for builds if you want the best of both.

### Should every merge release?

Usually not to production. A good default:

- Every PR: checks.
- Every merge to `main`: OTA update to the `preview` channel (cheap, fast
  feedback for testers).
- A tag, `release` branch or manual trigger: production build/submit or
  production update.

---

## 8. Versioning strategy

| Field | Who changes it | When |
| --- | --- | --- |
| `version` (app config) | You | Every store release. Semver: patch = fixes, minor = features, major = big changes |
| `versionCode` / `buildNumber` | EAS (`autoIncrement`) | Every production build |
| `runtimeVersion` | `fingerprint` policy | Automatically, when native code changes |

Tag releases in git (`git tag v1.4.0`) so you can tell which commit is in which
store build. `eas build:list` and `eas update:list` show what's deployed.

---

## 9. Monitoring after release

| What | Where |
| --- | --- |
| Crashes, ANRs, startup time | Play Console → Android vitals; App Store Connect / Xcode Organizer |
| JS errors with stack traces | Sentry (`@sentry/react-native`) or EAS Observe |
| Update adoption and crash rate per update | expo.dev → Updates |
| Build history and logs | expo.dev → Builds, or `eas build:list` |
| Reviews | Both store consoles |

Upload source maps (Sentry does this from the build when configured) or
production stack traces will be unreadable.

---

## 10. Rollback playbook

| What broke | Do this |
| --- | --- |
| OTA update | `eas update:rollback` (or republish the previous update). Minutes. |
| Play release, still rolling out | Halt the staged rollout in Play Console, then ship a fixed build. |
| Play release at 100% | You can't revert a binary. Ship a fix: OTA if JS-only, otherwise new build with a higher `version`, expedited. |
| App Store release | Pause phased release in App Store Connect; ship a fix; request expedited review if severe. |
| Backend the app depends on | Roll the backend back (most hosts do this in one click). Keep backends backwards compatible so old app versions keep working. |

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Build works locally, fails on EAS | File gitignored or env var only in local `.env` | Add to EAS env vars; check `.easignore`/`.gitignore` |
| App crashes on launch after adding a library | Native module version mismatch | `npx expo install --check`, rebuild the dev client |
| Store build calls `localhost` | `EXPO_PUBLIC_*` not set for that EAS environment | `eas env:set ... --environment production`, rebuild |
| Update published but not showing | Channel or runtime version mismatch; update applies on next cold start | `eas update:list`, check build's channel, restart app twice |
| `versionCode` already used | Uploaded a build made outside EAS | `eas build:version:set -p android` |
| Play rejects APK | Play requires `.aab` | Production profile without `buildType: "apk"` |
| iOS build: provisioning error | Stale or missing profile | `eas credentials -p ios`, let EAS regenerate |
| Windows native build: path too long / ninja "still dirty" | Path length limit | Enable long paths, shorten the project path, or a config plugin that moves CMake's staging dir |
| `expo-doctor` warnings after SDK upgrade | Leftover deps or config | Follow its suggestions; `npx expo install --fix` |

---

## 12. Quick reference

```sh
# setup
npm i -g eas-cli && eas login
eas init && eas build:configure

# env
eas env:set --name KEY --value VAL --environment production --visibility plaintext
eas env:pull --environment development

# build
eas build -p android --profile development
eas build -p android --profile preview
eas build -p all --profile production
eas build -p android --profile production --local

# submit
eas submit -p android --profile production
eas build -p all --profile production --auto-submit

# OTA
npx expo install expo-updates && eas update:configure
eas update --channel production --environment production --message "..."
eas update:rollback

# inspect
eas build:list
eas update:list
eas build:version:get -p android
eas workflow:run <file>.yml

# health
npx expo install --check
npx expo-doctor
```
