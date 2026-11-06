import { defineConfig } from 'vitest/config';

// One Vitest project per package, each with its own vitest.config.ts (environment,
// aliases). `pnpm test` runs them all; `pnpm test --project web` runs one.
export default defineConfig({
  test: {
    projects: ['apps/*/vitest.config.ts', 'packages/*/vitest.config.ts'],
  },
});
