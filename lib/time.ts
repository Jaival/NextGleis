import type { Translate } from './i18n';

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

export function formatDuration(minutes: number, t: Translate): string {
  return t('common.duration', Math.floor(minutes / 60), minutes % 60);
}
