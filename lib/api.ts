import type { DepartureRow, StationSearchResult } from '../types';

// Points at our own backend proxy (see /backend) — never call the DB API
// directly from the app. Set via EXPO_PUBLIC_API_BASE_URL at build time;
// falls back to the local `vercel dev` server.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

// Hosted from the same backend deployment (see backend/privacy-policy.html).
export const PRIVACY_POLICY_URL = `${API_BASE_URL}/privacy-policy.html`;

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    throw new ApiError(`Request to ${path} failed with ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

export function searchStations(query: string): Promise<StationSearchResult[]> {
  return request<StationSearchResult[]>(`/api/stations?query=${encodeURIComponent(query)}`);
}

export function getBoard(evaNo: string): Promise<DepartureRow[]> {
  return request<DepartureRow[]>(`/api/board/${encodeURIComponent(evaNo)}`);
}

export { ApiError };
