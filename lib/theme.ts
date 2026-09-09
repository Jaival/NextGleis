import type { TextStyle } from 'react-native';

export const lightColors = {
  background: '#FAFAF7',
  surface: '#FFFFFF',
  border: '#E4E1D8',

  primary: '#0F6657',
  primarySoft: '#E3F0EC',

  textPrimary: '#1C1C18',
  textSecondary: '#6B6860',

  onTime: '#1F8A5F',
  onTimeSoft: '#E4F5EC',
  delay: '#C97A1D',
  delaySoft: '#FBEEDD',
  cancelled: '#B3261E',
  cancelledSoft: '#FBE9E7',

  chipBg: '#F1EFE9',
  chipBgActive: '#0F6657',
  chipText: '#3F3D36',
  chipTextActive: '#FFFFFF',
};

export const darkColors: typeof lightColors = {
  background: '#111310',
  surface: '#1B1E1A',
  border: '#2E322D',

  primary: '#3FBF9F',
  primarySoft: '#1D2E28',

  textPrimary: '#F2F1EA',
  textSecondary: '#A6A399',

  onTime: '#4FCB94',
  onTimeSoft: '#173A2B',
  delay: '#E3A24E',
  delaySoft: '#3D2E17',
  cancelled: '#F0655C',
  cancelledSoft: '#3D1F1C',

  chipBg: '#262A24',
  chipBgActive: '#3FBF9F',
  chipText: '#D8D5CA',
  chipTextActive: '#0E1310',
};

export type ThemeColors = typeof lightColors;

// Named steps for every (fontSize, fontWeight) pair actually in use across the
// app, so screens/components reference a token instead of a raw pair. Sizes
// are unchanged from before this scale existed — this is a naming pass, not
// a visual redesign.
export const type = {
  title: { fontSize: 28, fontWeight: '800' },
  display: { fontSize: 18, fontWeight: '800' },
  headline: { fontSize: 16, fontWeight: '700' },
  headlineMedium: { fontSize: 16, fontWeight: '600' },
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
} as const satisfies Record<string, TextStyle>;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};
