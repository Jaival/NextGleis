// The API's times are Europe/Berlin wall-clock strings ("YYYY-MM-DDTHH:mm:ss"),
// the contract the app reads. These convert between that and real instants
// with Intl, rather than a fixed offset, so they stay right across a DST
// change.
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

export function berlinWallClock(instant: Date): string {
  const parts = BERLIN_FORMATTER.formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
}

const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

// The instant a Berlin wall-clock time names, or null if it isn't one. Berlin
// is UTC+1 or UTC+2, so one of those two offsets maps back to the same wall
// clock. A time inside the spring-forward gap (02:30 on that Sunday) maps to
// neither and is read as winter time, which lands on the first minute after
// the gap — what a rider asking for "02:30" would want.
export function fromBerlinWallClock(wall: string): Date | null {
  const match = WALL_CLOCK.exec(wall);
  if (!match) return null;
  const [, year, month, day, hour, minute, second = '00'] = match;
  const asUtc = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second);
  if (Number.isNaN(asUtc)) return null;

  const normalized = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  for (const offsetHours of [2, 1]) {
    const candidate = new Date(asUtc - offsetHours * 3_600_000);
    if (berlinWallClock(candidate) === normalized) return candidate;
  }
  return new Date(asUtc - 3_600_000);
}
