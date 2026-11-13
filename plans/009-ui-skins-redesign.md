# Plan 009: New UI — one layout ("Bahnsteig"), three skins

> **Executor instructions**: Follow this plan phase by phase, step by step.
> Run every verification command and confirm the expected result before the
> next step. If anything in "STOP conditions" occurs, stop and report — do not
> improvise. One phase is one work session: finish its checks, commit, write
> the handoff lines at the end of this file, then stop. When a phase is done,
> update its row in the "Phases" table below and the row for this plan in
> `plans/README.md`.
>
> **Drift check (run first, every phase)**:
> `git log --oneline -1 -- lib/theme.ts lib/journeySteps.ts app/journey.tsx components/JourneyCard.tsx`
> Compare the "Current state" section with the live code. If a file named
> there does not exist or differs in shape, treat it as a STOP condition.

## Status

- **Priority**: P1 (the look the app launches with)
- **Effort**: L — five phases
- **Risk**: MEDIUM. No backend change, no new native module. All screens are touched.
- **Depends on**: the connection-screen work on the local branch
  `feat/routes-journey-detail` being committed and rebased onto `main` (see
  "Prerequisite"). It is not on `main` and not pushed.
- **Category**: design / UI
- **Planned at**: 2026-11-13, against the working tree of
  `feat/routes-journey-detail` (base commit `ed2548c` plus uncommitted
  connection-screen work). `main` was at `ea5028c`, which contains `ed2548c`
  plus Expo patch updates, the MIT licence and handoff notes.

## Decisions already made by the owner (2026-11-13) — do not reopen

1. **Base design is C · "Bahnsteig"** from `docs/design/ui-directions.html`:
   the platform number is the largest thing on a row, in station-sign blue,
   next to a countdown ("6 min").
2. **One idea is taken from B**: the proportional line bar on the connection
   list (each ride a coloured segment as wide as the ride is long).
3. **A · "Anzeiger" and B · "Netzplan" ship as skins.** A skin changes colour,
   type and corner shape. **A skin never changes layout.** The A and B layouts
   in the mockup file are reference only. Do not build them.
4. The five colour themes (indigo, mauve, neutral, teal, blue) and the three
   styles (classic, modern, sharp) are **removed**. Light / dark / high
   contrast stay. Anzeiger is dark only.

Open the mockup file in a browser before any UI step. The third row (C) is
the build target.

## Why this matters

NextGleis ("next platform") is a departure-board and route app for German
public transport. The current look is clean but generic: dark cards, indigo
accent, nothing a rider would recognise. The rider's real question on a
station is "which platform, and how long do I have". The new layout answers
that first on every row. The two extra skins give the app a recognisable
identity without three sets of screens to maintain.

## Prerequisite (Phase 0, owner or first executor)

The working tree of `feat/routes-journey-detail` holds uncommitted, tested
work this plan builds on: `app/journey.tsx`, `lib/journeySteps.ts`,
`lib/useJourneys.ts`, `test/journeySteps.test.ts`, a rewritten
`components/JourneyCard.tsx`, three tabs instead of four, stop search on Home.

- If `git status --short` on `feat/routes-journey-detail` is not clean: ask
  the owner to commit it. Do not commit it yourself unless the owner says so.
- Rebase it onto `main`: `git fetch origin && git rebase origin/main`. No
  conflict is expected (`main`'s newer commits touch package versions, docs
  and CI). Then `npm install` and run every command in "Commands you will
  need". On a conflict or a red check, STOP.
- Then: `git switch -c feat/ui-skins feat/routes-journey-detail`.
- If those files are already on `main` when you start (the owner merged the
  connection-screen work), skip the above and branch from `origin/main`.

## Phases

| Phase | Content | Executor | Status |
| --- | --- | --- | --- |
| 1 | Skin system: tokens, palettes, fonts, settings. Old layout, new skins. | Sonnet, medium | TODO |
| 2 | Shared building blocks: platform tile, countdown, line bar, sign header, pure helpers + tests | Sonnet, medium | TODO |
| 3 | Screens rebuilt on the building blocks | Opus, high, with emulator | TODO |
| 4 | Home: saved routes show their next departure | Sonnet, medium | TODO |
| 5 | Device check of every skin, handoff | Opus, with emulator | TODO |

Each phase leaves the app working and all checks green. Phases run in order.

## Current state (verified 2026-11-13)

Stack: Expo SDK 57 (read https://docs.expo.dev/versions/v57.0.0/ before code,
see `AGENTS.md`), Expo Router, React 19 with the React Compiler, TanStack
Query v5, Zustand, Reanimated 4. Android is the tested platform.

**Theme** — `lib/theme.ts`:

- `Palette` type: `background, foreground, card, muted, mutedForeground,
  border, input, primary, primaryForeground, accent, accentForeground, ring`.
- `palettes: Record<ThemeName, { light: Palette; dark: Palette }>` for the
  five colour themes.
- `meaning.light` / `meaning.dark`: status colours (`onTime`, `delay`,
  `cancelled` and their `*Soft`), `shadowCard`, `shadowRaised`, `serviceDb`,
  `serviceDbOn`, and `product` (eight product kinds, each `{ bg, fg }`).
