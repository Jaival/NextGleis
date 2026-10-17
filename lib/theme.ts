import type { TextStyle } from 'react-native';
import type { ColorTheme, UiStyle } from '@/types';
import { ensureContrast, mix } from './contrast';

// Tokens follow shadcn/ui's convention: every surface token has a matching
// `*Foreground` for the text and icons drawn on it, and a theme is nothing but
// a set of values for those tokens. Components only ever name a role
// (`muted`, `accentForeground`), so swapping the colour theme never touches a
// component.
//
// Every pair below is contrast-checked at WCAG AA (4.5:1) for the small text
// that uses it, in light and dark. Re-check a pair if you change either half.
export type ThemeName = ColorTheme;
export const THEME_NAMES: ThemeName[] = ['indigo', 'mauve', 'neutral', 'teal', 'blue'];

type Palette = {
  background: string;
  foreground: string;
  // Raised surfaces: cards, list rows, sheets.
  card: string;
  // Inert fills (chips, platform pills, icon wells) and the text that sits on
  // them or anywhere else as secondary copy.
  muted: string;
  mutedForeground: string;
  border: string;
  // Stronger outline for form controls, switch tracks.
  input: string;
  primary: string;
  primaryForeground: string;
  // Selected and highlighted: active filter chips, icon wells, pressed rows.
  accent: string;
  accentForeground: string;
  // Focus outline for keyboard and web.
  ring: string;
};

// Values come from shadcn's base colours (converted from oklch), except Indigo,
// which is NextGleis's original palette. A few light `mutedForeground` values
// are a shade darker than shadcn's so they still pass on `muted`.
const palettes: Record<ThemeName, { light: Palette; dark: Palette }> = {
  indigo: {
    light: {
      background: '#F4F6FB',
      foreground: '#0F1320',
      card: '#FFFFFF',
      muted: '#EBEEF6',
      mutedForeground: '#5A6178',
      border: '#E3E7F0',
      input: '#CED5E4',
      primary: '#4F46E5',
      primaryForeground: '#FFFFFF',
      accent: '#E9E8FD',
      accentForeground: '#4338CA',
      ring: '#818CF8',
    },
    dark: {
      background: '#0A0C13',
      foreground: '#ECEFF8',
      card: '#141826',
      muted: '#1C2131',
      mutedForeground: '#98A1B8',
      border: '#232839',
      input: '#333A4F',
      primary: '#818CF8',
      primaryForeground: '#0A0C13',
      accent: '#1E2140',
      accentForeground: '#A5B4FC',
      ring: '#4F46E5',
    },
  },
  mauve: {
    light: {
      background: '#FFFFFF',
      foreground: '#0C090C',
      card: '#FFFFFF',
      muted: '#F3F1F3',
      mutedForeground: '#79697B',
      border: '#E7E4E7',
      input: '#D1CCD1',
      primary: '#1D161E',
      primaryForeground: '#FAFAFA',
      accent: '#F3F1F3',
      accentForeground: '#1D161E',
      ring: '#A89EA9',
    },
    dark: {
      background: '#0C090C',
      foreground: '#FAFAFA',
      card: '#1D161E',
      muted: '#2A212C',
      mutedForeground: '#A89EA9',
      border: '#2E262F',
      input: '#423A43',
      primary: '#E7E4E7',
      primaryForeground: '#1D161E',
      accent: '#2A212C',
      accentForeground: '#FAFAFA',
      ring: '#79697B',
    },
  },
  neutral: {
    light: {
      background: '#FFFFFF',
      foreground: '#0A0A0A',
      card: '#FFFFFF',
      muted: '#F5F5F5',
      mutedForeground: '#6A6A6A',
      border: '#E5E5E5',
      input: '#CECECE',
      primary: '#171717',
      primaryForeground: '#FAFAFA',
      accent: '#F5F5F5',
      accentForeground: '#171717',
      ring: '#A1A1A1',
    },
    dark: {
      background: '#0A0A0A',
      foreground: '#FAFAFA',
      card: '#171717',
      muted: '#262626',
      mutedForeground: '#A1A1A1',
      border: '#282828',
      input: '#3D3D3D',
      primary: '#E5E5E5',
      primaryForeground: '#171717',
      accent: '#262626',
      accentForeground: '#FAFAFA',
      ring: '#737373',
    },
  },
  teal: {
    light: {
      background: '#FAFAF9',
      foreground: '#0C0A09',
      card: '#FFFFFF',
      muted: '#F5F5F4',
      mutedForeground: '#6B645F',
      border: '#E7E5E4',
      input: '#D1CDCB',
      primary: '#00786F',
      primaryForeground: '#FFFFFF',
      accent: '#CBFBF1',
      accentForeground: '#005F5A',
      ring: '#00BBA7',
    },
    dark: {
      background: '#0C0A09',
      foreground: '#FAFAF9',
      card: '#1C1917',
      muted: '#292524',
      mutedForeground: '#A6A09B',
      border: '#2D2927',
      input: '#433F3C',
      primary: '#00D5BE',
      primaryForeground: '#022F2E',
      accent: '#022F2E',
      accentForeground: '#46ECD5',
      ring: '#009689',
    },
  },
  blue: {
    light: {
      background: '#FAFAFA',
      foreground: '#09090B',
      card: '#FFFFFF',
      muted: '#F4F4F5',
      mutedForeground: '#65656F',
      border: '#E4E4E7',
      input: '#CDCDD2',
      primary: '#155DFC',
      primaryForeground: '#FFFFFF',
      accent: '#EFF6FF',
      accentForeground: '#1447E6',
      ring: '#51A2FF',
    },
    dark: {
      background: '#09090B',
      foreground: '#FAFAFA',
      card: '#18181B',
      muted: '#27272A',
      mutedForeground: '#9F9FA9',
      border: '#28282C',
      input: '#3F3F45',
      primary: '#51A2FF',
      primaryForeground: '#09090B',
      accent: '#162456',
      accentForeground: '#8EC5FF',
      ring: '#155DFC',
    },
  },
};

