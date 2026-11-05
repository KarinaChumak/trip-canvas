import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit tests live in each package's test/ folder, mirroring its src/ layout.
    include: ['apps/*/test/**/*.test.{ts,tsx}', 'packages/*/test/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'tests/e2e/**'],
  },
});
