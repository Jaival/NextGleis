import type { ThemeColors } from './theme';

export type ProductKind = keyof ThemeColors['product'];

// Line labels arrive as "<category> <number>" — "S 3", "RE 30", "ICE 4523",
// "Tram 6" (see backend/lib/lines.ts). Only the category decides the colour.
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
  TRAM: 'tram',
  STR: 'tram',
  T: 'tram',
  M: 'tram',
  RT: 'tram', // Kassel's RegioTram
  BUS: 'bus',
  SEV: 'bus',
  // On-demand shared taxis standing in for a bus route
  AST: 'bus',
  ALT: 'bus',
  RUF: 'bus',
  FERRY: 'other',
};

/**
 * Which product a departure belongs to, from its line label. Unknown *word*
 * categories fall back to `regional` — the long tail here is regional
 * operators (MEX, IRE, ALX, TER, …) and they all look and behave alike.
 * Labels with no category at all fall back to the neutral `other`.
 */
/**
 * Whether a line is a train the Deutschlandticket doesn't cover: ICE, IC/EC,
 * night trains, FlixTrain. Decided by category alone, so the few IC routes a
 * region has opened to the ticket still count as long-distance here.
 */
export function needsLongDistanceTicket(line: string): boolean {
  const kind = productKind(line);
  return kind === 'highSpeed' || kind === 'longDistance';
}

export function productKind(line: string): ProductKind {
  const category = /^\p{Letter}+/u.exec(line.trim())?.[0].toUpperCase();
  if (!category) return 'other';
  return CATEGORY_KIND[category] ?? 'regional';
}
