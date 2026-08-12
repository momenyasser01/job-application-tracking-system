import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import prettier from 'eslint-config-prettier/flat'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      'apps/api/drizzle/**',
      'apps/web/next-env.d.ts',
    ],
  },

  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Unused args are fine when prefixed with _ — Express error handlers need
      // all four parameters present even when one is unused.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unnecessary-condition': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },

  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { '@next/next': nextPlugin, 'react-hooks': reactHooks },
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,
      // Pages Router only — this app is App Router, and the rule warns on every
      // run because it cannot find a pages/ directory.
      '@next/next/no-html-link-for-pages': 'off',
    },
  },

  // Config files and plain JS are not in any tsconfig project.
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Must come last: turns off every rule Prettier already handles.
  prettier,
)
