import type { TextStyle } from 'react-native';
import type { Skin } from '@/types';
import { contrastRatio, ensureContrast, mix } from './contrast';
import { PALETTES, PRODUCT, STATUS, type Palette } from './palettes';

// Tokens still follow shadcn/ui's convention: every surface token has a
// matching `*Foreground` for the text and icons drawn on it. A skin is a set
// of values for those tokens (lib/palettes.ts) plus a type rule and a shape
// rule (below). Components only ever name a role (`muted`, `sign`,
// `highlight`), so adding or changing a skin never touches a component.

export type ThemeColors = Palette &
  (typeof STATUS)[Skin]['light'] & {
    product: (typeof PRODUCT)[Skin];
    skeleton: string;
  };

// High contrast sharpens whichever skin is picked rather than replacing it:
// text moves to 7:1 (WCAG AAA) against every surface it sits on, and borders
// darken until a card's edge is visible without its shadow.
const AAA = 7;

function highContrast(colors: ThemeColors, isDark: boolean): ThemeColors {
  const ink = isDark ? '#FFFFFF' : '#000000';
  const surfaces = [colors.background, colors.card, colors.muted];
  // Badge text is white (or near-black on Anzeiger), so it is the fill that
  // moves: pushing white text toward black would make it worse, not better.
  const product = Object.fromEntries(
    Object.entries(colors.product).map(([key, { bg, fg }]) => [
      key,
      { bg: ensureContrast(bg, [fg], AAA, '#000000'), fg },
    ]),
  ) as ThemeColors['product'];
  // Header, sign and highlight text can be light on dark or dark on light in
  // any mode, so each pair moves toward whichever pole its own text is nearer.
  const pair = (text: string, bg: string) =>
    ensureContrast(
      text,
      [bg],
      AAA,
      contrastRatio(text, '#FFFFFF') > contrastRatio(text, '#000000') ? '#FFFFFF' : '#000000',
    );

  return {
    ...colors,
    foreground: ink,
    mutedForeground: ensureContrast(colors.mutedForeground, surfaces, AAA, ink),
    border: mix(colors.border, ink, 0.35),
    input: mix(colors.input, ink, 0.45),
    primary: ensureContrast(colors.primary, [colors.primaryForeground, colors.card], AAA, ink),
    accentForeground: ensureContrast(colors.accentForeground, [colors.accent], AAA, ink),
    headerForeground: pair(colors.headerForeground, colors.header),
    signForeground: pair(colors.signForeground, colors.sign),
    highlightForeground: pair(colors.highlightForeground, colors.highlight),
    onTime: ensureContrast(colors.onTime, [...surfaces, colors.onTimeSoft], AAA, ink),
    delay: ensureContrast(colors.delay, [...surfaces, colors.delaySoft], AAA, ink),
    cancelled: ensureContrast(colors.cancelled, [...surfaces, colors.cancelledSoft], AAA, ink),
    product,
  };
}

export function buildColors(skin: Skin, isDark: boolean, contrast: boolean): ThemeColors {
  const mode = isDark ? 'dark' : 'light';
  const palette = PALETTES[skin][mode];
  const colors = {
    ...palette,
    ...STATUS[skin][mode],
    product: PRODUCT[skin],
    skeleton: palette.border,
  };
  return contrast ? highContrast(colors, isDark) : colors;
}

// The swatch shown for each skin in Settings.
export function skinSwatch(skin: Skin, isDark: boolean) {
  const { background, sign, highlight, foreground } = PALETTES[skin][isDark ? 'dark' : 'light'];
  return { background, sign, highlight, foreground };
}

