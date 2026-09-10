import type { ThemeColors } from './theme';

export type ProductKind = keyof ThemeColors['product'];

// Line labels arrive as "<category> <number>" — "S 3", "RE 30", "ICE 4523"
// (see backend/lib/merge.ts). Only the category decides the colour.
const CATEGORY_KIND: Record<string, ProductKind> = {
  // High-speed
  ICE: 'highSpeed',
  ECE: 'highSpeed',
  TGV: 'highSpeed',
  RJ: 'highSpeed',
  RJX: 'highSpeed',
  THA: 'highSpeed',
  // Other long distance, including night trains and open-access operators
  IC: 'longDistance',
  EC: 'longDistance',
  EN: 'longDistance',
  NJ: 'longDistance',
  D: 'longDistance',
  FLX: 'longDistance',
  FEX: 'longDistance',
  // City networks
  S: 'suburban',
  U: 'metro',
  STR: 'tram',
  T: 'tram',
  M: 'tram',
  BUS: 'bus',
  SEV: 'bus',
};

/**
 * Which product a departure belongs to, from its line label. Unknown *word*
 * categories fall back to `regional` — the long tail here is regional
 * operators (MEX, IRE, ALX, TER, …) and they all look and behave alike.
 * Labels with no category at all fall back to the neutral `other`.
 */
export function productKind(line: string): ProductKind {
  const category = /^\p{Letter}+/u.exec(line.trim())?.[0].toUpperCase();
  if (!category) return 'other';
  return CATEGORY_KIND[category] ?? 'regional';
}
