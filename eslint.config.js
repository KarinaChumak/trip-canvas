import js from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// The CLAUDE.md code-style rules that a linter can check, so review doesn't have to.
const conventions = [
  {
    selector: "TSTypeAliasDeclaration[id.name='Props'], TSInterfaceDeclaration[id.name='Props']",
    message: 'Name a props type after its component: <ComponentName>Props.',
  },
  {
    selector: 'FunctionDeclaration > ObjectPattern > TSTypeAnnotation > TSTypeLiteral',
    message: 'No inline prop types: declare a <ComponentName>Props type.',
  },
  {
    selector: 'JSXSpreadAttribute',
    message: "Don't spread props: pass each one explicitly.",
  },
];

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/storybook-static/**',
      // Generated: copied in by the shadcn CLI or `msw init` (see CLAUDE.md, Code review).
      'apps/web/src/components/shadcn/**',
      'apps/web/src/components/ai-elements/**',
      'apps/web/.storybook/public/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // `_name` marks a value that is deliberately unused, e.g. one left out of a spread.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['apps/server/**/*.ts', 'packages/**/*.ts', '*.{js,ts}', 'apps/*/*.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, '@tanstack/query': pluginQuery },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...pluginQuery.configs.recommended.rules,
      // Data loading goes through TanStack Query, never useEffect + setState.
      'react-hooks/set-state-in-effect': 'error',
      'no-restricted-syntax': ['error', ...conventions],
    },
  },
);
