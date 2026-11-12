# Plan 007: Report app errors with EAS Observe, with a switch to turn it off and an honest privacy policy

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e96b32d..HEAD -- app/_layout.tsx "app/(tabs)/settings.tsx" lib/settingsStore.ts lib/storage.ts types/index.ts lib/i18n/en.ts lib/i18n/de.ts backend/privacy-policy.html package.json`
> Plans 002, 003 and 004 may have landed first: 002 adds a `test` script to
> `package.json`, 003 adds one `board.*` key to each i18n catalog. Those are
> expected. Any other change to the "Current state" excerpts is a STOP.
>
> **Project rule (AGENTS.md)**: Expo has changed. Read the versioned docs
> before writing code: https://docs.expo.dev/versions/v57.0.0/sdk/observe/ and
> https://docs.expo.dev/eas/observe/get-started/.

## Status

- **Priority**: P1 (roadmap 0.4, launch blocker)
- **Effort**: M
- **Risk**: MEDIUM — adds a native module (needs a new build) and changes a public privacy promise
- **Depends on**: none. Same branch/sequence as 003 (i18n catalogs). Run before 006 (both edit `docs/DEVOPS.md`).
- **Category**: feature / ops
- **Planned at**: commit `e96b32d`, 2026-11-11

## Why this matters

NextGleis (Expo SDK 57 / React Native 0.86, Android first) is about to get its
first store release. Today nothing tells the developer that the app failed on
a rider's phone: an uncaught JavaScript error kills the app silently, and the
only signal is Play Console's Android vitals, which needs many users and shows
minified stacks.

This plan adds `expo-observe` (EAS Observe, Expo's own service — the project
already builds with EAS, so there is no new vendor, account or key):

- Uncaught JS errors and render errors are reported with stack traces.
- A render error shows a "Something went wrong / Try again" screen instead of
  closing the app.
- Startup timings (launch, first render, interactive) come for free.

**The cost, stated plainly.** Every record carries a random per-installation
ID, a per-launch session ID, device model, OS version, language tag, app
version; Expo stores it 90–120 days along with the IP address and the country
derived from it. The current privacy policy says "no device identifiers" and
"no analytics SDKs … if this ever changes, this policy will be updated first".
So this plan also (a) rewrites those policy sections, (b) adds a Settings
switch, on by default, that stops all sending, and (c) writes down the Play
Data safety answers. Nothing about stops, searches, routes or location is
sent: the navigation integration, custom events and network traces stay off.

**What it does not cover.** In the SDK 57 line of `expo-observe`, native
crashes (the process dying outside JS) are not reported — Android vitals
remains the source for those and for ANRs.

## Current state

- `package.json`: `"expo": "~57.0.30"`, `"expo-router": "~57.0.28"`; no
  `expo-observe`, no Sentry. Scripts: `typecheck`, `lint`, `format:check`.
- `app.json`: `extra.eas.projectId` is set (required by Observe). No change
  to `app.json` is needed — `expo-observe` has no config plugin.
- `app/_layout.tsx` (99 lines). Relevant parts:

```tsx
import { useEffect } from 'react';
...
import { useTheme } from '@/lib/useTheme';

setupNetworkStatusForQueries();
...
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors, isDark, type } = useTheme();
  ...
  const hydrated =
    favoritesHydrated && routesHydrated && settingsHydrated && (fontsLoaded || !!fontError);
  ...
  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navigationTheme}>
            <Stack
              screenOptions={{ ... }}
            >
              ...
            </Stack>
          </ThemeProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- Settings are one object, persisted whole. A setting lives in **four** places;
  `locationEnabled` is the model to copy:
  - `types/index.ts:171` — `locationEnabled: boolean;` in `AppSettings`
  - `lib/storage.ts:61` — `locationEnabled: true,` in `defaultSettings`
  - `lib/settingsStore.ts` — in the `SettingsState` type (`setLocationEnabled`),
    in **both** destructuring lists inside `update` (`:35-54`), in the initial
    state (`:65`), and the setter (`:95`):
    `setLocationEnabled: (locationEnabled) => update({ locationEnabled }),`
  - `lib/settingsStore.ts:13-15,68-76` — the pattern for a setting with a side
    effect: `applyColorScheme(mode)` is a module function, called in `hydrate`
    after the stored settings are read and in `setThemeMode` before `update`.
- `app/(tabs)/settings.tsx:301-316` — the Privacy card:

