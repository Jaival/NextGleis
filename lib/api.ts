import { Platform } from 'react-native';
import type { DepartureRow, Journey, StationSearchResult } from '@/types';

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

export function getBoard(evaNo: string, signal?: AbortSignal): Promise<DepartureRow[]> {
  return request<DepartureRow[]>(`/api/board/${encodeURIComponent(evaNo)}`, signal);
}

export function getJourneys(from: string, to: string, signal?: AbortSignal): Promise<Journey[]> {
  return request<Journey[]>(
    `/api/journeys?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    signal,
    JOURNEYS_TIMEOUT_MS,
  );
}

export { ApiError };
