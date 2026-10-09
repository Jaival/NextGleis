// The sources import each other as `./x.js`, which is what Vercel's compiled
// output needs. Run directly through Node's type stripping (Node 22.18 or
// later) there is no compiled output, so this points those at the `.ts`.
// Loaded by dev-server.mjs and, with `--import`, by the tests.
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';

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