- `ThemeColors = Palette & meaning & { skeleton }`.
- `highContrast(colors, isDark)` pushes text to 7:1 with `ensureContrast` and
  `mix` from `lib/contrast.ts`.
- `baseType`: 22 named text styles (`largeTitle` … `timeSmall`).
- `buildType(style)`, `buildRadii(style)` (`sm, md, lg, xl, pill`),
  `MODERN_FONTS` (Manrope + Raleway files), `spacing`, `Theme`
  (`name, style, isDark, colors, type, radii`), `buildTheme(options)`,
  `themeSwatch(name, isDark)`, `THEME_NAMES`, `UI_STYLES`.

**Consumers of the theme names** (all must change in Phase 1):
`types/index.ts` (`ColorTheme`, `UiStyle`, `AppSettings.colorTheme`,
`AppSettings.uiStyle`), `lib/storage.ts` (defaults + validation in
`getSettings`), `lib/settingsStore.ts` (`setColorTheme`, `setUiStyle`,
`applyColorScheme`), `lib/useTheme.ts`, `app/_layout.tsx`
(`useFonts(MODERN_FONTS)`), `app/(tabs)/settings.tsx` (swatch grid and style
`SegmentedControl`), `lib/i18n/en.ts` + `lib/i18n/de.ts` (`settings.colorTheme`,
`settings.theme.*`, `settings.uiStyle`, `settings.style.*`).

**Screens**: `app/(tabs)/index.tsx` (Home: title, `SearchField`, Nearby,
favourite stations, favourite routes), `app/(tabs)/routes.tsx` (From/To card,
time button, `JourneyList`, saved-routes list when an end is empty),
`app/(tabs)/settings.tsx`, `app/board/[evaNo].tsx`, `app/trip/[id].tsx`,
`app/journey.tsx`, `app/onboarding.tsx`, `app/+not-found.tsx`. Root stack in
`app/_layout.tsx`; tabs in `app/(tabs)/_layout.tsx` (`NativeTabs`, three
triggers).

**Connection logic** (do not change behaviour): `lib/useJourneys.ts`
(`useJourneys(search, subscribed)` → `{ query, journeys }`),
`lib/journeySteps.ts` (`journeySteps(legs)` → ride / walk / transfer steps,
`Transfer.status: 'ok' | 'tight' | 'missed'`).

**Time helpers** — `lib/time.ts`: times from the backend are Berlin wall-clock
strings `"YYYY-MM-DDTHH:mm:ss"`. `berlinNow()` returns "now" in the same
form, so the two compare as plain strings. `addMinutes(wall, n)`,
`minutesBetween(a, b)`, `formatTime(wall)`.

**Tests**: `npm test` runs `node --test "test/**/*.test.ts"` with Node's type
stripping. A test can only import a `lib/` file whose own value imports
resolve under Node: explicit `.ts` extension, or type-only imports. That is
why `lib/theme.ts` (imports `./contrast` without extension, `require`s font
files) cannot be imported from a test. See `test/journeySteps.test.ts` for
the pattern.

Conventions: comments say *why*, in full sentences. Components take the theme
from `useTheme()` and build styles in a `createStyles(theme)` function under
`useMemo`. Strings go through `useT()`; `lib/i18n/de.ts` is typed against
`en.ts`, so a key missing in either fails the typecheck. Inline one-time
logic; extract only what is reused.

## Commands you will need

| Purpose | Command | Expected |
| --- | --- | --- |
| Install | `npm install` | exit 0 |
| Typecheck | `npm run typecheck` | exit 0 |
| Tests | `npm test` | `ℹ fail 0` |
| Lint | `npm run lint` | no new errors (see note) |
| Format | `npm run format:check` | no new files listed (see note) |
| Web bundle (import check) | `npx expo export --platform web --output-dir <temp dir>` | `Exported:` |

Note on lint/format: on a Windows working copy, `plugins/withShortCxxPath.js`
fails with CRLF errors (`Delete ␍`) and `scripts/sync-app-version.mjs` has one
`no-console` warning. Both exist before this plan. Anything else is yours.

**Emulator (Phases 3 and 5)** — notes from 2026-11-13 on the owner's machine:

- `JAVA_HOME` may point to a removed JDK. If Gradle says so, export
  `JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.21.9-hotspot"` for
  the command.
- First run: `scripts\run-android.cmd` (boots `Pixel_8_Pro`, builds, installs).
  Later runs: start the emulator, `adb reverse tcp:8081 tcp:8081`,
  `adb reverse tcp:3000 tcp:3000`, `npx expo start --dev-client`, open the app.
- The app needs the local backend: `npm start` in `backend/`.
- This plan adds no native module, so no rebuild is needed after the first one.
- A test route with two changes: Frankfurt Hbf → Darmstadt Schloss.

## Scope

**In scope**: `lib/theme.ts`, new `lib/palettes.ts`, `lib/useTheme.ts`,
`lib/navigationTheme.ts`, `lib/settingsStore.ts`, `lib/storage.ts`,
`lib/time.ts`, `lib/journeySteps.ts`, new `lib/useNow.ts`, `types/index.ts`,
`lib/i18n/en.ts`, `lib/i18n/de.ts`, everything in `app/` and `components/`,
`test/`, `package.json` + lockfile (font packages only), `docs/ROADMAP.md`,
`README.md`, `docs/HANDOFF.md`.

