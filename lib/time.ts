// Backend returns "YYYY-MM-DDTHH:mm:ss" as Europe/Berlin local wall-clock
// time (see backend/lib/hafas/normalize.ts) — slicing avoids re-interpreting
// it through Date/timezone parsing, which would risk shifting the displayed
// hour.
export function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

// Minutes between two of those wall-clock timestamps. Both are read as UTC,
// which is fine for a difference: the offset cancels out (bar a DST switch
// mid-trip).
export function minutesBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}Z`) - Date.parse(`${from}Z`)) / 60_000);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
