import type { Preview, ReactRenderer } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mswLoader } from 'msw-storybook-addon/csf3';
import '../src/index.css';

const preview: Preview = {
  parameters: { layout: 'padded' },
  // Starts MSW's worker; stories that load data add their handlers with `msw.use()` in `beforeEach`.
  loaders: [mswLoader()],
  decorators: [
    // A fresh query cache per story, so one story's loaded data never leaks into another.
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
    // shadcn's dark styles hang off a `.dark` class on <html>, as in the app (see src/lib/theme.ts).
    withThemeByClassName<ReactRenderer>({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
    }),
  ],
};

export default preview;
