import { HAFAS_USER_AGENT } from '../env.js';
import { withTimeout } from '../hafas/networks.js';
import type { EfaNetwork } from './networks.js';

const REQUEST_TIMEOUT_MS = 5_000;

export class EfaRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EfaRequestError';
  }
}

// Every EFA request shares these: JSON output, WGS84 coordinates, and the
// same contact-identifying user agent the HAFAS networks get (see
// HAFAS_USER_AGENT) — reused rather than duplicated, since it's the same
// courtesy for the same reason: a network that sees unusual traffic from
// this app can reach out instead of blocking it.
//
// systemMessages of type "error" are deliberately not treated as fatal here:
// a stop search routinely gets one (e.g. code -8011, "not uniquely matched")
// alongside a perfectly good list of locations, so the only reliable success
// signal is the HTTP status. A genuinely empty result (an unanswerable date,
// an unknown stop) just comes back as an empty locations/stopEvents array,
// which the caller already treats as "nothing found" rather than a crash.
export async function efaRequest<T>(
  network: EfaNetwork,
  request: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${network.endpoint}${request}`);
  url.searchParams.set('outputFormat', 'rapidJSON');
  url.searchParams.set('coordOutputFormat', 'WGS84[dd.ddddd]');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const res = await withTimeout(
    fetch(url, { headers: { 'User-Agent': HAFAS_USER_AGENT, Accept: 'application/json' } }),
    REQUEST_TIMEOUT_MS,
  );
  if (!res.ok) {
    throw new EfaRequestError(`${network.label} request to ${request} failed with ${res.status}`);
  }

  return (await res.json()) as T;
}