**Out of scope**:

- `backend/` — no change. If a step seems to need one, STOP.
- Separate layouts per skin (decision 3).
- Live departures of nearby stops on Home (the mockup shows them; not now).
- A "plan a route from here" button on a board.
- The rule for the "Tight connection" warning (`TIGHT_MINUTES` in
  `lib/journeySteps.ts`) — open owner decision, leave as is.
- iOS-specific tuning. Keep iOS compiling; do not test it.
- Any new native module or anything that needs a native rebuild.

## Git workflow

- Branch: `feat/ui-skins` (see "Prerequisite" for its base).
- One commit per step, plain imperative subject that says what the user gets
  ("Show the platform as a sign tile on departures"). End each message with a
  blank line and `Assisted-by: Claude`.
- Do NOT push or open a PR unless the owner says so.

---

# Phase 1 — Skin system

Goal: the app keeps today's layout, but colour, type and shape come from one
of three skins. Settings offers the three skins. Nothing else changes.

## The token contract

`Palette` gains six tokens. Every component names roles only, so later phases
never mention a skin by name.

| Token | Role |
| --- | --- |
| `header`, `headerForeground` | The top band of a screen and the native stack header |
| `sign`, `signForeground` | The platform tile (the station sign) |
| `highlight`, `highlightForeground` | The step the rider is on now; one per screen at most |

### Palettes (all pairs checked at WCAG AA 4.5:1 on 2026-11-13)

Put these in a new file `lib/palettes.ts` — pure data, type-only imports, so
the test in step 1.2 can import it.

```ts
// bahnsteig.light
background '#F7F8FA', foreground '#0C1A33', card '#FFFFFF', muted '#E6E9EF',
mutedForeground '#56617A', border '#E3E6EC', input '#C5CCD9',
primary '#0B2F7A', primaryForeground '#FFFFFF', accent '#E3EAF8',
accentForeground '#0B2F7A', ring '#5B84D6',
header '#0B2F7A', headerForeground '#FFFFFF',
sign '#0B2F7A', signForeground '#FFFFFF',
highlight '#FFD21F', highlightForeground '#0C1A33'

// bahnsteig.dark
background '#0A1020', foreground '#EEF2FA', card '#131B30', muted '#1C2640',
mutedForeground '#9AA6C0', border '#232E4A', input '#36425F',
primary '#8FB0FF', primaryForeground '#0A1020', accent '#1A2A55',
accentForeground '#B4C8FF', ring '#3D63C4',
header '#0E2A66', headerForeground '#FFFFFF',
sign '#1746A8', signForeground '#FFFFFF',
highlight '#FFD21F', highlightForeground '#0C1A33'

// anzeiger (one palette; used for light and dark alike)
background '#0A0A0B', foreground '#F2EFE6', card '#121213', muted '#1D1D1F',
mutedForeground '#9A9586', border '#2A2A2C', input '#45443F',
primary '#FFB400', primaryForeground '#0A0A0B', accent '#2A2208',
accentForeground '#FFC83D', ring '#FFB400',
header '#0A0A0B', headerForeground '#FFB400',
sign '#0B3D91', signForeground '#FFFFFF',
highlight '#FFB400', highlightForeground '#0A0A0B'

// netzplan.light
background '#F3EFE6', foreground '#15130F', card '#FBF8F1', muted '#E6E0D2',
mutedForeground '#5C5749', border '#D8D2C2', input '#B9B2A0',
primary '#15130F', primaryForeground '#F3EFE6', accent '#E6E0D2',
accentForeground '#15130F', ring '#8F8A7D',
header '#F3EFE6', headerForeground '#15130F',
sign '#15130F', signForeground '#F3EFE6',
highlight '#FFD84A', highlightForeground '#15130F'

// netzplan.dark
background '#14120E', foreground '#F3EFE6', card '#1E1B15', muted '#2A261E',
mutedForeground '#A8A191', border '#332E24', input '#4D473A',
primary '#F3EFE6', primaryForeground '#14120E', accent '#2A261E',
accentForeground '#F3EFE6', ring '#7A7466',
header '#14120E', headerForeground '#F3EFE6',
sign '#F3EFE6', signForeground '#14120E',
highlight '#FFD84A', highlightForeground '#15130F'
```

### Status colours

- Bahnsteig and Netzplan: keep today's `meaning.light` / `meaning.dark`
  status values unchanged.
- Anzeiger (amber is its primary, so delay must not be amber):
  `onTime '#6FD98A'`, `onTimeSoft '#0F2A18'`, `delay '#FF8A4C'`,
  `delaySoft '#33190A'`, `cancelled '#FF6B7A'`, `cancelledSoft '#3A1218'`.

### Product (line badge) colours

Solid fills with white text replace today's soft tints, in light and dark:

```ts
highSpeed '#3730A3', longDistance '#6D28D9', regional '#C8102E',
suburban '#15803D', metro '#1D4ED8', tram '#B0127A', bus '#475569',
other '#5A6178'      // each as { bg: <value>, fg: '#FFFFFF' }
```

