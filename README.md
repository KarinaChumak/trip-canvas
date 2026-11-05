# Trip canvas

A single-user demo where a chat agent answers with interactive React components
(generative UI): threads on any message or component, locked components on a
sticky shelf, and a dashboard.

- System design: https://claude.ai/artifact/5aCnqn6GFT85yhFfSWPLqn
- Implementation plan: https://claude.ai/artifact/UmdXr8Z5VbVrgUA9ierPo4

## Stack

pnpm workspace · React + Vite + TypeScript · Zustand + IndexedDB · json-render ·
AI SDK · Hono on Node · Zod · SQLite (quota)

## Layout

```
packages/catalog   shared component catalog (server validates, web renders)
apps/web           Vite + React client, port 5173, proxies /api → server
apps/server        Hono + AI SDK, port 8787
```

## Getting started

Requires Node 22+ and pnpm.

```bash
./scripts/install-deps.sh   # first time only
# add ANTHROPIC_API_KEY to apps/server/.env
pnpm dev
```

API keys live only in `apps/server/.env`, which is git-ignored. See
`apps/server/.env.example` for the full list and the phase each one is needed in.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | web and server in parallel |
| `pnpm typecheck` | type-check every package |
| `pnpm test` | Vitest unit tests |
