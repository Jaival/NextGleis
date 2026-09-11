import type { IncomingMessage, ServerResponse } from 'node:http';
import { DbApiError } from './dbClient.js';
import { UpstreamTimeoutError } from './hafas/networks.js';
import { StopNotFoundError } from './hafas/resolve.js';

// The helpers Vercel's Node runtime adds to every request and response. Typed
// here instead of through @vercel/node, which supplied only these types and
// brought in a dev-only dependency tree that npm audit flags.
export interface ApiRequest extends IncomingMessage {
  query: Partial<Record<string, string | string[]>>;
}

export interface ApiResponse extends ServerResponse {
  status(code: number): ApiResponse;
  json(body: unknown): ApiResponse;
}

export function queryParam(req: ApiRequest, name: string): string | undefined {
  const raw = req.query[name];
  return (Array.isArray(raw) ? raw[0] : raw)?.trim() || undefined;
}

// hafas-client tags the errors it understood (the network answered with an
// error); anything else — a host that's down, a DNS failure — is a plain Error.
function isHafasError(err: unknown): err is Error & { code?: string } {
  return err instanceof Error && (err as { isHafasError?: boolean }).isHafasError === true;
}

export function sendError(res: ApiResponse, err: unknown): void {
  if (err instanceof DbApiError) {
    res.status(err.status >= 500 ? 502 : err.status).json({ error: err.message });
    return;
  }
  if (err instanceof StopNotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err instanceof UpstreamTimeoutError) {
    res.status(504).json({ error: err.message });
    return;
  }
  if (isHafasError(err)) {
    res.status(err.code === 'NOT_FOUND' ? 404 : 502).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
}
