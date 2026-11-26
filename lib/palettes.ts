import type { Skin } from '@/types';

// Pure data, type-only imports: test/palettes.test.ts imports this file under
// Node, which cannot resolve `@/` aliases or extensionless value imports.
//
// Tokens follow shadcn/ui's convention: every surface token has a matching
// `*Foreground` for the text and icons drawn on it. Components only ever name
// a role, so a skin never needs a component change.
//
// Every pair is contrast-checked at WCAG AA (4.5:1) in test/palettes.test.ts.
// Re-check a pair if you change either half.

export const SKINS: Skin[] = ['bahnsteig', 'anzeiger', 'netzplan'];

export type Palette = {
  background: string;
  foreground: string;
  // Raised surfaces: cards, list rows, sheets.
  card: string;
  // Inert fills (chips, icon wells) and the text that sits on them or anywhere
  // else as secondary copy.
  muted: string;
  mutedForeground: string;
  border: string;
  // Stronger outline for form controls, switch tracks.
  input: string;
  primary: string;
  primaryForeground: string;
  // Selected and highlighted: active filter chips, pressed rows.
  accent: string;
  accentForeground: string;
  // Focus outline for keyboard and web.
  ring: string;
  // The top band of a screen and the native stack header.
  header: string;
  headerForeground: string;
  // The platform tile (the station sign).
  sign: string;
  signForeground: string;
  // The step the rider is on now; one per screen at most.
  highlight: string;
  highlightForeground: string;
};

const anzeiger: Palette = {
  background: '#0A0A0B',
  foreground: '#F2EFE6',
  card: '#121213',
  muted: '#1D1D1F',
  mutedForeground: '#9A9586',
  border: '#2A2A2C',
  input: '#45443F',
  primary: '#FFB400',
  primaryForeground: '#0A0A0B',
  accent: '#2A2208',
  accentForeground: '#FFC83D',
  ring: '#FFB400',
  header: '#0A0A0B',
  headerForeground: '#FFB400',
  sign: '#0B3D91',
  signForeground: '#FFFFFF',
  highlight: '#FFB400',
  highlightForeground: '#0A0A0B',
};

// Anzeiger has one appearance; its light and dark are the same object.
export const PALETTES: Record<Skin, { light: Palette; dark: Palette }> = {
  bahnsteig: {
    light: {
      background: '#F7F8FA',
      foreground: '#0C1A33',
      card: '#FFFFFF',
      muted: '#E6E9EF',
      mutedForeground: '#56617A',
      border: '#E3E6EC',
      input: '#C5CCD9',
      primary: '#0B2F7A',
      primaryForeground: '#FFFFFF',
      accent: '#E3EAF8',
      accentForeground: '#0B2F7A',
      ring: '#5B84D6',
      header: '#0B2F7A',
      headerForeground: '#FFFFFF',
      sign: '#0B2F7A',
      signForeground: '#FFFFFF',
      highlight: '#FFD21F',
      highlightForeground: '#0C1A33',
    },
    dark: {
      background: '#0A1020',
      foreground: '#EEF2FA',
      card: '#131B30',
      muted: '#1C2640',
      mutedForeground: '#9AA6C0',
      border: '#232E4A',
      input: '#36425F',
      primary: '#8FB0FF',
      primaryForeground: '#0A1020',
      accent: '#1A2A55',
      accentForeground: '#B4C8FF',
      ring: '#3D63C4',
      header: '#0E2A66',
      headerForeground: '#FFFFFF',
      sign: '#1746A8',
      signForeground: '#FFFFFF',
      highlight: '#FFD21F',
      highlightForeground: '#0C1A33',
    },
  },
  anzeiger: { light: anzeiger, dark: anzeiger },
  netzplan: {
    light: {
      background: '#F3EFE6',
      foreground: '#15130F',
      card: '#FBF8F1',
      muted: '#E6E0D2',
      mutedForeground: '#5C5749',
      border: '#D8D2C2',
      input: '#B9B2A0',
      primary: '#15130F',
      primaryForeground: '#F3EFE6',
      accent: '#E6E0D2',
      accentForeground: '#15130F',
      ring: '#8F8A7D',
      header: '#F3EFE6',
      headerForeground: '#15130F',
      sign: '#15130F',
      signForeground: '#F3EFE6',
      highlight: '#FFD84A',
      highlightForeground: '#15130F',
    },
    dark: {
      background: '#14120E',
      foreground: '#F3EFE6',
      card: '#1E1B15',
      muted: '#2A261E',
      mutedForeground: '#A8A191',
      border: '#332E24',
      input: '#4D473A',
      primary: '#F3EFE6',
      primaryForeground: '#14120E',
      accent: '#2A261E',
      accentForeground: '#F3EFE6',
      ring: '#7A7466',
      header: '#14120E',
      headerForeground: '#F3EFE6',
      sign: '#F3EFE6',
      signForeground: '#14120E',
      highlight: '#FFD84A',
      highlightForeground: '#15130F',
    },
  },
};

