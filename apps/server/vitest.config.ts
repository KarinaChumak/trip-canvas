import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'server',
    environment: 'node',
    // Unit tests live in test/, mirroring src/.
    include: ['test/**/*.test.ts'],
  },
});
