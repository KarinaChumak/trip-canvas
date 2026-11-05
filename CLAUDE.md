# Trip Canvas — Claude working rules

This is a demo Gen AI app.

## Start of every session
- Read the system design doc and the implementation plan in `/docs` before doing anything else:
  - `docs/Trip canvas — system design.md`
  - `docs/Trip canvas — implementation plan.md`

## Keeping the docs in sync
- If a decision made during the session contradicts the system design or the implementation plan, point out the contradiction, offer to update the relevant doc, and ask for permission.
- Update the docs only after explicit approval.
- `docs/` is gitignored: the docs live locally only and are never committed.

## Tests
- Never colocate tests with source files. Put unit tests in the package's `test/` folder, mirroring the `src/` structure: `apps/server/src/routes/chat.ts` → `apps/server/test/routes/chat.test.ts`.
- End-to-end tests go in `tests/e2e/` at the repo root.

## Git workflow
- Before starting any coding task, create a new branch off the current base with a clear, descriptive slug (e.g. `feat/hello-page-with-date`).
- Do not commit until the user has reviewed the changes and said to commit.