- Bahnsteig and Netzplan use this set.
- Anzeiger: every product is `{ bg: '#F2EFE6', fg: '#0A0A0B' }` (the board is
  monochrome; the label carries the meaning).

### Shadows and DB pill

- Bahnsteig keeps today's `shadowCard` / `shadowRaised` per mode.
- Anzeiger and Netzplan are flat: both shadows are
  `'0px 0px 0px rgba(0, 0, 0, 0)'`.
- `serviceDb` / `serviceDbOn` unchanged in every skin.

### Type

| Skin | Font | Rules |
| --- | --- | --- |
| bahnsteig | system | `baseType` as today |
| anzeiger | IBM Plex Mono | Family by weight: 400, 500, 600, 700; a token with weight 800 uses 700. Drop `fontWeight` (as `buildType` does for Modern today). Subtract 1 from `fontSize` on every token with `fontSize >= 14` (mono is wide). Add `textTransform: 'uppercase'` and `letterSpacing: 0.3` to: `largeTitle, title, display, headline, headlineMedium, subheadBold, subheadMedium, subhead, calloutBold, calloutMedium, overline`. Running text (`body, footnote*, caption*, micro*, input`) keeps its case. |
| netzplan | Archivo | Family by weight: 400, 500, 600, 700, 800. Drop `fontWeight`. `largeTitle` gets `letterSpacing: -1.2`, `title` `-0.9`. |

Font packages: `@expo-google-fonts/ibm-plex-mono` and
`@expo-google-fonts/archivo` (both exist on npm, checked 2026-11-13). They
replace `@expo-google-fonts/manrope` and `@expo-google-fonts/raleway`. Fonts
load at runtime through `expo-font`; this is not a native change.

Until a skin's font files are loaded (or if loading failed), that skin uses
the system font — same fallback rule as today's Modern style.

### Shape

`buildRadii(skin)` returns `sm, md, lg, xl, pill, round`:

| Skin | sm | md | lg | xl | pill | round |
| --- | --- | --- | --- | --- | --- | --- |
| bahnsteig | 8 | 12 | 17 | 24 | 999 | 999 |
| anzeiger | 0 | 0 | 0 | 0 | 0 | 999 |
| netzplan | 3 | 4 | 6 | 8 | 999 | 999 |

`round` is new: for things that must stay a circle in every skin (dots on a
stop rail, the spinner well). `pill` may be square (Anzeiger).

## Steps

### Step 1.1 — Types, palettes file

