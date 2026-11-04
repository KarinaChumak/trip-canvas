import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apps/*/src/**/*.test.ts', 'packages/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'tests/e2e/**'],
    // Phase 1 adds the first tests in a later PR; until then an empty run is fine.
    passWithNoTests: true,
  },
});
