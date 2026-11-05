import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The web app's `@/` import alias, so its tests resolve the same paths as Vite.
  resolve: { alias: { '@': fileURLToPath(new URL('./apps/web/src', import.meta.url)) } },
  test: {
    // Unit tests live in each package's test/ folder, mirroring its src/ layout.
    include: ['apps/*/test/**/*.test.{ts,tsx}', 'packages/*/test/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'tests/e2e/**'],
  },
});
