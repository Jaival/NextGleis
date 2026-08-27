import { DB_API_BASE_URL, getDbCredentials } from './env';

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

  const res = await fetch(`${DB_API_BASE_URL}${path}`, {
    headers: {
      'DB-Client-ID': clientId,
      'DB-Api-Key': apiKey,
      Accept: 'application/xml',
    },
  });

  if (!res.ok) {
    throw new DbApiError(`DB API request to ${path} failed with ${res.status}`, res.status);
  }

  return res.text();
}
