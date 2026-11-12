# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Checks

Run before every commit. CI runs the same.

App (repo root):

    npm run typecheck
    npm test
    npm run lint
    npm run format:check
    npx expo install --check

Backend (`backend/`):

    npm run typecheck
    npm test
    npm audit --omit=dev --audit-level=high

## Where to read first

- `README.md` — architecture and scripts
- `THINGS_TO_KNOW.md` — data-source limits and decided trade-offs
- `docs/ROADMAP.md` — what's next
- `PRODUCT_SPEC.md` and `CLAUDE_CODE_PROMPT.md` are historical; don't follow them.
