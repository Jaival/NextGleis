import type { DepartureRow, ServiceKind } from '../../types/index.js';
import { classifyService, lineLabel } from '../lines.js';
import type { EfaLocation, EfaStopEvent } from './types.js';

// EFA timestamps are UTC ("...Z"), unlike HAFAS's which already carry the
// Europe/Berlin offset — see hafas/normalize.ts's wallClock. Everything here
// runs in that timezone, so this does the real conversion rather than a
// string slice.
const BERLIN_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function wallClock(isoUtc: string): string {
  const parts = BERLIN_FORMATTER.formatToParts(new Date(isoUtc));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
}

function delayMinutes(plannedIso: string, estimatedIso: string): number {
  return Math.max(0, Math.round((Date.parse(estimatedIso) - Date.parse(plannedIso)) / 60_000));
}

// EFA's product names are display text ("Stadtbahn", "Regionalbus"), not the
// short codes HAFAS categories already use — translated here so lineLabel and
// classifyService (shared with the HAFAS path) treat them the same way.
// Stuttgart and Karlsruhe's Stadtbahn lines are U-prefixed on their own
// signage ("U12"), so that's the canonical category riders already know it by.
const EFA_CATEGORY_ALIASES: Record<string, string> = {
  STADTBAHN: 'U',
  STRASSENBAHN: 'Tram',
  STADTBUS: 'Bus',
  REGIONALBUS: 'Bus',
  SCHNELLBUS: 'Bus',
  FÄHRE: 'Ferry',
  SCHIFF: 'Ferry',
};

function efaCategory(productName: string | undefined): string | undefined {
  const trimmed = productName?.trim();
  if (!trimmed) return undefined;
  return EFA_CATEGORY_ALIASES[trimmed.toUpperCase()] ?? trimmed;
}

function describeLine(event: EfaStopEvent): { label: string; kind: ServiceKind; operator?: string } {
  const t = event.transportation;
  const category = efaCategory(t?.product?.name);
  const operator = t?.operator?.name;
  const kind = classifyService({ category, product: t?.product?.name, operator });
  const name = t?.disassembledName ?? t?.number ?? t?.name;
  return { label: lineLabel(category, name, { rail: kind !== 'transit' }), kind, operator };
}

// The bare platform number, not EFA's display label ("Gleis 3") — the app
// localizes and formats the platform text itself (see departure.platform in
// lib/i18n), so a German label baked in here would double up.
function platformNumber(text: string | undefined): string | undefined {
  return text?.match(/\d+/)?.[0];
}

// EFA always sends both platformName and plannedPlatformName, identical when
// nothing changed — unlike HAFAS, which only sends a planned value when it
// differs. The comparison has to happen here instead.
function changedPlatform(location: EfaLocation | undefined): {
  platform?: string;
  plannedPlatform?: string;
} {
  const properties = location?.properties;
  const platform = properties?.platform ?? platformNumber(properties?.platformName);
  const planned = platformNumber(properties?.plannedPlatformName);
  if (!platform) return {};
  if (planned && planned !== platform) return { platform, plannedPlatform: planned };
  return { platform };
}

export function toDepartureRow(event: EfaStopEvent): DepartureRow | null {
  const planned = event.departureTimePlanned;
  if (!planned) return null;

  const line = describeLine(event);
  const row: DepartureRow = {
    line: line.label,
    direction: event.transportation?.destination?.name ?? '',
    scheduledTime: wallClock(planned),
    cancelled: Boolean(event.isCancelled),
    kind: line.kind,
  };

  if (!row.cancelled && event.departureTimeEstimated) {
    row.actualTime = wallClock(event.departureTimeEstimated);
    row.delayMinutes = delayMinutes(planned, event.departureTimeEstimated);
  }

  const { platform, plannedPlatform } = changedPlatform(event.location);
  if (platform) row.platform = platform;
  if (plannedPlatform) row.plannedPlatform = plannedPlatform;
  if (line.operator) row.operator = line.operator;

  return row;
}