// Named steps for every (fontSize, fontWeight) pair actually in use across the
// app, so screens/components reference a token instead of a raw pair. Large
// steps carry negative tracking — at display sizes the system font's default
// tracking reads loose and dated.
const baseType = {
  largeTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.8 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  display: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  headline: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  headlineMedium: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  input: { fontSize: 16, fontWeight: '400' },
  subheadBold: { fontSize: 15, fontWeight: '700' },
  subheadMedium: { fontSize: 15, fontWeight: '600' },
  subhead: { fontSize: 15, fontWeight: '500' },
  calloutBold: { fontSize: 14, fontWeight: '700' },
  calloutMedium: { fontSize: 14, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400' },
  footnoteBold: { fontSize: 13, fontWeight: '700' },
  footnoteMedium: { fontSize: 13, fontWeight: '600' },
  footnote: { fontSize: 13, fontWeight: '400' },
  captionBold: { fontSize: 12, fontWeight: '700' },
  caption: { fontSize: 12, fontWeight: '400' },
  microBold: { fontSize: 11, fontWeight: '700' },
  micro: { fontSize: 11, fontWeight: '400' },
  // Section headers: small, wide-tracked, uppercase.
  overline: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  // Departure times. Tabular figures stop the minute digits from shifting the
  // column width between rows.
  time: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  timeSmall: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
} as const satisfies Record<string, TextStyle>;

type TypeKey = keyof typeof baseType;
export type TypeScale = Record<TypeKey, TextStyle>;

// Font files loaded in app/_layout.tsx. A custom font carries one weight per
// file, so each weight maps to its own family and `fontWeight` is dropped —
// left in, Android would fake a bolder cut on top of the real one.
export const SKIN_FONTS = {
  IBMPlexMono_400Regular: require('@expo-google-fonts/ibm-plex-mono/400Regular/IBMPlexMono_400Regular.ttf'),
  IBMPlexMono_500Medium: require('@expo-google-fonts/ibm-plex-mono/500Medium/IBMPlexMono_500Medium.ttf'),
  IBMPlexMono_600SemiBold: require('@expo-google-fonts/ibm-plex-mono/600SemiBold/IBMPlexMono_600SemiBold.ttf'),
  IBMPlexMono_700Bold: require('@expo-google-fonts/ibm-plex-mono/700Bold/IBMPlexMono_700Bold.ttf'),
  Archivo_400Regular: require('@expo-google-fonts/archivo/400Regular/Archivo_400Regular.ttf'),
  Archivo_500Medium: require('@expo-google-fonts/archivo/500Medium/Archivo_500Medium.ttf'),
  Archivo_600SemiBold: require('@expo-google-fonts/archivo/600SemiBold/Archivo_600SemiBold.ttf'),
  Archivo_700Bold: require('@expo-google-fonts/archivo/700Bold/Archivo_700Bold.ttf'),
  Archivo_800ExtraBold: require('@expo-google-fonts/archivo/800ExtraBold/Archivo_800ExtraBold.ttf'),
};

type FontFamily = keyof typeof SKIN_FONTS;

// Family by weight. Anzeiger has no 800: its 800 tokens use 700.
const PLEX_MONO: Record<string, FontFamily> = {
  '400': 'IBMPlexMono_400Regular',
  '500': 'IBMPlexMono_500Medium',
  '600': 'IBMPlexMono_600SemiBold',
  '700': 'IBMPlexMono_700Bold',
  '800': 'IBMPlexMono_700Bold',
};
const ARCHIVO: Record<string, FontFamily> = {
  '400': 'Archivo_400Regular',
  '500': 'Archivo_500Medium',
  '600': 'Archivo_600SemiBold',
  '700': 'Archivo_700Bold',
  '800': 'Archivo_800ExtraBold',
};

// The family a skin's regular weight is registered under; useTheme asks
// `isLoaded` for it. `undefined` means the skin uses the system font.
export const SKIN_FONT_PROBE: Record<Skin, FontFamily | undefined> = {
  bahnsteig: undefined,
  anzeiger: 'IBMPlexMono_400Regular',
  netzplan: 'Archivo_400Regular',
};

// Anzeiger sets labels in capitals like a departure board; running text keeps
// its case.
const ANZEIGER_UPPERCASE = new Set<TypeKey>([
  'largeTitle',
  'title',
  'display',
  'headline',
  'headlineMedium',
  'subheadBold',
  'subheadMedium',
  'subhead',
  'calloutBold',
  'calloutMedium',
  'overline',
]);

// Until a skin's font files are in (or if loading failed), its type rules
// still apply but the text stays in the system font, rather than naming a
// family the platform can't find.
function buildType(skin: Skin, fontsLoaded: boolean): TypeScale {
  if (skin === 'bahnsteig') return baseType;
  const families = skin === 'anzeiger' ? PLEX_MONO : ARCHIVO;
  const entries = Object.entries(baseType).map(([key, token]) => {
    const { fontWeight, ...rest } = token as TextStyle & { fontSize: number; fontWeight: string };
    let style: TextStyle = fontsLoaded
      ? { ...rest, fontFamily: families[fontWeight] }
      : { ...rest, fontWeight: fontWeight as TextStyle['fontWeight'] };
    if (skin === 'anzeiger') {
      // Mono is wide, so every size from 14 up gives one point back.
      if (rest.fontSize >= 14) style = { ...style, fontSize: rest.fontSize - 1 };
      if (ANZEIGER_UPPERCASE.has(key as TypeKey)) {
        style = { ...style, textTransform: 'uppercase', letterSpacing: 0.3 };
      }
    } else if (key === 'largeTitle') {
      style = { ...style, letterSpacing: -1.2 };
    } else if (key === 'title') {
      style = { ...style, letterSpacing: -0.9 };
    }
    return [key, style];
  });
  return Object.fromEntries(entries) as TypeScale;
}

// `round` is for things that must stay a circle in every skin (dots on a stop
// rail, the spinner well). `pill` may be square (Anzeiger).
function buildRadii(skin: Skin) {
  switch (skin) {
    case 'bahnsteig':
      return { sm: 8, md: 12, lg: 17, xl: 24, pill: 999, round: 999 };
    case 'anzeiger':
      return { sm: 0, md: 0, lg: 0, xl: 0, pill: 0, round: 999 };
    case 'netzplan':
      return { sm: 3, md: 4, lg: 6, xl: 8, pill: 999, round: 999 };
  }
}

export type Radii = ReturnType<typeof buildRadii>;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export type Theme = {
  skin: Skin;
  isDark: boolean;
  colors: ThemeColors;
  type: TypeScale;
  radii: Radii;
  // Icon colour for the status bar over the header band.
  statusBarStyle: 'light' | 'dark';
};

export function buildTheme(options: {
  skin: Skin;
  isDark: boolean;
  highContrast: boolean;
  fontsLoaded: boolean;
}): Theme {
  const { skin, highContrast: contrast, fontsLoaded } = options;
  // Anzeiger has one appearance, whatever the system or the user picked.
  const isDark = skin === 'anzeiger' ? true : options.isDark;
  const colors = buildColors(skin, isDark, contrast);
  return {
    skin,
    isDark,
    colors,
    type: buildType(skin, fontsLoaded),
    radii: buildRadii(skin),
    statusBarStyle: contrastRatio(colors.header, '#FFFFFF') >= 3 ? 'light' : 'dark',
  };
}