```tsx
        <Card
          icon="lock-closed-outline"
          title={t('settings.privacy')}
          styles={styles}
          colors={colors}
        >
          <View style={styles.cardBody}>
            <Text style={styles.paragraph}>{t('settings.privacyText')}</Text>
          </View>
          <LinkRow
            label={t('settings.privacyPolicy')}
            url={PRIVACY_POLICY_URL}
```

  and the switch row to copy, `:245-257` (Location card):

```tsx
          <View style={[styles.cardBody, styles.switchRow]}>
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>{t('settings.useLocation')}</Text>
              <Text style={styles.paragraph}>{t('settings.useLocationText')}</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={toggleLocation}
              accessibilityLabel={t('settings.useLocation')}
              trackColor={{ false: colors.input, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
```

- i18n: `lib/i18n/en.ts` defines type `Messages`; `lib/i18n/de.ts` is typed
  `Messages`, so a key missing in either fails `npm run typecheck`. Settings
  keys end at `'settings.privacyPolicy'` (en `:259`, de `:267`).
- `components/EmptyState.tsx` — `EmptyState({ icon, title?, message, fill? })`,
  `icon` is an Ionicons name.
- `backend/privacy-policy.html` — English only, served by the backend
  deployment. `Last updated: October 7, 2026` at `:25`. The sentence at
  `:53-55` ("No account identifiers, device identifiers, or personal data are
  attached to these requests …") is about the app's *own backend* requests and
  stays true. The section to replace is `:79-83`:

```html
  <h2>No analytics, no advertising, no tracking</h2>
  <p>
    NextGleis does not include analytics SDKs, advertising SDKs, or third-party trackers of any
    kind. If this ever changes in a future version, this policy will be updated first.
  </p>
```

- `docs/ROADMAP.md:41` — `| 0.4 | Crash reporting | ☐ | Sentry or EAS Observe |`
- `docs/DEVOPS.md:428` — `| Crashes and ANRs | Play Console → Android vitals |`
  and `:499` — `| No crash reporting in-app | Only Play vitals | Add Sentry (`@sentry/react-native`) or EAS Observe |`
- Library facts (from the v57 API reference and the EAS Observe docs, read at
  plan time — re-check against the installed package):
  - `expo-observe` npm dist-tag `sdk-57` is `57.0.27`; `npx expo install`
    picks the SDK-matched version.
  - Exports used here: `Observe`, `ObserveRoot`, `ObserveErrorBoundary`,
    `useObserve`.
  - `ObserveRoot.wrap(Component)` wraps the root layout and measures first render.
  - `useObserve()` returns `{ markInteractive }`; only the first call per
    session is recorded.
  - `Observe.configure({ dispatchingEnabled: boolean })` — master switch;
    while `false`, pending data is dropped, not queued. Each `configure` call
    replaces the previous configuration. Default when never called: on.
  - A global handler for uncaught JS errors is installed when the package is
    first imported; no code needed.
  - `<ObserveErrorBoundary fallback={({ error, resetError }) => …}>` records a
    render error and renders the fallback; `resetError()` re-mounts the children.
  - Debug builds (`__DEV__` or a native debug build) never dispatch unless
    `dispatchInDebug: true`. Do not set it.
  - Data is sent when the app goes to the background, so applying the stored
    setting during hydration (milliseconds after start) is early enough.
  - It is a native module: not available in Expo Go; needs a new dev/release build.
  - EAS free plan covers Observe up to 10,000 monthly active users.

## Commands you will need

Run from the repo root.

| Purpose   | Command                     | Expected on success |
|-----------|-----------------------------|---------------------|
| Install   | `npm ci`                    | exit 0 |
| Add lib   | `npx expo install expo-observe` | adds `expo-observe` `~57.x` to `dependencies` |
| Typecheck | `npm run typecheck`         | exit 0 |
| Lint      | `npm run lint`              | 0 errors (on a Windows checkout, `Delete ␍` errors mean CRLF line endings in the working copy, not a code problem — run `npx prettier --write <file>` on files you touched) |
| Format    | `npm run format:check`      | passes |
| Deps      | `npx expo install --check`  | "Dependencies are up to date" |
| Doctor    | `npx expo-doctor`           | no failed checks |
| Tests     | `npm test` (only if plan 002 has landed) | `ℹ fail 0` |

## Scope

**In scope**: `package.json`, `package-lock.json`, `app/_layout.tsx`,
`app/(tabs)/settings.tsx`, `lib/settingsStore.ts`, `lib/storage.ts`,
`types/index.ts`, `lib/i18n/en.ts`, `lib/i18n/de.ts`,
`backend/privacy-policy.html`, `docs/ROADMAP.md`, `docs/DEVOPS.md`,
`docs/DATA_SAFETY.md` (create).

**Out of scope** (each one sends more data than the policy text below allows):
- `Observe.configure({ integrations: … })` — the Expo Router integration sends
  route params, which here are stop ids and names. Do not enable.
- `Observe.logEvent`, `setGlobalAttributes`, network traces, `sampleRate`.
- `Observe.reportError` in `catch` blocks — the app has almost none, by design.
- Sentry or any other SDK.
- `app.json`, `eas.json`, CI workflows.
- Running `eas build` or any `eas` command — the human does that (see Test plan).

## Git workflow

- Branch: `advisor/007-error-reporting` (or the batch branch the operator named).
- One commit per step, plain imperative message (e.g. "Report uncaught app
  errors through EAS Observe"). End each with a blank line and `Assisted-by: Claude`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Install

`npx expo install expo-observe`

**Verify**: `package.json` lists `expo-observe` with a `~57.` range;
`npx expo install --check` → up to date. Then confirm the exports exist:
`grep -rn "ObserveErrorBoundary\|ObserveRoot\|useObserve\|dispatchingEnabled" node_modules/expo-observe/build/*.d.ts | head` → all four names appear. If one is missing, STOP.

### Step 2: The setting

Add `diagnosticsEnabled: boolean`, default `true`, exactly where
`locationEnabled` is (see "Current state" — four places, including both
destructuring lists in `update`).

In `lib/settingsStore.ts`, add next to `applyColorScheme`:

```ts
import { Observe } from 'expo-observe';

// The one switch for everything expo-observe sends: error reports and startup
// timings. While off, pending data is dropped, not queued. Observe sends when
// the app goes to the background, so applying the stored value during
// hydration is early enough to honour an opt-out from the previous session.
function applyDiagnostics(enabled: boolean) {
  Observe.configure({ dispatchingEnabled: enabled });
}
```

Call `applyDiagnostics(settings.diagnosticsEnabled)` in `hydrate` right after
`applyColorScheme(settings.themeMode)`, and add the setter:

```ts
    setDiagnosticsEnabled: async (diagnosticsEnabled) => {
      applyDiagnostics(diagnosticsEnabled);
      await update({ diagnosticsEnabled });
    },
```

**Verify**: `npm run typecheck` → exit 0;
`grep -c "diagnosticsEnabled" lib/settingsStore.ts` → at least 6.

### Step 3: Root layout — measure startup, catch render errors

In `app/_layout.tsx`:

1. Import `{ ObserveErrorBoundary, ObserveRoot, useObserve } from 'expo-observe'`,
   `EmptyState` from `@/components/EmptyState`, `useT` from `@/lib/i18n`, and
   add `Pressable`, `Text`, `View` from `react-native`.
2. Change `export default function RootLayout()` to `function RootLayout()` and
   add at the end of the file: `export default ObserveRoot.wrap(RootLayout);`
3. In `RootLayout`, `const { markInteractive } = useObserve();` and extend the
   existing splash effect:

```tsx
  useEffect(() => {
    if (!hydrated) return;
    SplashScreen.hideAsync();
    // The stores and fonts are in, so the first screen can be used.
    markInteractive();
  }, [hydrated, markInteractive]);
```

4. Wrap the `<Stack>…</Stack>` element (inside `ThemeProvider`) in
   `<ObserveErrorBoundary fallback={({ resetError }) => <ErrorScreen onRetry={resetError} />}>`.
5. Add `ErrorScreen` in the same file, above `RootLayout` (used once, so it
   stays here rather than in `components/`):

```tsx
// What a render error leaves on screen instead of a closed app. The boundary
// has already reported the error; "Try again" re-mounts the navigator.
function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { colors, type } = useTheme();
  const t = useT();
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
      <EmptyState icon="alert-circle-outline" title={t('error.title')} message={t('error.message')} />
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={{ alignSelf: 'center', padding: 12 }}
      >
        <Text style={{ ...type.headline, color: colors.primary }}>{t('error.retry')}</Text>
      </Pressable>
    </View>
  );
}
```

   If lint rejects inline styles (`react-native/no-inline-styles`), move them
   to a `StyleSheet.create` for the static parts; `app/_layout.tsx` already
   uses an inline `style={{ flex: 1 }}`, so it should pass.

**Verify**: `npm run typecheck` → exit 0 (fails until Step 4 adds the keys —
do Step 4, then verify both).

### Step 4: Strings

Add to both catalogs. After `'common.done'`:

| Key | en | de |
|---|---|---|
| `error.title` | `Something went wrong` | `Etwas ist schiefgelaufen` |
| `error.message` | `The app hit an error. Your favorites are safe.` | `In der App ist ein Fehler aufgetreten. Deine Favoriten sind sicher.` |
| `error.retry` | `Try again` | `Erneut versuchen` |

After `'settings.privacyText'`:

| Key | en | de |
|---|---|---|
| `settings.diagnostics` | `Send error reports` | `Fehlerberichte senden` |
| `settings.diagnosticsText` | `Sends error reports and start-up times to help fix problems. No stops, searches, routes or location.` | `Sendet Fehlerberichte und Startzeiten, damit Probleme behoben werden können. Keine Haltestellen, Suchen, Routen oder Standorte.` |

Group the `error.*` keys under a `// Errors` comment in the style of the
other section comments.

**Verify**: `npm run typecheck` → exit 0.

### Step 5: Settings switch

In `app/(tabs)/settings.tsx`: read `diagnosticsEnabled` and
`setDiagnosticsEnabled` from the store like the other settings, and add a
switch row in the Privacy card between the `privacyText` body and the
`LinkRow`, copying the Location switch row (label `settings.diagnostics`,
text `settings.diagnosticsText`, `value={diagnosticsEnabled}`,
`onValueChange={setDiagnosticsEnabled}`).

**Verify**: `npm run typecheck` → exit 0; `npm run lint` → 0 errors;
`npx prettier --write app/_layout.tsx "app/(tabs)/settings.tsx" lib/settingsStore.ts lib/storage.ts types/index.ts lib/i18n/en.ts lib/i18n/de.ts`,
then `npm run format:check` → passes.

### Step 6: Web build still starts

The repo has a web target (`npm run web`). Check the new import doesn't break it:

`npx expo export --platform web --output-dir "$TMPDIR/ng-web-check"` (any
directory outside the repo) → exits 0.

If it fails on `expo-observe`, STOP and report the error text — do not add a
platform shim on your own.

### Step 7: Privacy policy

In `backend/privacy-policy.html`:

1. `:25` → `Last updated: November 11, 2026` (use the real date of the change).
2. Replace the whole "No analytics, no advertising, no tracking" section
   (`:79-83`) with:

```html
  <h2>Error reports and start-up times</h2>
  <p>
    To find and fix faults, NextGleis sends error reports and start-up timings to Expo
    (650 Industries, Inc.), the company whose tools build the app, using its EAS Observe
    service. A report contains the error message and the place in the app's code where it
    happened, how long the app took to start, your device model, operating system version
    and language setting, the app version, a random identifier for this installation of the
    app, and an identifier for the app session. Like any internet request, it also reveals
    your IP address, from which Expo derives the country. It does not contain the stops you
    search for or open, your routes, your favorites or your location.
  </p>
  <p>
    The installation identifier is random. It is not linked to your name, to an account or
    to your device's hardware, and it is not used to follow you across other apps. Expo
    processes this data on NextGleis's behalf and deletes it after 90 to 120 days. You can
    turn this off at any time in the app under Settings → Privacy → "Send error reports";
    nothing is sent while it is off.
  </p>

  <h2>No advertising, no tracking</h2>
  <p>
    NextGleis does not include advertising SDKs or cross-app trackers, and does not record
    which stops, lines or routes you look at. If this ever changes in a future version, this
    policy will be updated first.
  </p>
```

3. Leave `:53-55` and the contact section untouched.

**Verify**: `grep -c "analytics SDKs" backend/privacy-policy.html` → 0;
`grep -c "Send error reports" backend/privacy-policy.html` → 1.

### Step 8: Docs

1. `docs/ROADMAP.md:41` → `| 0.4 | Crash reporting | ☑ | EAS Observe (`expo-observe`): JS and render errors, startup timings; opt-out in Settings. Native crashes and ANRs stay with Android vitals. Needs a new native build |`
2. `docs/DEVOPS.md:428`: add a row above it
   `| JS errors and startup time | expo.dev → project → Observe, or `eas observe:metrics-summary` |`
   and delete the `:499` "No crash reporting in-app" gap row.
3. Create `docs/DATA_SAFETY.md`:

```markdown
# Google Play Data safety — answers for NextGleis

Draft for the Play Console form (roadmap 0.5). The developer is responsible
for the final answers; re-check after any change to what the app sends.
Source for the `expo-observe` rows:
https://docs.expo.dev/eas/observe/reference/store-privacy-declarations/

## Data collection and security

| Question | Answer |
| --- | --- |
| Does the app collect or share any of the required user data types? | Yes |
| Is all collected data encrypted in transit? | Yes (HTTPS only) |
| Can users request deletion? | No account or stored user record exists; diagnostics are deleted by Expo after 90–120 days. Answer per Google's current wording. |

## Data types

| Data type | Why | Collected / shared | Ephemeral | Required / optional | Purpose |
| --- | --- | --- | --- | --- | --- |
| App info and performance → Crash logs | `expo-observe` error reports | Collected | No | Optional (Settings → Privacy switch) | Analytics |
| App info and performance → Diagnostics | `expo-observe` startup timings | Collected | No | Optional | Analytics |
| Device or other IDs | `expo-observe` random installation ID | Collected | No | Optional | Analytics |
| Location → Approximate location | (1) country derived from IP by Expo; (2) position rounded to ~100 m sent to the NextGleis backend for "Nearby", not stored | Collected | (1) No; (2) Yes | Optional | (1) Analytics; (2) App functionality |

Not collected: name, email, contacts, precise location, search history,
app interactions (the navigation integration and custom events are off).

"Collected", not "shared": Expo acts as a service provider.
```

**Verify**: `npm run format:check` → passes (Prettier checks Markdown too; run
`npx prettier --write docs/DATA_SAFETY.md docs/ROADMAP.md docs/DEVOPS.md` first).

## Test plan

Automated: typecheck, lint, format, `npx expo install --check`,
`npx expo-doctor`, web export (Step 6), `npm test` if plan 002 landed.

Manual — **human only**, needs a release-mode build (debug builds never send):

1. `eas build --platform android --profile preview`, install the APK.
2. Open the app, press Home to background it. Within a few minutes
   expo.dev → project → Observe shows a session with startup metrics.
3. Settings → Privacy → turn "Send error reports" off, restart the app, use
   it, background it → no new session appears.
4. Optional: temporarily throw inside a screen's render in a throwaway build
   → the "Something went wrong" screen shows, "Try again" recovers, and the
   error appears under Observe.

If no build is made, say the manual check was not run. Do not mark the
dashboard check as done from the code alone.

## Done criteria

- [ ] `npm run typecheck` exits 0; `npm run lint` 0 errors; `npm run format:check` passes
- [ ] `npx expo install --check` up to date; `npx expo-doctor` clean
- [ ] `grep -n "ObserveRoot.wrap(RootLayout)" app/_layout.tsx` → 1 match
- [ ] `grep -rn "integrations\|logEvent\|dispatchInDebug" app lib components` → no matches from this change
- [ ] `grep -c "diagnosticsEnabled" types/index.ts lib/storage.ts` → 1 each
- [ ] Privacy policy has the new sections and a new date
- [ ] `docs/DATA_SAFETY.md` exists; ROADMAP 0.4 is ☑
- [ ] Only in-scope files changed
- [ ] `plans/README.md` status row updated

## STOP conditions

- `npx expo install expo-observe` resolves a version outside `57.x`.
- Any of `ObserveRoot`, `ObserveErrorBoundary`, `useObserve`, or the
  `dispatchingEnabled` option is missing from the installed package's types.
- The web export (Step 6) fails because of `expo-observe`.
- `npx expo-doctor` reports a new failure caused by the package.
- You find you need `app.json`, `eas.json` or a config plugin change.
- The privacy policy sections differ from the excerpts.

## Maintenance notes

- **Policy first.** Before turning on anything else in Observe (router
  integration, events, network traces, a newer SDK's native crash reports),
  update `backend/privacy-policy.html` and `docs/DATA_SAFETY.md`, and deploy
  the backend so the policy is live before the app build ships.
- The backend deploy (policy text) must go out before or with the first build
  that contains `expo-observe`.
- SDK 58's `expo-observe` adds native crash reports and `errorSampleRate`;
  revisit on the SDK upgrade.
- Reviewer: check that `configure` is called with `dispatchingEnabled` only,
  that the German strings fit the Settings card on a small screen, and that
  no stop id, name or coordinate can reach an Observe call.
