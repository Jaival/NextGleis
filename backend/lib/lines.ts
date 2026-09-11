import type { ServiceKind } from '../types/index.js';

// Line labels and service kinds, shared by both board sources (HAFAS and the
// DB Timetables fallback) so a line reads the same whichever one served it.

// Networks spell one category several ways ("Str", "Strab", "STR", "Tram";
// "U", "U-Bahn"). Folding them onto one spelling keeps the board's line filter
// from listing "Str 6" and "Tram 6" as two lines, and gives the app a single
// name to pick a colour by (see lib/product.ts in the app).
const CATEGORY_ALIASES: Record<string, string> = {
  STR: 'Tram',
  STRAB: 'Tram',
  TRA: 'Tram',
  TRAM: 'Tram',
  'U-BAHN': 'U',
  'S-BAHN': 'S',
  BUS: 'Bus',
  FÄHRE: 'Ferry',
  SCHIFF: 'Ferry',
  FERRY: 'Ferry',
};

export function canonicalCategory(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return CATEGORY_ALIASES[trimmed.toUpperCase()] ?? trimmed;
}

// Every spelling a line name might open with for this category, longest first
// so "Strab 5" loses "Strab" rather than just "Str".
function categoryPrefixes(raw: string | undefined, category: string): string[] {
  const aliases = Object.keys(CATEGORY_ALIASES).filter((alias) => CATEGORY_ALIASES[alias] === category);
  return [...new Set([raw?.trim() ?? '', category, ...aliases])]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

function stripPrefix(name: string, prefixes: string[]): string {
  const upper = name.toUpperCase();
  for (const prefix of prefixes) {
    // Only a whole word counts: "S" must not eat the start of "SEV".
    if (upper.startsWith(prefix.toUpperCase()) && !/\p{Letter}/u.test(name.charAt(prefix.length))) {
      return name.slice(prefix.length).trim();
    }
  }
  return name;
}

// The category ("S", "RE", "ICE", "Bus") and the line name ("3", "S3",
// "Bus 55", "248") are joined as "<category> <number>". Neither identifies a
// service on its own: without the join a board mixes "3" and "ICE 4523" in the
// same column, and the app can't tell which product a row is to colour it.
//
// The catch: the name is sometimes bare ("7") and sometimes already carries
// the category ("S7", "Str 6"), so it has to be stripped before joining or the
// label comes out as "S S7".
export function lineLabel(
  rawCategory: string | undefined,
  name: string | undefined,
  { rail = false }: { rail?: boolean } = {},
): string {
  const category = canonicalCategory(rawCategory);
  const number = name?.trim();
  if (!number) return category ?? '';
  if (!category) {
    // No category to join with — at least split a run-together "RB58" so the
    // label matches the spacing of the rows that do have one.
    return number.replace(/^(\p{Letter}+)\s*(\d)/u, '$1 $2');
  }

  // Some networks file a train under a broad category and put the real one in
  // its name: INSA lists Stuttgart's "MEX13" and "RE1" under "DRE". For trains
  // the name's own category is the one riders know, so it wins. Not for buses
  // and trams, where letters in the name belong to the route ("Bus M36",
  // "Bus X3") rather than naming a category.
  if (rail) {
    const own = /^(\p{Letter}{2,})\s*(\d.*)$/u.exec(number);
    if (own && canonicalCategory(own[1]) !== category) return `${own[1]} ${own[2]}`;
  }

  const bare = stripPrefix(number, categoryPrefixes(rawCategory, category));
  return bare ? `${category} ${bare}` : category;
}

const TRANSIT_CATEGORIES = new Set([
  'BUS',
  'TRAM',
  'U',
  'RT', // Kassel's RegioTram
  'SEV', // rail replacement bus
  'AST',
  'ALT',
  'RUF',
  'FERRY',
  'TAXI',
]);

// Product ids are each profile's own vocabulary, and a few profiles file lines
// under the wrong one (VBN lists trams as "dial-a-ride", Saarfahrplan swaps bus
// and Saarbahn), so they're only a fallback behind the category.
const TRANSIT_PRODUCT = /bus|tram|subway|u-?bahn|metro|ferry|watercraft|taxi|on-?call|dial|cable|gondola|anruf/i;

// DB's own companies trade as "DB …" (DB Fernverkehr AG, DB Regio AG S-Bahn
// Rhein-Main, …) — except the Berlin and Hamburg S-Bahn companies, which DB
// owns outright but which run under their own names.
const DB_OPERATOR = /^DB\b|Deutsche Bahn|^S-Bahn (Berlin|Hamburg)\b/i;

// Categories only DB runs in Germany — used when a network leaves the
// operator out.
const DB_ONLY_CATEGORIES = new Set(['ICE', 'IC', 'EC', 'ECE']);

export function classifyService(service: {
  category?: string;
  product?: string;
  operator?: string;
}): ServiceKind {
  const category = canonicalCategory(service.category)?.toUpperCase();
  if (
    (category && TRANSIT_CATEGORIES.has(category)) ||
    (service.product && TRANSIT_PRODUCT.test(service.product))
  ) {
    return 'transit';
  }
  if (service.operator) return DB_OPERATOR.test(service.operator) ? 'db' : 'rail';
  return category && DB_ONLY_CATEGORIES.has(category) ? 'db' : 'rail';
}
