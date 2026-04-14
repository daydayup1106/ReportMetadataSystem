import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import i18next from 'eslint-plugin-i18next'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      i18next,
    },
    rules: {
      'i18next/no-literal-string': ['warn', {
        markupOnly: true,
        ignoreAttribute: [
          'className', 'class', 'style', 'type', 'key', 'id', 'name',
          'href', 'src', 'alt', 'role', 'data-testid', 'viewBox', 'd',
          'fill', 'stroke', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin',
          'xmlns', 'inputMode', 'maxLength',
        ],
      }],
    },
  },
])
