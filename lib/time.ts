import type { Translate } from './i18n';
import type { Language } from '@/types';

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

// Times the user picks for a trip are real instants (a Date), but are shown
// and chosen in Berlin time like every time the backend returns — a visitor
// whose phone is still on another zone plans in the timetable's own clock.
export const TRANSIT_TIME_ZONE = 'Europe/Berlin';

function localeOf(language: Language): string {
  return language === 'de' ? 'de-DE' : 'en-GB';
}

function berlinDay(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TRANSIT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function formatClock(date: Date, language: Language): string {
  return new Intl.DateTimeFormat(localeOf(language), {
    timeZone: TRANSIT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

// "today", "tomorrow", or a short date like "Sat 12 Oct".
export function formatDay(date: Date, language: Language, t: Translate): string {
  const day = berlinDay(date);
  const now = Date.now();
  if (day === berlinDay(new Date(now))) return t('routes.today');
  if (day === berlinDay(new Date(now + 86_400_000))) return t('routes.tomorrow');
  return new Intl.DateTimeFormat(localeOf(language), {
    timeZone: TRANSIT_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

// "Now" as the same Berlin wall-clock string the backend sends, so the two
// compare as plain strings.
export function berlinNow(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TRANSIT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}`;
}

// A wall-clock timestamp moved by some minutes — read as UTC on purpose, like
// minutesBetween, so no timezone gets applied twice.
export function addMinutes(wall: string, minutes: number): string {
  return new Date(Date.parse(`${wall}Z`) + minutes * 60_000).toISOString().slice(0, 19);
}
