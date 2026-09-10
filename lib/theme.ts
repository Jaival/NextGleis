import type { TextStyle } from 'react-native';

// Palette. Cool, near-neutral greys carry the surfaces; a single saturated
// indigo carries every interactive affordance. Status colours (on time /
// delayed / cancelled) are the only other hues that ever appear on their own,
// so a coloured element in a departure row always means something.
//
// Every `*Soft` value is a tint meant to sit *behind* its matching foreground —
// the pairs are contrast-checked at AA for the 12px bold badge text that uses
// them, so don't swap one half without re-checking the other.

export const lightColors = {
  background: '#F4F6FB',
  surface: '#FFFFFF',
  // Inert fills: chips, skeleton bars, icon wells. One step off `background`
  // so it reads on both `background` and `surface`.
  surfaceMuted: '#EBEEF6',
  border: '#E3E7F0',
  borderStrong: '#CED5E4',

  primary: '#4F46E5',
  primarySoft: '#E9E8FD',
  // Text/icons drawn *on* `primary`. Fixed per mode, not derived.
  primaryOn: '#FFFFFF',
  accent: '#7C3AED',

  textPrimary: '#0F1320',
  textSecondary: '#5A6178',
  textTertiary: '#878FA5',

  onTime: '#047857',
  onTimeSoft: '#D6F5E4',
  delay: '#B45309',
  delaySoft: '#FCEFD3',
  cancelled: '#BE123C',
  cancelledSoft: '#FFE0E6',

  // Filter chips default to all-on, so a solid primary fill turns the whole
  // row into a band of accent. Selected is a tint with a primary outline;
  // deselected recedes into the surface.
  chipBg: '#EBEEF6',
  chipBgActive: '#E9E8FD',
  chipText: '#6B7387',
  chipTextActive: '#4F46E5',

  // `boxShadow` strings rather than the legacy shadow*/elevation props, which
  // don't render the same on the two platforms and can't be crossfaded.
  shadowCard: '0px 1px 2px rgba(15, 19, 32, 0.06)',
  shadowRaised: '0px 6px 20px rgba(15, 19, 32, 0.10)',

  skeleton: '#E3E7F0',

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
};

export const darkColors: typeof lightColors = {
  background: '#0A0C13',
  surface: '#141826',
  surfaceMuted: '#1C2131',
  border: '#232839',
  borderStrong: '#333A4F',

  primary: '#818CF8',
  primarySoft: '#1E2140',
  primaryOn: '#0A0C13',
  accent: '#A78BFA',

  textPrimary: '#ECEFF8',
  textSecondary: '#98A1B8',
  textTertiary: '#6D7589',

  onTime: '#4ADE80',
  onTimeSoft: '#0E2E22',
  delay: '#FBBF24',
  delaySoft: '#33280C',
  cancelled: '#FB7185',
  cancelledSoft: '#3A1622',

  chipBg: '#1C2131',
  chipBgActive: '#1E2140',
  chipText: '#8B93A6',
  chipTextActive: '#A5B4FC',

  shadowCard: '0px 1px 2px rgba(0, 0, 0, 0.45)',
  shadowRaised: '0px 6px 20px rgba(0, 0, 0, 0.55)',

  skeleton: '#232839',

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
};

export type ThemeColors = typeof lightColors;

// Named steps for every (fontSize, fontWeight) pair actually in use across the
// app, so screens/components reference a token instead of a raw pair. Large
// steps carry negative tracking — at display sizes the system font's default
// tracking reads loose and dated.
export const type = {
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

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};
