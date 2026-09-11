// Local stand-in for `vercel dev`: serves the handlers in api/ on
// http://localhost:3000 with Vercel's routes and request/response helpers, but
// without the Vercel CLI or an account. The TypeScript runs directly through
// Node's built-in type stripping (Node 22.18 or later).
import { existsSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The sources import each other as `./x.js`, which is what Vercel's compiled
// output needs. Here there is no compiled output, so point those at the `.ts`.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.startsWith('file:')) {
      const ts = new URL(specifier.replace(/\.js$/, '.ts'), context.parentURL);
      if (!existsSync(new URL(specifier, context.parentURL)) && existsSync(ts)) {
        return nextResolve(ts.href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

const API_DIR = fileURLToPath(new URL('./api/', import.meta.url));
const DYNAMIC = /^\[(\w+)\](\.ts)?$/;

// Vercel's filesystem routing: api/journeys.ts is /api/journeys, and
// api/board/[evaNo].ts is /api/board/:evaNo with `evaNo` added to the query.
// An exact name wins over a [param].
function findRoute(dir, segments, params = {}) {
  const [head, ...rest] = segments;
  if (head === undefined) return null;
  const entries = readdirSync(dir, { withFileTypes: true });
  const last = rest.length === 0;
  const candidates = entries.filter((entry) => (last ? entry.isFile() && entry.name.endsWith('.ts') : entry.isDirectory()));
  const exact = candidates.find((entry) => entry.name === (last ? `${head}.ts` : head));
  const dynamic = candidates.filter((entry) => DYNAMIC.test(entry.name));

  for (const entry of exact ? [exact, ...dynamic] : dynamic) {
    const param = entry === exact ? null : entry.name.match(DYNAMIC)[1];
    const nextParams = param ? { ...params, [param]: head } : params;
    const target = path.join(dir, entry.name);
    const found = last ? { file: target, params: nextParams } : findRoute(target, rest, nextParams);
    if (found) return found;
  }
  return null;
}

function sendJson(res, status, body) {
  res.statusCode = status;
  if (!res.hasHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
  return res;
}

const server = createServer(async (req, res) => {
  const started = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - started}ms`));

  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const segments = url.pathname.startsWith('/api/')
      ? url.pathname.slice('/api/'.length).split('/').filter(Boolean).map(decodeURIComponent)
      : [];
    const route = findRoute(API_DIR, segments);
    if (!route) {
      sendJson(res, 404, { error: `No handler for ${url.pathname}` });
      return;
    }

    const query = {};
    for (const [key, value] of url.searchParams) {
      query[key] = key in query ? [].concat(query[key], value) : value;
    }
    req.query = { ...query, ...route.params };
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (body) => sendJson(res, res.statusCode, body);

    const { default: handler } = await import(pathToFileURL(route.file).href);
    await handler(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) sendJson(res, 500, { error: 'Unexpected server error' });
  }
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => console.log(`NextGleis backend on http://localhost:${port}`));
