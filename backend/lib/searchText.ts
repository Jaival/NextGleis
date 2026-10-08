// Shared by hafas/search.ts and efa/search.ts so a query is matched against
// stop names the same way regardless of which source returned them.

export function normalizeStopName(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mark}/gu, '')
    .replace(/ß/g, 'ss')
    .replace(/hauptbahnhof/g, 'hbf');
}

export function tokenize(query: string): string[] {
  return normalizeStopName(query)
    .split(/[^\p{Letter}\p{Number}]+/u)
    .filter(Boolean);
}