// Colours that carry meaning are the same in every theme: status (on time /
// delayed / cancelled) and the product badges are the only other hues that
// ever appear on their own, so a coloured element in a departure row always
// means something, whichever theme is picked.
//
// Every `*Soft` value is a tint meant to sit *behind* its matching foreground.
const meaning = {
  light: {
    onTime: '#047857',
    onTimeSoft: '#D6F5E4',
    delay: '#A3480A',
    delaySoft: '#FCEFD3',
    cancelled: '#BE123C',
    cancelledSoft: '#FFE0E6',

    // `boxShadow` strings rather than the legacy shadow*/elevation props, which
    // don't render the same on the two platforms and can't be crossfaded.
    shadowCard: '0px 1px 2px rgba(15, 19, 32, 0.06)',
    shadowRaised: '0px 6px 20px rgba(15, 19, 32, 0.10)',

    // The "DB" service pill (components/ServicePill.tsx). DB's brand red in both
    // modes — it's a logo colour, not a status — and always a solid fill, so it
    // can't be mistaken for the text-only red of a cancellation.
    serviceDb: '#EC0016',
    serviceDbOn: '#FFFFFF',

    // Per-product line badge colours. German networks already colour-code these
    // (S-Bahn green, U-Bahn blue), so following the convention makes a board
    // scannable at a glance instead of a wall of identical grey badges.
    product: {
      highSpeed: { bg: '#E6E6FD', fg: '#4338CA' },
      longDistance: { bg: '#EFE7FE', fg: '#6D28D9' },
      regional: { bg: '#DDF2F8', fg: '#0E7490' },
      suburban: { bg: '#DAF4E1', fg: '#15803D' },
      metro: { bg: '#DFE9FE', fg: '#1D4ED8' },
      tram: { bg: '#FCE7F3', fg: '#BE185D' },
      bus: { bg: '#E6EAF1', fg: '#475569' },
      other: { bg: '#EBEEF6', fg: '#5A6178' },
    },
  },
  dark: {
    onTime: '#4ADE80',
    onTimeSoft: '#0E2E22',
    delay: '#FBBF24',
    delaySoft: '#33280C',
    cancelled: '#FB7185',
    cancelledSoft: '#3A1622',

    shadowCard: '0px 1px 2px rgba(0, 0, 0, 0.45)',
    shadowRaised: '0px 6px 20px rgba(0, 0, 0, 0.55)',

    serviceDb: '#EC0016',
    serviceDbOn: '#FFFFFF',

    product: {
      highSpeed: { bg: '#21244A', fg: '#A5B4FC' },
      longDistance: { bg: '#291F4D', fg: '#C4B5FD' },
      regional: { bg: '#0E2E36', fg: '#67E8F9' },
      suburban: { bg: '#12301D', fg: '#86EFAC' },
      metro: { bg: '#152546', fg: '#93C5FD' },
      tram: { bg: '#3B1229', fg: '#F9A8D4' },
      bus: { bg: '#252B3A', fg: '#CBD5E1' },
      other: { bg: '#1C2131', fg: '#98A1B8' },
    },
  },
};

export type ThemeColors = Palette & (typeof meaning)['light'] & { skeleton: string };

// High contrast sharpens whichever theme is picked rather than replacing it:
// text moves to 7:1 (WCAG AAA) against every surface it sits on, and borders
// darken until a card's edge is visible without its shadow.
const AAA = 7;

