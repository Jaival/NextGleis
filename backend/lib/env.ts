export const DB_API_BASE_URL =
  process.env.DB_API_BASE_URL ?? 'https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1';

export function getDbCredentials(): { clientId: string; apiKey: string } {
  const clientId = process.env.DB_CLIENT_ID;
  const apiKey = process.env.DB_API_KEY;
  if (!clientId || !apiKey) {
    throw new Error('Missing DB_CLIENT_ID or DB_API_KEY environment variables');
  }
  return { clientId, apiKey };
}