1. `types/index.ts`: add `export type Skin = 'bahnsteig' | 'anzeiger' | 'netzplan';`.
   Remove `ColorTheme` and `UiStyle`. In `AppSettings`, replace `colorTheme`
   and `uiStyle` with `skin: Skin;` (comment: "The look: colours, type and
   corner shape. See lib/theme.ts.").
2. Create `lib/palettes.ts` exporting:
   - `SKINS: Skin[] = ['bahnsteig', 'anzeiger', 'netzplan']`
   - `type Palette` (moved from `theme.ts`, with the six new tokens)
   - `PALETTES: Record<Skin, { light: Palette; dark: Palette }>` — Anzeiger's
     `light` and `dark` are the same object.
   - `STATUS: Record<Skin, { light: …; dark: … }>` and
     `PRODUCT: Record<Skin, …>` with the values above.
   Only `import type` at the top of this file.

**Verify**: typecheck will fail in the consumers — expected until step 1.4.

### Step 1.2 — Contrast test

Create `test/palettes.test.ts` (pattern: `test/journeySteps.test.ts`). Import
`PALETTES`, `STATUS`, `PRODUCT`, `SKINS` from `../lib/palettes.ts` and
`contrastRatio` from `../lib/contrast.ts`. For every skin and both modes
assert `contrastRatio >= 4.5` for each pair:

```
foreground/background  foreground/card  foreground/muted
mutedForeground/background  mutedForeground/card  mutedForeground/muted
primary/background  primary/card  primaryForeground/primary
accentForeground/accent  headerForeground/header  signForeground/sign
highlightForeground/highlight
onTime/background  onTime/card  onTime/onTimeSoft
delay/background   delay/card   delay/delaySoft
cancelled/background  cancelled/card  cancelled/cancelledSoft
every product: fg/bg
```

**Verify**: `npm test` → the new test passes with the values above. If a pair
fails, you mistyped a value; do not lower the threshold.

### Step 1.3 — `lib/theme.ts`

1. Remove `palettes`, `meaning`'s status and product parts, `THEME_NAMES`,
   `UI_STYLES`, `themeSwatch`, `MODERN_FONTS`, `MANROPE`, `ThemeName`.
   Import the data from `./palettes`.
2. `ThemeColors` = `Palette` + status + shadows + `serviceDb*` + `product` +
   `skeleton` (same shape as today plus the six new tokens).
3. `buildColors(skin, isDark, contrast)`. In `highContrast()`, also run
   `ensureContrast` at 7:1 for `headerForeground` on `header`,
   `signForeground` on `sign`, `highlightForeground` on `highlight`.
4. `SKIN_FONTS`: the `require(...)` map for the nine font files (IBM Plex Mono
   400/500/600/700, Archivo 400/500/600/700/800). File layout inside the
   packages is `<weight name>/<Family>_<weight name>.ttf`, as Manrope's is
   today; confirm with `ls node_modules/@expo-google-fonts/archivo` and adapt
   the paths if it differs.
5. `buildType(skin, fontsLoaded)` and `buildRadii(skin)` per the tables above.
6. `Theme` becomes `{ skin, isDark, colors, type, radii, statusBarStyle }`.
   `statusBarStyle: 'light' | 'dark'` = `'light'` when
   `contrastRatio(colors.header, '#FFFFFF') >= 3`, else `'dark'`. (Used from
   Phase 3; define it now.)
7. `buildTheme({ skin, isDark, highContrast, fontsLoaded })`. For Anzeiger,
   treat `isDark` as `true` whatever is passed.
8. `skinSwatch(skin, isDark)` → `{ background, sign, highlight, foreground }`
   for the Settings picker.
9. Replace the header comment: the tokens still follow the shadcn convention;
   a skin is a set of values for them plus a type and a shape rule.

Install fonts first:
`npm uninstall @expo-google-fonts/manrope @expo-google-fonts/raleway` and
`npm install @expo-google-fonts/ibm-plex-mono @expo-google-fonts/archivo`.

### Step 1.4 — Store, storage, hook, layout

1. `lib/storage.ts`: default `skin: 'bahnsteig'`; validation
   `if (!SKINS.includes(settings.skin)) settings.skin = defaultSettings.skin;`.
   Drop the stored legacy keys `colorTheme` and `uiStyle` from the object
   returned by `getSettings` (the app is not on the store yet; no migration
   beyond this). Import `SKINS` from `./palettes`.
2. `lib/settingsStore.ts`: replace `setColorTheme`/`setUiStyle` with
   `setSkin(skin)`. `applyColorScheme(mode, skin)`: Anzeiger forces `'dark'`
   so native dialogs and the keyboard match; call it from `hydrate`,
   `setThemeMode` and `setSkin`. Update the two key lists in `update`.
3. `lib/useTheme.ts`: read `skin`; `isDark` is `true` for Anzeiger;
   `fontsLoaded` = `isLoaded` of that skin's 400 family (Bahnsteig: `true`).
4. `app/_layout.tsx`: `useFonts(SKIN_FONTS)`; update the comment.
5. Search for leftovers: `theme.name`, `theme.style`, `colorTheme`, `uiStyle`,
   `radii.pill` on anything that must stay round (stop-rail dots in
   `app/trip/[id].tsx` and `app/journey.tsx`, `ActivityIndicator` wells) →
   `radii.round`.

**Verify**: `npm run typecheck` fails only in `app/(tabs)/settings.tsx` and
the i18n files → next step.

### Step 1.5 — Settings and strings

1. `app/(tabs)/settings.tsx`, Appearance section:
   - Replace the colour-theme swatch grid with a skin picker: three options,
     each a pressable with the `skinSwatch` colours, the skin name, selected
     state (`accessibilityState={{ selected }}`). Under it, one line of text:
     the selected skin's description.
   - Remove the Style control and its paragraph.
   - When the skin is Anzeiger, hide the System/Light/Dark control and show
     `settings.skinDarkOnly` in its place.
2. Strings — remove `settings.colorTheme`, `settings.theme.*`,
   `settings.uiStyle`, `settings.style.*` from both catalogs. Add:

| Key | en | de |
| --- | --- | --- |
| `settings.skin` | Design | Design |
| `settings.skin.bahnsteig` | Bahnsteig | Bahnsteig |
| `settings.skin.anzeiger` | Anzeiger | Anzeiger |
| `settings.skin.netzplan` | Netzplan | Netzplan |
| `settings.skin.bahnsteigText` | Station-sign blue. The platform comes first. | Bahnhofsschild-Blau. Das Gleis steht vorn. |
| `settings.skin.anzeigerText` | Black and amber, like a departure board. Always dark. | Schwarz und Bernstein wie eine Anzeigetafel. Immer dunkel. |
| `settings.skin.netzplanText` | Paper and ink, with lines like a network map. | Papier und Tinte, Linien wie im Netzplan. |
| `settings.skinDarkOnly` | Anzeiger has one appearance: dark. | Anzeiger gibt es nur in Dunkel. |

**Verify (end of Phase 1)**: typecheck exit 0; `npm test` fail 0; lint and
format show nothing new; the web bundle exports. Commit. On a device (if you
have one): each skin selectable, text readable, no crash on restart.

---

# Phase 2 — Shared building blocks

Goal: the parts every screen in Phase 3 is made of, each small and testable.
No screen changes in this phase except where a step says so.

### Step 2.1 — Pure helpers + tests

1. `lib/time.ts`: add

   ```ts
   // Whole minutes from `now` until a scheduled time plus its delay. Both are
   // Berlin wall-clock strings; negative once it has passed.
   export function minutesUntil(wall: string, delayMinutes: number | undefined, now: string): number
   ```

   Round down (`Math.floor`): "6 min" means at least six full minutes.
   Tests in `test/time.test.ts`: on time, delayed, passed, across midnight.

2. `lib/journeySteps.ts`: add

   ```ts
   // The ride the rider is on or waiting for: the first ride whose realtime
   // arrival is still ahead. -1 once the last ride has arrived.
   export function currentRideIndex(steps: readonly JourneyStep[], now: string): number
   // One entry per ride, for the proportional bar on a connection card.
   export function lineBarSegments(legs: readonly JourneyLeg[]): { line: string; minutes: number }[]
   ```

   `currentRideIndex` returns an index into `steps`. Tests in
   `test/journeySteps.test.ts`: before departure → first ride; between rides
   → the next ride; after arrival → -1; a delayed arrival keeps the ride
   current. `lineBarSegments`: skips walks, minutes ≥ 1.

3. Create `lib/useNow.ts`:

   ```ts
   // "Now" as a Berlin wall-clock string, refreshed every 15 seconds while
   // `active`. One per screen: passing it down keeps every countdown on a
   // screen in step and lets the screen stop the clock when out of view.
   export function useNow(active: boolean): string
   ```

   `useState(berlinNow)` + an interval in an effect keyed on `active`;
   refresh once when `active` turns true.

**Verify**: `npm test` → fail 0, with the new cases listed.

### Step 2.2 — `components/PlatformTile.tsx`

The sign with the platform number. Props:

```ts
type Props = {
  platform?: string;          // "11", "17 Ost", "103"
  plannedPlatform?: string;   // set only when the platform changed
  kind?: ServiceKind;         // picks the icon when there is no platform
  tone?: 'sign' | 'quiet' | 'highlight';   // default 'quiet'
  label?: string;             // default t('platform.label')
};
```

- Size: width 64, `alignSelf: 'stretch'`, content centred, min height 56.
- Tones: `sign` → `colors.sign` / `signForeground`; `quiet` → `colors.muted`
  / `foreground`; `highlight` → `colors.highlight` / `highlightForeground`.
- With a platform: label on top (`type.microBold`, uppercase, 75 % opacity),
  number below (`type.title`, `numberOfLines={1}`, `adjustsFontSizeToFit`,
  `minimumFontScale={0.5}` — "17 Ost" must fit).
- Changed platform: background `colors.delaySoft`, text `colors.delay`, and
  the planned platform struck through under the number (`type.micro`). This
  overrides the tone.
- No platform (most bus and tram stops): no label; an Ionicons glyph by
  `kind` — `train-outline` for `db` / `rail`, `bus-outline` for `transit` or
  undefined — in the `quiet` tone whatever tone was asked.
- Not an accessibility element itself; the row it sits in carries the label.
- Strings: `platform.label` — en `Platform`, de `Gleis`.

### Step 2.3 — `components/Countdown.tsx`

Props: `{ time: string; delayMinutes?: number; now: string; cancelled?: boolean }`.

| `minutesUntil(...)` | Shows |
| --- | --- |
| cancelled | nothing (return `null`) |
| `< 0` or `>= 60` | the realtime clock time, `type.timeSmall` |
| `0` | `t('countdown.now')` in `type.headline` |
| `1 … 59` | the number in `type.title`, `t('countdown.min')` under it in `type.micro` |

Right-aligned, min width 44. Number in `colors.delay` when
`delayMinutes > 0`, else `colors.foreground`. Strings: `countdown.now` — en
`now`, de `jetzt`; `countdown.min` — en `min`, de `Min.`. Also add
`countdown.label` for accessibility: en `` (minutes) => `in ${minutes} minutes` ``,
de `` `in ${minutes} Minuten` `` — exported helper
`countdownLabel(time, delay, now, t)` returns that or the clock time, for the
parent row's `accessibilityLabel`.

### Step 2.4 — `components/LineBar.tsx`

Props: `{ legs: JourneyLeg[] }`. A row, height 18, gap 3. One segment per
entry of `lineBarSegments(legs)`: `flex` = `Math.max(minutes, total * 0.14)`
(a two-minute bus must still show its label), background and text from
`colors.product[productKind(line)]`, `borderRadius: radii.sm`, label =
the line name, `type.microBold`, `numberOfLines={1}`, horizontal padding 5.
`accessible={false}`.

### Step 2.5 — `components/SignHeader.tsx` and header search field

```ts
type Props = { overline?: string; title: string; right?: ReactNode; children?: ReactNode };
```

- A band in `colors.header`: `paddingTop: insets.top + spacing.md`,
  horizontal `spacing.lg`, bottom `spacing.md`, gap `spacing.sm`.
- `overline` in `type.overline` at 75 % opacity, `title` in `type.title`,
  both `colors.headerForeground`; title has `accessibilityRole="header"`.
- `right` sits on the title row, right-aligned (the star, a clear button).
- `children` go under the title (search field, From/To card).
- A screen that uses it renders `<ScreenContainer edges={[]}>` — the header
  owns the top inset.

`components/SearchField.tsx`: add `tone?: 'default' | 'header'`. In `header`
tone the field background is `mix(colors.header, colors.headerForeground,
0.14)`, text and icons `colors.headerForeground`, placeholder the same at
70 % opacity, focus border `colors.headerForeground`.

**Verify (end of Phase 2)**: typecheck, tests, lint, format, web bundle.
Commit per step. The new components are unused until Phase 3 — that is
expected.

---

# Phase 3 — Screens

Goal: every screen matches row C of the mockup file. Executor: Opus, with the
emulator. Check each step on the device in **Bahnsteig light** first, then
switch through the other four appearances before committing.

General rules for all steps:

- Use tokens and the Phase 2 components only. Never branch on `theme.skin`
  in a screen or component. If a skin looks wrong, fix its tokens.
- Every tappable row keeps one combined `accessibilityLabel` that now also
  states the platform and the countdown (`countdownLabel`).
- One `useNow(isFocused)` per screen; pass `now` down as a prop.
- Keep all data logic, query keys, polling and navigation as they are.
- Touch targets ≥ 44 pt. Text must survive the system font at 130 %.

### Step 3.1 — Stack header and status bar

`app/_layout.tsx`: stack `headerStyle.backgroundColor` → `colors.header`,
`headerTintColor` and title colour → `colors.headerForeground`.
`<StatusBar style={theme.statusBarStyle} />`. `app/onboarding.tsx` and
`app/+not-found.tsx` have no header band: each renders its own
`<StatusBar style={isDark ? 'light' : 'dark'} />`.
`lib/navigationTheme.ts`: no change expected; confirm the transition
background still matches.

### Step 3.2 — Connection card and Routes screen

`components/JourneyCard.tsx` — one row, tile flush with the card's left edge
(`overflow: 'hidden'` on the card, no padding on that side):

```
[PlatformTile tone=sign]  19:24 – 19:59                 [Countdown]
 first ride's platform    [LineBar]
 and kind                 On time · 2 changes · ⚠
```

New prop `now: string`. Tile data: first riding leg's `departurePlatform`,
`plannedDeparturePlatform`, `kind`. Countdown: `journey.departure` +
`journey.departureDelayMinutes`, `cancelled`. The chain of `LineBadge`s and
the chevron go away. The card stays `memo`.

`app/(tabs)/routes.tsx`:

- `SignHeader` with `title={t('routes.title')}`; the From/To card moves into
  the header as `children` (card colours stay `colors.card`); the star moves
  to `right`.
- **New: a clear button** in `right`, shown when `from` or `to` is set
  (Ionicons `close`, label `routes.clear` — en `Clear start and destination`,
  de `Start und Ziel löschen`). It sets both to `null` and the trip time to
  "leave now". Reason: today the saved-routes list can only be reached after
  an app restart (found in the device test of 2026-11-13).
- `JourneyList`: `const now = useNow(isFocused)`; pass to each card.
- Saved-routes rows and the station picker: restyle with tokens only.

### Step 3.3 — Connection screen (`app/journey.tsx`)

Keep `JourneyScreen` / `JourneyDetail`, the snapshot logic and `openTrip`.
Replace the body below the summary:

```
[progress: one segment per ride; done = primary, rest = border]

NOW                                   ← overline, only above the current ride
┌ highlight card ────────────────────────────────┐
│ [PlatformTile tone=highlight]  RB 82 to Erbach │
│  11                Frankfurt Hbf · 19:24   [6] │   ← Countdown
└────────────────────────────────────────────────┘
THEN
[PlatformTile quiet, label=Exit] Da. Nordbahnhof · arrive 19:43
- - Change · 5 min · Platform 4 → 13 - -              ← existing Change block
[PlatformTile sign] Tram 6 to Eberstadt · 19:48 → Luisenplatz 19:55
…
```

- Each ride renders two rows: **board** (tile = departure platform; line
  badge, direction, origin, departure time and realtime; pressable → trip,
  as today) and **exit** (tile `quiet` with `label={t('journey.exit')}` and
  the arrival platform; destination, arrival time and realtime).
- The current ride (`currentRideIndex(steps, now)`): its board row is the
  highlight card — background `colors.highlight`, all text
  `colors.highlightForeground`, tile `tone="highlight"`, with a `Countdown`.
  Overline `journey.now` above it, `journey.then` above the rest. When the
  index is -1 (arrived), no highlight and no overlines.
- Rides before the current one: 55 % opacity (same value the trip screen
  uses for passed stops).
- The `Change` block keeps its text and its tight / missed tints; give it a
  dashed border in `colors.input`.
- Walks at the two ends: as today.
- Notices and "Cancelled" stay on the board row.
- Strings: `journey.exit` — en `Exit`, de `Ausstieg`; `journey.now` — en
  `Now`, de `Jetzt`; `journey.then` is taken (a list separator) → use
  `journey.next` — en `Then`, de `Danach`.

### Step 3.4 — Home (`app/(tabs)/index.tsx`)

- `SignHeader` with `title="NextGleis"`; the `SearchField` inside it with
  `tone="header"`. Search behaviour unchanged (stop → board).
- `components/FavoriteCard.tsx`: the round icon well becomes a
  `PlatformTile` with no platform and `kind="rail"` for both card kinds
  (Phase 4 gives route cards a real platform). Tile flush left, as on the
  connection card.
  Reorder / remove controls unchanged.
- `components/NearbySection.tsx` and section headers: tokens only.

### Step 3.5 — Board rows

`components/DepartureListItem.tsx` and `components/ArrivalListItem.tsx`:

```
[PlatformTile quiet]  [LineBadge] Direction                [Countdown]
 platform / planned   19:24 · On time   (+ notices below)
```

New prop `now`. `app/board/[evaNo].tsx`: `useNow(isFocused)`, pass it down;
`components/BoardSkeleton.tsx` follows the new row shape. The mode control,
filter chips, banner and sheets: tokens only.

### Step 3.6 — Settings, trip, onboarding

- `app/(tabs)/settings.tsx`: `SignHeader` with the title; rest unchanged.
- `app/trip/[id].tsx`: no structural change. The rider's own stop row uses
  `colors.highlight` / `highlightForeground` instead of `accent`.
- `app/onboarding.tsx`, `app/+not-found.tsx`: confirm they read well in all
  five appearances; fix with tokens.

**Verify (end of Phase 3)**: all checks green; on the emulator, the flow
Home → search → board → trip, and Routes → connection → ride → trip, in each
of the five appearances (Bahnsteig light/dark, Anzeiger, Netzplan
light/dark). Commit per step.

---

# Phase 4 — Saved routes show their next departure (Home)

Goal: the top of Home answers "when does my usual train leave, from which
platform" without a tap.

1. `components/FavoriteRouteCard.tsx`: new props `live: boolean`, `now: string`.
   When `live`, call
   `useJourneys({ fromId: fromEva, toId: toEva, when: null, arrival: false, regionalOnly }, isFocused)`
   (`regionalOnly` = the Deutschlandticket setting; `isFocused` from
   `useIsFocused()`). Because hooks cannot be conditional, split the card:
   a small inner component that calls the hook and is rendered only when
   `live`.
2. The next connection = the first journey that is not cancelled and whose
   departure (plus delay) is not before `now`. From it: `PlatformTile
   tone="sign"` with the first ride's platform and kind; a second text line
   `` `${first ride's line} · ${formatTime(departure)}` ``; a `Countdown`.
   The card still opens the Routes screen with this route, as today — the
   search is the same query key, so the list is there at once.
3. While loading, offline, on error, or with no connection: the card looks
   exactly like a non-live card. No spinner, no error text.
4. `app/(tabs)/index.tsx`: `live` is `true` for the **first three** saved
   routes only (by `order`). `useNow(isFocused)` for the countdowns.
   Reason for the cap: each live card is one journey search per minute
   against the upstream planners; the backend caches for 60 s.
5. Accessibility label of a live card: route, line, platform,
   `countdownLabel`.

**Verify**: checks green. On the emulator with the local backend: save a
route, go Home, see platform and countdown; backend log shows one
`/api/journeys` per saved route per minute while Home is in view and none
while another tab is open.

---

# Phase 5 — Device check and handoff

Executor: Opus with the emulator. No new features.

1. Run the matrix. For each of the five appearances, with high contrast off
   and on: Home (empty and with favourites), search results, board
   (departures + arrivals), trip, Routes (empty, saved list, results),
   connection (with a tight change — night connections from Frankfurt Hbf
   to Darmstadt Schloss have one), Settings, onboarding (clear app data).
2. Once each in German, and once with the system font size at 130 %.
3. Look for: clipped platform numbers ("17 Ost", "103"), countdown column
   jumping, uppercase German overflow in Anzeiger, unreadable text on the
   highlight card, status-bar icons invisible on a header.
4. Fix what you find with tokens or component changes. A fix that needs a
   skin-specific branch in a screen is a STOP condition.
5. Save one screenshot per skin of Home, Routes results and the connection
   screen to `docs/design/screens/` (PNG, named `<skin>-<screen>.png`).
6. Update `docs/ROADMAP.md` (new rows under Phase 2 for the redesign and the
   live route cards), `README.md` (features list: skins replace themes),
   `docs/HANDOFF.md` (what is done, what is next, open decisions), and the
   status rows in this file and `plans/README.md`.

---

## STOP conditions (all phases)

- A file named in "Current state" is missing or shaped differently
  (`lib/journeySteps.ts`, `lib/useJourneys.ts`, `app/journey.tsx` are the
  likely ones if the prerequisite was skipped).
- A step seems to need a change in `backend/`, a new native module, or a
  native rebuild.
- A screen cannot be made right in all skins without `if (theme.skin === …)`
  in a screen or component.
- A contrast test fails with the values typed exactly as given here.
- A font package does not contain the weights listed (report which).
- Typecheck, tests or the web bundle fail and the cause is outside this
  plan's scope.
- You are about to change behaviour: query keys, polling intervals,
  navigation targets, stored data other than `skin`.

## Open decisions for the owner (defaults are in the plan; say if they change)

1. **Fonts**: IBM Plex Mono (Anzeiger) and Archivo (Netzplan). Both are SIL
   Open Font License. Any other pair works if it has the same weights.
2. **Live route cards (Phase 4)**: cap of three, one search per minute each.
   Drop the phase if the upstream load is a concern (see
   `docs/research/licensed-data-sources.md` on the planners' terms).
3. **"Tight connection" rule**: today any change of two minutes or less is
   flagged, also ones the planner itself proposed. Alternative: flag only
   when a delay made it shorter. Not part of this plan.
4. **Skin names** in Settings are the German words in both languages
   (Bahnsteig, Anzeiger, Netzplan). They are names, like the app's.

## Handoff log

_(Each phase adds three lines here: what was done, what the next phase needs
to know, anything left open.)_
