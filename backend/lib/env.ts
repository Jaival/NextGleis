export const DB_API_BASE_URL =
  process.env.DB_API_BASE_URL ?? 'https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1';

// hafas-client sends this as the User-Agent so network operators can tell who
// is calling — set it to something that identifies the deployment (a URL or a
// contact address). It has to be more than a bare name: VBB's firewall turns
// away "NextGleis" alone with an HTML error page.
export const HAFAS_USER_AGENT =
  process.env.HAFAS_USER_AGENT || 'NextGleis (https://github.com/Jaival/NextGleis)';

// The DB Timetables API is only a fallback now (see lib/timetables.ts), so
// running without credentials is a supported setup.
export function hasDbCredentials(): boolean {
  return Boolean(process.env.DB_CLIENT_ID && process.env.DB_API_KEY);
}

export function getDbCredentials(): { clientId: string; apiKey: string } {
  const clientId = process.env.DB_CLIENT_ID;
  const apiKey = process.env.DB_API_KEY;
  if (!clientId || !apiKey) {
    throw new Error('Missing DB_CLIENT_ID or DB_API_KEY environment variables');
  }
  return { clientId, apiKey };
}
