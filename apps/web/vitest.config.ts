import { defineProject, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Reuses vite.config.ts, so tests resolve the `@/` alias and JSX exactly like the app.
export default mergeConfig(
  viteConfig,
  defineProject({
    test: {
      name: 'web',
      // Components are tested with renderToStaticMarkup, which needs no DOM.
      environment: 'node',
      include: ['test/**/*.test.{ts,tsx}'],
    },
  }),
);