// Colours that carry meaning: status (on time / delayed / cancelled), shadows
// and the DB service pill. Every `*Soft` value is a tint meant to sit *behind*
// its matching foreground.
type Status = {
  onTime: string;
  onTimeSoft: string;
  delay: string;
  delaySoft: string;
  cancelled: string;
  cancelledSoft: string;
  // `boxShadow` strings rather than the legacy shadow*/elevation props, which
  // don't render the same on the two platforms and can't be crossfaded.
  shadowCard: string;
  shadowRaised: string;
  // The "DB" service pill (components/ServicePill.tsx). DB's brand red in every
  // skin — it's a logo colour, not a status — and always a solid fill, so it
  // can't be mistaken for the text-only red of a cancellation.
  serviceDb: string;
  serviceDbOn: string;
};

const FLAT_SHADOW = '0px 0px 0px rgba(0, 0, 0, 0)';

const statusLight: Status = {
  onTime: '#047857',
  onTimeSoft: '#D6F5E4',
  delay: '#A3480A',
  delaySoft: '#FCEFD3',
  cancelled: '#BE123C',
  cancelledSoft: '#FFE0E6',
  shadowCard: '0px 1px 2px rgba(15, 19, 32, 0.06)',
  shadowRaised: '0px 6px 20px rgba(15, 19, 32, 0.10)',
  serviceDb: '#EC0016',
  serviceDbOn: '#FFFFFF',
};

const statusDark: Status = {
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
};

// Amber is Anzeiger's primary, so its delay colour must not be amber.
const statusAnzeiger: Status = {
  onTime: '#6FD98A',
  onTimeSoft: '#0F2A18',
  delay: '#FF8A4C',
  delaySoft: '#33190A',
  cancelled: '#FF6B7A',
  cancelledSoft: '#3A1218',
  shadowCard: FLAT_SHADOW,
  shadowRaised: FLAT_SHADOW,
  serviceDb: '#EC0016',
  serviceDbOn: '#FFFFFF',
};

export const STATUS: Record<Skin, { light: Status; dark: Status }> = {
  bahnsteig: { light: statusLight, dark: statusDark },
  anzeiger: { light: statusAnzeiger, dark: statusAnzeiger },
  // Flat: no shadows, otherwise today's values.
  netzplan: {
    light: { ...statusLight, shadowCard: FLAT_SHADOW, shadowRaised: FLAT_SHADOW },
    dark: { ...statusDark, shadowCard: FLAT_SHADOW, shadowRaised: FLAT_SHADOW },
  },
};

// Per-product line badge colours. German networks already colour-code these
// (S-Bahn green, U-Bahn blue), so following the convention makes a board
// scannable at a glance. Solid fills with white text.
export type ProductColors = Record<
  'highSpeed' | 'longDistance' | 'regional' | 'suburban' | 'metro' | 'tram' | 'bus' | 'other',
  { bg: string; fg: string }
>;

const solid = (bg: string) => ({ bg, fg: '#FFFFFF' });

const productSolid: ProductColors = {
  highSpeed: solid('#3730A3'),
  longDistance: solid('#6D28D9'),
  regional: solid('#C8102E'),
  suburban: solid('#15803D'),
  metro: solid('#1D4ED8'),
  tram: solid('#B0127A'),
  bus: solid('#475569'),
  other: solid('#5A6178'),
};

// The board is monochrome; the label carries the meaning.
const mono = { bg: '#F2EFE6', fg: '#0A0A0B' };
const productAnzeiger: ProductColors = {
  highSpeed: mono,
  longDistance: mono,
  regional: mono,
  suburban: mono,
  metro: mono,
  tram: mono,
  bus: mono,
  other: mono,
};

export const PRODUCT: Record<Skin, ProductColors> = {
  bahnsteig: productSolid,
  anzeiger: productAnzeiger,
  netzplan: productSolid,
};
