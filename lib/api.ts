import { Platform } from 'react-native';
import type {
  ArrivalRow,
  DepartureRow,
  JourneyPage,
  NearbyStop,
  StationSearchResult,
  Trip,
} from '@/types';

// On the Android emulator `localhost` resolves to the emulator itself, not the
// host machine running the backend — 10.0.2.2 is the host loopback alias.
const DEV_FALLBACK_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

// Points at our own backend proxy (see /backend) — never call the DB API
// directly from the app. Set via EXPO_PUBLIC_API_BASE_URL at build time;
// falls back to the local dev server (`npm start` in /backend).
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? DEV_FALLBACK_BASE_URL;

if (__DEV__ && !process.env.EXPO_PUBLIC_API_BASE_URL) {
  console.warn(
    `[api] EXPO_PUBLIC_API_BASE_URL is not set — falling back to ${API_BASE_URL}. ` +
      'Copy .env.example to .env to point the app at your backend.',
  );
}

// Hosted from the same backend deployment (see backend/privacy-policy.html).
export const PRIVACY_POLICY_URL = `${API_BASE_URL}/privacy-policy.html`;

// Mobile networks can leave a socket hanging indefinitely; without a deadline a
// stalled request never rejects, so React Query stays in `isFetching` forever
// and pull-to-refresh never settles.
const REQUEST_TIMEOUT_MS = 10_000;
// A journey search can first have to match both stops up in another network,
// and long cross-country routing is slow upstream (see
// backend/lib/hafas/journeys.ts), so it gets far longer.
const JOURNEYS_TIMEOUT_MS = 30_000;

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// React Native polyfills AbortSignal with the `abort-controller` package, which
// implements neither the static `AbortSignal.timeout()` nor `AbortSignal.any()`
// — so both are built by hand here rather than used from the spec.
async function request<T>(
  path: string,
  signal?: AbortSignal,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  // Forward React Query's cancellation (unmount, query key change) onto ours.
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!res.ok) {
      throw new ApiError(`Request to ${path} failed with ${res.status}`, res.status);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}

export function searchStations(
  query: string,
  signal?: AbortSignal,
): Promise<StationSearchResult[]> {
  return request<StationSearchResult[]>(`/api/stations?query=${encodeURIComponent(query)}`, signal);
}

export function getNearbyStops(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<NearbyStop[]> {
  return request<NearbyStop[]>(`/api/nearby?lat=${latitude}&lon=${longitude}`, signal);
}

// `from` (Berlin wall-clock, "YYYY-MM-DDTHH:mm") starts the board's two-hour
// window there instead of now.
function boardPath(kind: 'board' | 'arrivals', evaNo: string, from: string | null): string {
  const path = `/api/${kind}/${encodeURIComponent(evaNo)}`;
  return from ? `${path}?when=${encodeURIComponent(from)}` : path;
}

export function getBoard(
  evaNo: string,
  from: string | null,
  signal?: AbortSignal,
): Promise<DepartureRow[]> {
  return request<DepartureRow[]>(boardPath('board', evaNo, from), signal);
}

export function getArrivals(
  evaNo: string,
  from: string | null,
  signal?: AbortSignal,
): Promise<ArrivalRow[]> {
  return request<ArrivalRow[]>(boardPath('arrivals', evaNo, from), signal);
}

export function getTrip(id: string, signal?: AbortSignal): Promise<Trip> {
  return request<Trip>(`/api/trip?id=${encodeURIComponent(id)}`, signal);
}

// A time to leave after (or arrive before), or a step from a page already
// shown. `when` absent means "from now".
export type JourneyQuery =
  { when?: Date; arrival: boolean } | { earlier: string } | { later: string };

// `regionalOnly` leaves out trains the Deutschlandticket doesn't cover; it
// has to be the same for every page of one search.
export function getJourneys(
  from: string,
  to: string,
  query: JourneyQuery,
  regionalOnly: boolean,
  signal?: AbortSignal,
): Promise<JourneyPage> {
  const params: [string, string][] = [
    ['from', from],
    ['to', to],
    ['paged', '1'],
  ];
  if (regionalOnly) params.push(['regional', '1']);
  if ('earlier' in query) params.push(['earlier', query.earlier]);
  else if ('later' in query) params.push(['later', query.later]);
  else if (query.when) {
    params.push(['when', query.when.toISOString()]);
    if (query.arrival) params.push(['arrival', '1']);
  }
  // Built by hand rather than with URLSearchParams, which React Native only
  // partly implements.
  const search = params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return request<JourneyPage>(`/api/journeys?${search}`, signal, JOURNEYS_TIMEOUT_MS);
}

export { ApiError };
