// Backend returns "YYYY-MM-DDTHH:mm:00" as Europe/Berlin local wall-clock
// time (see backend/lib/merge.ts) — slicing avoids re-interpreting it through
// Date/timezone parsing, which would risk shifting the displayed hour.
export function formatTime(iso: string): string {
  return iso.slice(11, 16);
}