function highContrast(colors: ThemeColors, isDark: boolean): ThemeColors {
  const ink = isDark ? '#FFFFFF' : '#000000';
  const surfaces = [colors.background, colors.card, colors.muted];
  const product = Object.fromEntries(
    Object.entries(colors.product).map(([key, { bg, fg }]) => [
      key,
      { bg, fg: ensureContrast(fg, [bg], AAA, ink) },
    ]),
  ) as ThemeColors['product'];

  return {
    ...colors,
    foreground: ink,
    mutedForeground: ensureContrast(colors.mutedForeground, surfaces, AAA, ink),
    border: mix(colors.border, ink, 0.35),
    input: mix(colors.input, ink, 0.45),
    primary: ensureContrast(colors.primary, [colors.primaryForeground, colors.card], AAA, ink),
    accentForeground: ensureContrast(colors.accentForeground, [colors.accent], AAA, ink),
    onTime: ensureContrast(colors.onTime, [...surfaces, colors.onTimeSoft], AAA, ink),
    delay: ensureContrast(colors.delay, [...surfaces, colors.delaySoft], AAA, ink),
    cancelled: ensureContrast(colors.cancelled, [...surfaces, colors.cancelledSoft], AAA, ink),
    product,
  };
}

export function buildColors(name: ThemeName, isDark: boolean, contrast: boolean): ThemeColors {
  const palette = palettes[name][isDark ? 'dark' : 'light'];
  const colors = { ...palette, ...meaning[isDark ? 'dark' : 'light'], skeleton: palette.border };
  return contrast ? highContrast(colors, isDark) : colors;
}

// The swatch shown for each theme in Settings.
export function themeSwatch(name: ThemeName, isDark: boolean) {
  const { background, primary, accent } = palettes[name][isDark ? 'dark' : 'light'];
  return { background, primary, accent };
}

// Type and shape. Separate from colour, so any style combines with any theme.
//   classic — system font, round corners (the original look)
//   modern  — Manrope with Raleway headings, small corners
//   sharp   — system font, small corners
export type { UiStyle };
export const UI_STYLES: UiStyle[] = ['classic', 'modern', 'sharp'];

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

export type TypeScale = Record<keyof typeof baseType, TextStyle>;

// Font files loaded in app/_layout.tsx. A custom font carries one weight per
// file, so each weight maps to its own family and `fontWeight` is dropped —
// left in, Android would fake a bolder cut on top of the real one.
export const MODERN_FONTS = {
  Manrope_400Regular: require('@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf'),
  Manrope_500Medium: require('@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf'),
  Manrope_600SemiBold: require('@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf'),
  Manrope_700Bold: require('@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf'),
  Manrope_800ExtraBold: require('@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf'),
  Raleway_800ExtraBold: require('@expo-google-fonts/raleway/800ExtraBold/Raleway_800ExtraBold.ttf'),
};

const MANROPE: Record<string, keyof typeof MODERN_FONTS> = {
  '400': 'Manrope_400Regular',
  '500': 'Manrope_500Medium',
  '600': 'Manrope_600SemiBold',
  '700': 'Manrope_700Bold',
  '800': 'Manrope_800ExtraBold',
};
const HEADINGS = new Set<keyof typeof baseType>(['largeTitle', 'title', 'display']);

function buildType(style: UiStyle): TypeScale {
  if (style !== 'modern') return baseType;
  const entries = Object.entries(baseType).map(([key, { fontWeight, ...rest }]) => [
    key,
    {
      ...rest,
      fontFamily: HEADINGS.has(key as keyof typeof baseType)
        ? 'Raleway_800ExtraBold'
        : MANROPE[fontWeight],
    },
  ]);
  return Object.fromEntries(entries) as TypeScale;
}

// shadcn derives every corner from one `--radius`; so does this. Classic's
// base of 14 reproduces the original 10 / 14 / 20 / 28 steps.
function buildRadii(style: UiStyle) {
  const r = style === 'classic' ? 14 : 7;
  return {
    sm: Math.round(r * 0.7),
    md: r,
    lg: Math.round(r * 1.4),
    xl: r * 2,
    pill: 999,
  };
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
  name: ThemeName;
  style: UiStyle;
  isDark: boolean;
  colors: ThemeColors;
  type: TypeScale;
  radii: Radii;
};

export function buildTheme(options: {
  name: ThemeName;
  style: UiStyle;
  isDark: boolean;
  highContrast: boolean;
  fontsLoaded: boolean;
}): Theme {
  const { name, isDark, highContrast: contrast, fontsLoaded } = options;
  // Until the font files are in, Modern falls back to the system font rather
  // than rendering text in a family the platform can't find.
  const fontStyle = options.style === 'modern' && !fontsLoaded ? 'sharp' : options.style;
  return {
    name,
    style: options.style,
    isDark,
    colors: buildColors(name, isDark, contrast),
    type: buildType(fontStyle),
    radii: buildRadii(options.style),
  };
}
