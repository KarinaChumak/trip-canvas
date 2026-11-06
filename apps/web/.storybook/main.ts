import type { StorybookConfig } from '@storybook/react-vite';

// Stories live in `stories/`, mirroring `src/`, never next to the components.
// The React + Vite framework reuses `vite.config.ts`, so Tailwind and the `@/` alias just work.
const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.tsx'],
  addons: ['@storybook/addon-themes'],
  // MSW's service worker (`msw init .storybook/public`); served by Storybook only, never shipped with the app.
  staticDirs: ['./public'],
  framework: '@storybook/react-vite',
};

export default config;
