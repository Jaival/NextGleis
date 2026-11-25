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

## Device QA (emulator)

- Drive the emulator only through the command `device_open` returns (agent-device). Never use raw `adb` for input.
- Batch the steps: write one screen's taps, fills and screenshots to a steps file and run
  `agent-device batch --steps-file <file> --on-error stop`. One call per screen, not one call per tap.
- Cap the pass: at most 10 screens per run, then report what you found and stop.
- Run a full screenshot pass with the `device-qa` agent so only its summary comes back to the main thread.

## Where to read first

- `README.md` — architecture and scripts
- `THINGS_TO_KNOW.md` — data-source limits and decided trade-offs
- `docs/ROADMAP.md` — what's next
- `PRODUCT_SPEC.md` and `CLAUDE_CODE_PROMPT.md` are historical; don't follow them.
