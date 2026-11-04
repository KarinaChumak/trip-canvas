#!/usr/bin/env bash
# One-time dependency install for the Setup phase.
# Run from the repo root on your own machine: ./scripts/install-deps.sh
# Versions are resolved from npm at install time and pinned in pnpm-lock.yaml.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Install it with:  npm install -g pnpm   (or: corepack enable pnpm)" >&2
  exit 1
fi

# web: Vite + React base, then the plan's libraries
pnpm --filter web add react react-dom
pnpm --filter web add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node
pnpm --filter web add ai @ai-sdk/react @json-render/core @json-render/react zustand idb-keyval zod react-grid-layout maplibre-gl

# server
pnpm --filter server add hono @hono/node-server ai @ai-sdk/anthropic zod better-sqlite3 lru-cache
pnpm --filter server add -D tsx typescript @types/node @types/better-sqlite3

# catalog
pnpm --filter catalog add @json-render/core zod
pnpm --filter catalog add -D typescript

# tests
pnpm add -D -w vitest @playwright/test typescript

# local env file for the server
[ -f apps/server/.env ] || cp apps/server/.env.example apps/server/.env

echo
echo "Done. Next:"
echo "  1. Put your ANTHROPIC_API_KEY in apps/server/.env"
echo "  2. pnpm dev   → http://localhost:5173 should say 'Server: up'"
echo "  3. git add -A && git commit -m 'chore: install dependencies'"
