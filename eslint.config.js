import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

/**
 * Feature-boundary rules.
 * The engine layers (simulation, elements, renderer) must stay free of React/DOM
 * so they can move to a Web Worker later, and must never import UI features.
 */
const engineLayers = ['src/features/simulation/**', 'src/features/elements/**', 'src/features/renderer/**'];

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['flat/recommended'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    // shadcn primitives export their cva variant helpers alongside the component by design
    files: ['src/shared/ui/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // shared/ must not know about features
    files: ['src/shared/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@/features/*', '**/features/*'], message: 'shared/ must not import from features/.' }] },
      ],
    },
  },
  {
    // engine layers: no React, no UI features
    files: engineLayers,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-dom', 'react/*', 'zustand', 'zustand/*'], message: 'Engine layers must stay framework-free.' },
            {
              group: [
                '@/features/brush/*',
                '@/features/palette/*',
                '@/features/controls/*',
                '@/features/stats/*',
                '@/features/sandbox/*',
                '@/app/*',
              ],
              message: 'Engine layers must not depend on UI features.',
            },
          ],
        },
      ],
    },
  },
  {
    // simulation never imports concrete elements (registry is injected)
    files: ['src/features/simulation/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@/features/elements/*'], message: 'simulation receives the registry by injection; do not import elements.' }] },
      ],
    },
  },
  {
    // UI features never reach into grid internals
    files: ['src/features/palette/**', 'src/features/controls/**', 'src/features/stats/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/features/simulation/grid', '@/features/simulation/engine', '@/features/renderer/*'], message: 'UI features talk to the engine through EngineContext / sandboxStore only.' },
          ],
        },
      ],
    },
  },
]);
