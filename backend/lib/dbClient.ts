import { DB_API_BASE_URL, getDbCredentials } from './env.js';
import { UpstreamTimeoutError } from './hafas/networks.js';

const REQUEST_TIMEOUT_MS = 5_000;

export class DbApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'DbApiError';
    this.status = status;
  }
}

// Header names per the Timetables OpenAPI spec's securitySchemes
// (ClientID -> "DB-Client-ID", ClientSecret -> "DB-Api-Key").
export async function fetchDbXml(path: string): Promise<string> {
  const { clientId, apiKey } = getDbCredentials();

  // The signal covers the body as well as the headers. Never put header
  // values in a message: they are the server's credentials.
  try {
    const res = await fetch(`${DB_API_BASE_URL}${path}`, {
      headers: {
        'DB-Client-ID': clientId,
        'DB-Api-Key': apiKey,
        Accept: 'application/xml',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new DbApiError(`DB API request to ${path} failed with ${res.status}`, res.status);
    }
    return await res.text();
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') throw new UpstreamTimeoutError(REQUEST_TIMEOUT_MS);
    throw err;
  }
}
