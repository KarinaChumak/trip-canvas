import type { StorybookConfig } from '@storybook/react-vite';

// Stories live in `stories/`, mirroring `src/`, never next to the components.
// The React + Vite framework reuses `vite.config.ts`, so Tailwind and the `@/` alias just work.
const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.tsx'],
  addons: ['@storybook/addon-themes'],
  framework: '@storybook/react-vite',
};

export default config;
